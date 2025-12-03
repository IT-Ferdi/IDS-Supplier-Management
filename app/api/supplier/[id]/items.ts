import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'supplier id required' });

        const client = await clientPromise;
        const db = client.db();

        const pipeline = [
            { $match: { supplier: String(id) } },
            { $unwind: '$items' },
            {
                $project: {
                    item_code: '$items.item_code',
                    item_name: '$items.item_name',
                    uom: '$items.uom',
                    lastPrice: '$items.rate',
                    poDate: '$transaction_date',
                },
            },
            { $sort: { item_code: 1, poDate: -1 } },
            {
                $group: {
                    _id: '$item_code',
                    item_code: { $first: '$item_code' },
                    item_name: { $first: '$item_name' },
                    uom: { $first: '$uom' },
                    lastPrice: { $first: '$lastPrice' },
                    lastPurchaseAt: { $first: '$poDate' },
                },
            },
            {
                $lookup: {
                    from: 'item',
                    localField: 'item_code',
                    foreignField: 'id', // item.id
                    as: 'item_meta',
                },
            },
            { $unwind: { path: '$item_meta', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    item_code: 1,
                    name: { $ifNull: ['$item_meta.name', '$item_name'] },
                    uom: { $ifNull: ['$item_meta.uom', '$uom'] },
                    lastPrice: 1,
                    lastPurchaseAt: 1,
                },
            },
            { $sort: { name: 1 } },
        ];

        const rows = await db.collection('transaction').aggregate(pipeline).toArray();

        res.status(200).json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'server error' });
    }
}
