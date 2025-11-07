import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import type { ItemRow } from '@/types/item';

// === GET: Ambil semua item ===
export async function GET(_request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_SUPPLIER || 'sales_dashboard');

    const itemsCollection = db.collection<ItemRow>('master_item');
    const items = await itemsCollection.find({}).toArray();

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    );
  }
}

// === POST: Tambah item baru ===
export async function POST(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_SUPPLIER || 'sales_dashboard');
    const itemsCollection = db.collection<ItemRow>('master_item');

    const body = await request.json();

    // Cari item terakhir untuk generate ID baru
    const lastItem = await itemsCollection
      .find({ id: { $regex: /^MID-/ } })
      .sort({ id: -1 })
      .limit(1)
      .toArray();

    // Generate MID baru
    let newId = 'MID-0001';
    if (lastItem.length > 0) {
      const lastNum = parseInt(lastItem[0].id.replace('MID-', ''), 10);
      const nextNum = lastNum + 1;
      newId = `MID-${String(nextNum).padStart(4, '0')}`;
    }

    const newItem: ItemRow = {
      id: newId,
      name: body.name,
      description: body.description ?? '-',
      brand: body.brand,
      uom: body.uom ?? null,
      category: body.category ?? null,
    };

    await itemsCollection.insertOne(newItem);
    return NextResponse.json({ success: true, data: newItem });
  } catch (error) {
    console.error('Error inserting item:', error);
    return NextResponse.json(
      { error: 'Failed to insert item' },
      { status: 500 }
    );
  }
}
