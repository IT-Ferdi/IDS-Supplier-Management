'use client';

import * as React from 'react';
import { Plus, Search, Download, X, Eye } from 'lucide-react';
import StarRating from '@/components/ui/star-rating';

export type SupplierStatus = 'ACTIVE' | 'INACTIVE';

export type Supplier = {
  code: string;
  name: string;
  status: SupplierStatus;
  city?: string;
  contact?: string;
  email?: string;
  phone?: string;
  paymentTerms?: string;
  categories?: string[];
  rating?: number;
  updatedAt?: string;

  /** Data asli dari API (bisa bentuk apa saja) */
  raw?: unknown;
};

export type SupplierTableProps = {
  data: Supplier[];
  loading?: boolean;

  query?: string;
  onQueryChange?: (q: string) => void;
  statusFilter?: 'ALL' | SupplierStatus;
  onStatusFilterChange?: (s: 'ALL' | SupplierStatus) => void;

  onAdd?: () => void;
  onExportCsv?: () => void;
  onRowClick?: (row: Supplier) => void;

  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;

  className?: string;
};

function formatDate(input?: string | Date) {
  if (!input) return '-';
  const d = typeof input === 'string' ? new Date(input) : input;
  return Number.isNaN(d.getTime()) ? '-' : d.toISOString().slice(0, 10);
}

