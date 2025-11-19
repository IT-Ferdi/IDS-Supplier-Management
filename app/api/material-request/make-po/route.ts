// app/api/material-request/make-po/route.ts
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

type PoMeta = { po_name?: string; supplier?: string; transaction_date?: string };

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const item_codes: string[] = Array.isArray(body?.item_codes) ? body.item_codes.map(String) : [];
        const po_meta: PoMeta = body?.po_meta ?? {};

        if (!Array.isArray(item_codes) || item_codes.length === 0) {
            return NextResponse.json({ error: 'item_codes must be a non-empty array' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB_SUPPLIER || 'sales_dashboard');
        const coll = db.collection('material_request');

        // 1) Find MR docs that have at least one item matching item_codes AND qty > qty_total_po
        const docs = await coll.find({
            'items.item_code': { $in: item_codes },
            $expr: {
                $gt: [
                    {
                        $size: {
                            $filter: {
                                input: '$items',
                                as: 'it',
                                cond: {
                                    $and: [
                                        { $in: ['$$it.item_code', item_codes] },
                                        { $gt: [{ $ifNull: ['$$it.qty', 0] }, { $ifNull: ['$$it.qty_total_po', 0] }] }
                                    ]
                                }
                            }
                        }
                    },
                    0
                ]
            }
        }).project({ name: 1, items: 1 }).toArray();

        // build n8n payload: one entry per MR-item outstanding
        const webhookPayload: { mr_name: string; item_code: string }[] = [];
        docs.forEach((doc: any) => {
            (doc.items || []).forEach((it: any) => {
                if (!it) return;
                const code = it.item_code;
                const qty = Number(it.qty ?? 0);
                const totPo = Number(it.qty_total_po ?? 0);
                if (!code) return;
                if (item_codes.includes(code) && qty > totPo) {
                    webhookPayload.push({ mr_name: doc.name, item_code: code });
                }
            });
        });

        // 2) Build aggregation-pipeline update that sets is_po = true only for matching items
        // Note: we do NOT change qty_total_po or po_detail here — n8n will perform the refresh.
        const updatePipeline = [
            {
                $set: {
                    items: {
                        $map: {
                            input: '$items',
                            as: 'it',
                            in: {
                                $cond: [
                                    {
                                        $and: [
                                            { $in: ['$$it.item_code', item_codes] },
                                            { $gt: [{ $ifNull: ['$$it.qty', 0] }, { $ifNull: ['$$it.qty_total_po', 0] }] }
                                        ]
                                    },
                                    { $mergeObjects: ['$$it', { is_po: true }] },
                                    '$$it'
                                ]
                            }
                        }
                    },
                    updated_at: new Date()
                }
            }
        ];

        // 3) Apply update to docs that have those outstanding items (same filter as find)
        const matchFilter = {
            'items.item_code': { $in: item_codes },
            $expr: {
                $gt: [
                    {
                        $size: {
                            $filter: {
                                input: '$items',
                                as: 'it',
                                cond: {
                                    $and: [
                                        { $in: ['$$it.item_code', item_codes] },
                                        { $gt: [{ $ifNull: ['$$it.qty', 0] }, { $ifNull: ['$$it.qty_total_po', 0] }] }
                                    ]
                                }
                            }
                        }
                    },
                    0
                ]
            }
        };

        const updateResult = await coll.updateMany(matchFilter, updatePipeline);

        // 4) If we had any MR-item outstanding, call n8n webhook with payload
        if (webhookPayload.length > 0) {
            try {
                await fetch('https://it-ids.app.n8n.cloud/webhook/706901cf-1ee5-4649-9986-991cda0d31a7', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(webhookPayload),
                });
            } catch (err) {
                console.warn('Failed to call n8n webhook:', err);
                // don't fail the whole API because webhook failed — just warn
            }
        }

        return NextResponse.json({
            matchedCount: updateResult.matchedCount ?? 0,
            modifiedCount: updateResult.modifiedCount ?? 0,
            webhookSentFor: webhookPayload.length,
        });
    } catch (err: any) {
        console.error('make-po API error:', err);
        return NextResponse.json({ error: err?.message ?? 'server error' }, { status: 500 });
    }
}
