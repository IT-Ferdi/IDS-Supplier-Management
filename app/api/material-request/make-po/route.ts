// app/api/material-request/make-po/route.ts
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(req: Request) {
    try {
        const { item_codes, is_po = true } = await req.json();

        if (!Array.isArray(item_codes) || item_codes.length === 0) {
            return NextResponse.json({ error: 'item_codes must be a non-empty array' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB_SUPPLIER || 'sales_dashboard');
        const coll = db.collection('material_request');

        // Use aggregation pipeline update to set is_po on matching array elements
        const result = await coll.updateMany(
            { "items.item_code": { $in: item_codes } },
            [
                {
                    $set: {
                        items: {
                            $map: {
                                input: "$items",
                                as: "it",
                                in: {
                                    $cond: [
                                        {
                                            $and: [
                                                { $in: ["$$it.item_code", item_codes] },
                                                { $lt: [{ $ifNull: ["$$it.ordered_qty", 0] }, { $ifNull: ["$$it.qty", 0] }] }
                                            ]
                                        },
                                        // matched & still short -> merge is_po flag (set true)
                                        { $mergeObjects: ["$$it", { is_po: Boolean(is_po) }] },
                                        // otherwise keep as-is
                                        "$$it"
                                    ]
                                }
                            }
                        },
                        updated_at: new Date()
                    }
                }
            ]
        );

        return NextResponse.json({
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount
        });
    } catch (err: any) {
        console.error("make-po API error:", err);
        return NextResponse.json({ error: err?.message || 'server error' }, { status: 500 });
    }
}