export default function SupplierTable({
  data,
  loading,
  query,
  onQueryChange,
  statusFilter = 'ACTIVE',
  onStatusFilterChange,
  onAdd,
  onExportCsv,
  onRowClick,
  page = 1,
  pageSize = 10,
  total,
  onPageChange,
  className,
}: SupplierTableProps) {
  const clientTotal = total ?? data.length;
  const totalPages = Math.max(1, Math.ceil(clientTotal / pageSize));

  const [viewing, setViewing] = React.useState<Supplier | null>(null);

  return (
    <div className={['space-y-5', className].filter(Boolean).join(' ')}>
      {/* HEADER */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
          <p className="mt-1 text-sm text-slate-500">Manage vendors & pricing references.</p>
        </div>

        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-sky-600 hover:to-indigo-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-300"
          title="Add Supplier"
        >
          <Plus className="h-4 w-4" />
          Add Supplier
        </button>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query ?? ''}
            onChange={(e) => onQueryChange?.(e.target.value)}
            placeholder="Search code or name…"
            className="w-[22rem] max-w-[92vw] rounded-2xl border border-slate-300 bg-white px-10 py-2 text-sm shadow-sm outline-none transition focus:ring-2 focus:ring-sky-300"
          />
        </label>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-slate-600">Status</span>
          <select
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:ring-2 focus:ring-sky-300"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange?.(e.target.value as 'ALL' | SupplierStatus)}
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ALL">All</option>
          </select>

          <button
            type="button"
            onClick={onExportCsv}
            className="ml-1 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-300"
            title="Export CSV"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="flex flex-col rounded-3xl border border-slate-200 bg-white shadow-sm transition h-[calc(100dvh-220px)]">
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur">
              <tr className="text-left text-slate-700">
                {[
                  'Supplier Code',
                  'Name',
                  'Status',
                  'City',
                  'Contact',
                  'Email',
                  'Phone',
                  'Payment Terms',
                  'Categories',
                  'Rating',
                  'Items',
                ].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-4 py-16">{/* skeleton bisa taruh di sini */}</td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-20 text-center text-slate-500">No data</td>
                </tr>
              ) : (
                data.map((s, i) => (
                  <tr
                    key={s.code || `${i}-${s.name}`}
                    className={`border-t border-slate-100 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                      } hover:bg-sky-50 cursor-pointer`}
                    onClick={() => onRowClick?.(s)}
                  >
                    <td className="px-4 py-3 font-mono text-slate-700">{s.code}</td>
                    <td className="px-4 py-3">{s.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={

                          'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ' +
                          (s.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
                            : 'bg-rose-100 text-rose-700 ring-1 ring-rose-200')
                        }
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{s.city ?? '-'}</td>
                    <td className="px-4 py-3">{s.contact ?? '-'}</td>
                    <td className="px-4 py-3">{s.email ?? '-'}</td>
                    <td className="px-4 py-3">{s.phone ?? '-'}</td>
                    <td className="px-4 py-3">{s.paymentTerms ?? '-'}</td>

                    <td className="px-4 py-3">
                      {s.categories?.length ? (
                        <div className="flex flex-wrap gap-1.5">
                          {s.categories.slice(0, 3).map((c, idx) => (
                            <span
                              key={`${c}-${idx}`}
                              className="inline-flex items-center rounded-full bg-violet-50 text-violet-700 ring-1 ring-violet-200 px-2 py-0.5 text-xs font-medium"
                            >
                              {c}
                            </span>
                          ))}
                          {s.categories.length > 3 && (
                            <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 ring-1 ring-slate-200 px-2 py-0.5 text-xs font-medium">
                              +{s.categories.length - 3} more
                            </span>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <StarRating value={s.rating ?? 0} readOnly size={16} step={0.5} />
                    </td>

                    {/* Items button column */}
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // navigasi ke page items
                          window.location.href = `/supplier/${s.code}/items`;
                        }}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700 shadow-sm hover:bg-sky-50 hover:text-sky-700 transition"
                        title="View Items"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER / PAGINATION */}
        <div className="flex items-center justify-between px-4 py-4 text-sm text-slate-600">
          <span>
            Showing {(data.length && (page - 1) * pageSize + 1) || 0}–
            {(page - 1) * pageSize + data.length} of {clientTotal} results
          </span>
          <div className="flex items-center gap-2">
            <button
              className="rounded-full border border-slate-300 bg-white px-3 py-1.5 shadow-sm transition disabled:opacity-50 hover:bg-slate-50"
              disabled={page <= 1}
              onClick={() => onPageChange?.(page - 1)}
            >
              Previous
            </button>
            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
              {page} / {totalPages}
            </span>
            <button
              className="rounded-full border border-slate-300 bg-white px-3 py-1.5 shadow-sm transition disabled:opacity-50 hover:bg-slate-50"
              disabled={page >= totalPages}
              onClick={() => onPageChange?.(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Modal primitives ---------- */
function Dialog({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] transition-opacity animate-[fadeIn_.15s_ease-out]" onClick={onClose} />
      <div className="relative z-[101] w-full max-w-4xl origin-center animate-[popIn_.18s_ease-out] rounded-3xl border border-slate-200 bg-white/95 shadow-2xl ring-1 ring-black/5">
        {children}
      </div>

      <style jsx>{`
        @keyframes popIn { 0% { opacity: 0; transform: scale(.96); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
      `}</style>
    </div>
  );
}

function StatusPill({ status }: { status: 'ACTIVE' | 'INACTIVE' }) {
  const cls = status === 'ACTIVE'
    ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
    : 'bg-rose-100 text-rose-700 ring-1 ring-rose-200';
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>{status}</span>;
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 items-start gap-3 px-4 py-2.5 even:bg-slate-50/60">
      <dt className="col-span-1 text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="col-span-2 text-sm text-slate-800 break-words">{children}</dd>
    </div>
  );
}

function AvatarFromName({ name }: { name: string }) {
  const initials = React.useMemo(() => {
    const parts = (name || '').trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() || '').join('');
  }, [name]);
  return (
    <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-md">
      <span className="text-sm font-bold">{initials || 'SP'}</span>
    </div>
  );
}

function SupplierDetailContent({
  supplier,
  onClose,
}: {
  supplier: Supplier;
  onClose: () => void;
}) {
  // normalize raw -> object indexable
  const rawObj = React.useMemo(
    () => (supplier.raw ?? {}) as Record<string, unknown>,
    [supplier.raw]
  );

  // helper ambil string aman
  const s = (key: string): string => {
    const v = rawObj[key];
    return typeof v === 'string' ? v : v == null ? '-' : String(v);
  };

  const renderPaymentTerms = () => {
    const pt = rawObj['payment_terms'];
    if (Array.isArray(pt) && pt.length > 0) {
      return (
        <div className="flex flex-wrap gap-2">
          {pt.map((x, i) => {
            const item = (x ?? {}) as Record<string, unknown>;
            const desc = typeof item.description === 'string' ? item.description : String(item.description ?? '-');
            const val = item.value;
            return (
              <span
                key={i}
                className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700 ring-1 ring-slate-200"
              >
                <span className="font-medium">{desc}</span>
                {typeof val !== 'undefined' && (
                  <span className="rounded bg-white px-1.5 py-0.5 text-[10px] text-slate-600 ring-1 ring-slate-200">
                    {String(val)} days
                  </span>
                )}
              </span>
            );
          })}
        </div>
      );
    }
    if (supplier.paymentTerms) return supplier.paymentTerms;
    return '-';
  };

  return (
    <>
      {/* HEADER */}
      <div className="relative overflow-hidden rounded-t-3xl">
        <div className="h-20 bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500" />
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-white drop-shadow-sm">
              <AvatarFromName name={supplier.name} />
              <div>
                <h3 className="text-lg font-semibold leading-tight">{supplier.name}</h3>
                <p className="text-[11px] uppercase tracking-wider text-white/90">{supplier.code}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill status={supplier.status} />
              <button
                onClick={onClose}
                className="rounded-full bg-white/90 p-2 text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:bg-white hover:text-slate-800"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="max-h-[70vh] overflow-y-auto p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Card 1: Overview */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h4 className="text-sm font-semibold text-slate-800">Overview</h4>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">General</span>
            </div>
            <dl>
              <FieldRow label="Status"><StatusPill status={supplier.status} /></FieldRow>
              <FieldRow label="City">{supplier.city ?? '-'}</FieldRow>
              <FieldRow label="Contact">{supplier.contact ?? '-'}</FieldRow>
              <FieldRow label="Email">{supplier.email ?? '-'}</FieldRow>
              <FieldRow label="Phone">{supplier.phone ?? '-'}</FieldRow>
              <FieldRow label="Payment Terms">{renderPaymentTerms()}</FieldRow>
              <FieldRow label="Categories">
                {supplier.categories?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {supplier.categories.map((c) => (
                      <span key={c} className="inline-flex items-center rounded-full bg-violet-50 text-violet-700 ring-1 ring-violet-200 px-2 py-0.5 text-xs font-medium">
                        {c}
                      </span>
                    ))}
                  </div>
                ) : (
                  '-'
                )}
              </FieldRow>
              <FieldRow label="Rating">
                <StarRating value={supplier.rating ?? 0} readOnly size={18} step={0.5} />
              </FieldRow>
              <FieldRow label="Last Modified">{formatDate(supplier.updatedAt)}</FieldRow>
            </dl>
          </section>

          {/* Card 2: Tax & Contacts */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h4 className="text-sm font-semibold text-slate-800">Tax & Contacts</h4>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">From Source</span>
            </div>
            <dl>
              <FieldRow label="Nama (raw.nama)">{s('nama')}</FieldRow>
              <FieldRow label="Alamat Pusat">{s('alamat_pusat')}</FieldRow>
              <FieldRow label="Kota Pusat">{s('kota_pusat')}</FieldRow>
              <FieldRow label="Telp Sales">{s('telp_sales')}</FieldRow>
              <FieldRow label="Email Sales">{s('email_sales')}</FieldRow>
              <FieldRow label="Telp Finance">{s('telp_finance')}</FieldRow>
              <FieldRow label="Email Finance">{s('email_finance')}</FieldRow>
              <FieldRow label="NPWP">{s('no_npwp')}</FieldRow>
              <FieldRow label="NIK">{s('nik')}</FieldRow>
              <FieldRow label="Alamat Pajak">{s('alamat_pajak')}</FieldRow>
              <FieldRow label="Payment Template">{s('payment_terms_template')}</FieldRow>
              <FieldRow label="Rating">{String(rawObj['rating'] ?? '-')}</FieldRow>
            </dl>
          </section>
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">
        <button onClick={onClose} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm transition hover:bg-slate-50">
          Close
        </button>
      </div>
    </>
  );
}
