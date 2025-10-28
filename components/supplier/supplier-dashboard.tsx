'use client';

import { useMemo, useState } from 'react';
import SupplierTable from '@/components/supplier/supplier-table';
import { useSuppliers } from '@/hooks/useSupplierData';
import type { SupplierRow } from '@/types/supplier';

/** Normalisasi string aman */
const norm = (v: unknown) => String(v ?? '').toLowerCase().trim();

/** Status default: ACTIVE jika tidak ada/invalid */
function getStatus(row: SupplierRow & { status?: unknown }): 'ACTIVE' | 'INACTIVE' {
  const raw = row.status;
  if (!raw) return 'ACTIVE';
  return String(raw).toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
}

/** Ambil categories dari beberapa kemungkinan field tanpa any */
function pickCategories(r: SupplierRow | Record<string, unknown>): string[] {
  const obj = r as Record<string, unknown>;
  const src =
    (obj['categories'] as unknown) ??
    obj['category'] ??
    obj['kategori'] ??
    obj['tags'];

  if (Array.isArray(src)) {
    return src
      .map((x) => (typeof x === 'string' ? x : String(x)))
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (typeof src === 'string') {
    return src.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

/** Serializer payment_terms yang aman tipe */
function serializePaymentTerms(pt: unknown): string {
  if (pt == null) return '';
  if (typeof pt === 'string' || typeof pt === 'number') return String(pt);
  if (typeof pt === 'object') {
    const maybeObj = pt as Record<string, unknown>;
    if (maybeObj.description != null) return String(maybeObj.description);
    if (maybeObj.value != null) return String(maybeObj.value);
    try {
      return JSON.stringify(maybeObj);
    } catch {
      return String(pt);
    }
  }
  return String(pt);
}

export default function SupplierDashboard() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: rows = [], isLoading, error } = useSuppliers();

  const filtered = useMemo(() => {
    const q = norm(query);
    const base = q
      ? rows.filter((r) => norm(r.nama).includes(q))
      : rows;

    if (status === 'ALL') return base;
    return base.filter(() => {
      // sementara masih dummy sampai backend ada field status
      const s: 'ACTIVE' | 'INACTIVE' = 'ACTIVE';
      return s === status;
    });
  }, [rows, query, status]);

  // pagination
  const pageStart = (page - 1) * pageSize;
  const paged = useMemo(
    () => filtered.slice(pageStart, pageStart + pageSize),
    [filtered, pageStart, pageSize]
  );

  // adapt ke bentuk table
  const tableData = useMemo(
    () =>
      paged.map((r) => {
        const cats = pickCategories(r);
        return {
          code: r.id,
          name: r.nama ?? '',
          status: getStatus(r),
          city: r.kota_pusat ?? undefined,
          contact: r.telp_sales ?? undefined,
          email: r.email_sales ?? undefined,
          phone: r.telp_sales ?? undefined,
          paymentTerms: r.payment_terms_template ?? undefined,
          updatedAt: undefined,
          categories: cats.length ? cats : undefined,
          rating: r.rating ?? undefined, 
          raw: r,
        };
      }),
    [paged]
  );

  const handleExportCsv = () => {
    const header = ['code', 'name', 'city', 'contact', 'email', 'phone', 'paymentTerms'] as const;
    const rowsCsv = filtered.map((r) => {
      const payment_terms = (r as unknown as { payment_terms?: unknown }).payment_terms;
      const values: string[] = [
        r.id ?? '',
        r.nama ?? '',
        r.kota_pusat ?? '',
        r.telp_sales ?? '',
        r.email_sales ?? '',
        r.telp_sales ?? '',
        serializePaymentTerms(payment_terms),
      ];
      return values.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });

    const csv = [header.join(','), ...rowsCsv].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'suppliers.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="p-4">
        <p className="text-red-600">Gagal memuat data supplier.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <SupplierTable
        data={tableData}
        loading={isLoading}
        query={query}
        onQueryChange={(q) => {
          setQuery(q);
          setPage(1);
        }}
        statusFilter={status}
        onStatusFilterChange={(s) => {
          setStatus(s);
          setPage(1);
        }}
        page={page}
        pageSize={pageSize}
        total={filtered.length}
        onPageChange={setPage}
        onAdd={() => (window.location.href = '/supplier/new')}
        onExportCsv={handleExportCsv}
      />
    </div>
  );
}
