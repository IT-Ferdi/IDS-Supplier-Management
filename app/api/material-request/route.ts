import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(_request: Request) {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB_SUPPLIER || 'sales_dashboard');
        const coll = db.collection('material_request');

        // filter langsung di Mongo
        const materials = await coll
            .find({ status: { $in: ['Draft', 'Partially Ordered', 'Pending'] } })
            .toArray();

        return NextResponse.json(materials);
    } catch (err) {
        console.error('Error fetching material requests:', err);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}
