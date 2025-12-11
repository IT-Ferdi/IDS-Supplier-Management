// app/api/material-request/make-po/route.ts
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

type PoMeta = { po_name?: string; supplier?: string; transaction_date?: string };

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        // normalize incoming item codes: string, trimmed
        const item_codes: string[] = Array.isArray(body?.item_codes)
            ? body.item_codes.map((c: any) => (c ?? '').toString().trim()).filter(Boolean)
            : [];
        const po_meta: PoMeta = body?.po_meta ?? {};

        if (!Array.isArray(item_codes) || item_codes.length === 0) {
            return NextResponse.json({ error: 'item_codes must be a non-empty array' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB_SUPPLIER || 'sales_dashboard');
        const coll = db.collection('material_request');

        // --------------------------
        // 1) identify docs/items that are outstanding (qty > qty_total_po)
        //    This is only to build webhook payload (n8n should refresh those).
        // --------------------------
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
                                        {
                                            // numeric safe comparison
                                            $gt: [
                                                { $toDouble: { $ifNull: ['$$it.qty', 0] } },
                                                { $toDouble: { $ifNull: ['$$it.qty_total_po', 0] } }
                                            ]
                                        }
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
                const code = (it.item_code ?? '').toString().trim();
                if (!code) return;
                const qty = Number(it.qty ?? 0) || 0;
                const totPo = Number(it.qty_total_po ?? 0) || 0;
                if (item_codes.includes(code) && qty > totPo) {
                    webhookPayload.push({ mr_name: doc.name, item_code: code });
                }
            });
        });

        // --------------------------
        // 2) CALL n8n WEBHOOK FIRST (request n8n to refresh po_detail & qty_total_po)
        // --------------------------
        if (webhookPayload.length > 0) {
            try {
                // IMPORTANT: ideally n8n should perform the DB update synchronously and return success only after write.
                // If n8n writes asynchronously, consider changing n8n to call back to your server when done.
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

        // --------------------------
        // 3) AFTER webhook: run update pipeline that sets is_po = true ONLY when
        //    qty_total_po >= qty (i.e. item is truly satisfied after refresh)
        // --------------------------
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
                                            {
                                                // set is_po only when qty_total_po >= qty (numeric safe)
                                                $gte: [
                                                    { $toDouble: { $ifNull: ['$$it.qty_total_po', 0] } },
                                                    { $toDouble: { $ifNull: ['$$it.qty', 0] } }
                                                ]
                                            }
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

        // only match docs that contain item_codes (we rely on pipeline condition to gate which items become is_po)
        const matchFilter = {
            'items.item_code': { $in: item_codes }
        };

        const updateResult = await coll.updateMany(matchFilter, updatePipeline);

        // RESPONSE: report counts (webhookSentFor = how many MR-item entries we asked n8n to refresh)
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
