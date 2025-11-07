import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(_request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_SUPPLIER || 'sales_dashboard');

    const erpSiCollection = db.collection('master_uom');
    const invoices = await erpSiCollection.find({}).toArray();

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    );
  }
}