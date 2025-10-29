export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

type SupplierNonErp = {
  id: string | null;                 // S-DN-XXXXX (server generated)
  nama: string | null;
  alamat_pusat: string | null;
  kota_pusat: string | null;
  telp_sales: string | null;
  email_sales: string | null;
  telp_finance: string | null;
  email_finance: string | null;
  no_npwp: string | null;
  nik: string | null;
  alamat_pajak: string | null;
  payment_terms_template: string | null;
  rating: number | null;
  payment_terms: unknown;            // array/object/string; biarkan fleksibel
  categories?: string[] | null;      // ⬅️ kategori (bisa >1)
  created_at?: Date;
  updated_at?: Date;
};

const defaultNonErp: SupplierNonErp = {
  id: null,
  nama: null,
  alamat_pusat: null,
  kota_pusat: null,
  telp_sales: null,
  email_sales: null,
  telp_finance: null,
  email_finance: null,
  no_npwp: null,
  nik: null,
  alamat_pajak: null,
  payment_terms_template: null,
  rating: null,
  payment_terms: null,
  categories: null,
};

const DB_NAME = process.env.MONGODB_DB_SUPPLIER || 'supplier_management';
const COLL_SUPPLIER = 'master_supplier';
const COLL_COUNTERS = 'counters';
const COUNTER_KEY = 'supplier_nonerp';

function formatSupplierId(seq: number) {
  return `S-DN-${String(seq).padStart(5, '0')}`;
}

function normalizeCategories(input: any): string[] | null {
  if (!input) return null;
  if (!Array.isArray(input)) return null;
  const cleaned = input
    .map((x) => (typeof x === 'string' ? x.trim() : ''))
    .filter((x) => x.length > 0);
  if (cleaned.length === 0) return null;
  return Array.from(new Set(cleaned)); // unique
}

async function getNextSupplierId() {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  // 1) coba ambil dari counters (atomic, aman concurrency)
  const counters = db.collection<{ _id: string; seq: number }>(COLL_COUNTERS);

  // Jika belum ada, seed dari max existing di master_supplier
  const counterDoc = await counters.findOne({ _id: COUNTER_KEY });
  if (!counterDoc) {
    const suppliers = db.collection(COLL_SUPPLIER);
    // Cari id terbesar; karena 5 digit zero-pad, sort string juga aman
    const latest = await suppliers
      .find({ id: { $regex: /^S-DN-\d{5}$/ } })
      .sort({ id: -1 })
      .limit(1)
      .toArray();

    let startSeq = 0;
    if (latest.length > 0 && typeof latest[0].id === 'string') {
      const m = latest[0].id.match(/^S-DN-(\d{5})$/);
      if (m) startSeq = parseInt(m[1], 10);
    }

    // tulis seed
    await counters.insertOne({ _id: COUNTER_KEY, seq: startSeq });
  }

  // 2) increment dan ambil NEXT
  const updated = await counters.findOneAndUpdate(
    { _id: COUNTER_KEY },
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true }
  );

  const seq = updated?.seq ?? 1;
  return formatSupplierId(seq);
}

export async function GET(_request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);

    const erpSiCollection = db.collection(COLL_SUPPLIER);
    const docs = await erpSiCollection.find({}).toArray();

    return NextResponse.json(docs, {
      headers: { 'Cache-Control': 'no-store, no-cache' },
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as Partial<SupplierNonErp> | null;
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // Validasi minimal
    const nama = typeof body.nama === 'string' ? body.nama.trim() : '';
    if (!nama) {
      return NextResponse.json({ error: 'Field "nama" wajib diisi' }, { status: 400 });
    }

    const newId = await getNextSupplierId();

    const categories = normalizeCategories(body.categories);

    let templates: string[] = [];
    if (Array.isArray(body.payment_terms_template)) {
      templates = body.payment_terms_template
        .map((t) => (typeof t === 'string' ? t.trim() : ''))
        .filter((t) => t.length > 0);
    } else if (typeof body.payment_terms_template === 'string') {
      templates = body.payment_terms_template
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
    }

    const payment_terms =
      Array.isArray(body.payment_terms) && body.payment_terms.length > 0
        ? body.payment_terms 
        : templates.length > 0
          ? templates.map((t) => ({
            description: t,
            value: 0, 
          }))
          : null;

    const doc: SupplierNonErp = {
      ...defaultNonErp,
      id: newId,
      nama,
      alamat_pusat: body.alamat_pusat ?? null,
      kota_pusat: body.kota_pusat ?? null,
      telp_sales: body.telp_sales ?? null,
      email_sales: body.email_sales ?? null,
      telp_finance: body.telp_finance ?? null,
      email_finance: body.email_finance ?? null,
      no_npwp: body.no_npwp ?? null,
      nik: body.nik ?? null,
      alamat_pajak: body.alamat_pajak ?? null,
      payment_terms_template: templates.join(', ') || null,
      rating: body.rating ?? null,
      payment_terms,
      categories,
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Simpan ke DB
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLL_SUPPLIER);

    const { insertedId } = await collection.insertOne(doc);
    return NextResponse.json(
      { insertedId, ok: true, data: { ...doc, _id: insertedId } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating supplier:', error);
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 });
  }
}

