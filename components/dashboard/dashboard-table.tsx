'use client';

import React, { useMemo, useState } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

type Column<T> = {
  key: string;
  header: string;
  width: string; // wajib agar kolom fixed
  className?: string;
  render?: (row: T) => React.ReactNode;
};

type Supplier = { id: string; name: string };

type Props<T> = {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;

  // paging
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;

  // optional empty text
  emptyText?: string;

  // optional class
  className?: string;

  // dual search bar (ID + Name)
  searchId?: string;
  searchName?: string;
  onSearchIdChange?: (v: string) => void;
  onSearchNameChange?: (v: string) => void;
  searchIdPlaceholder?: string;
  searchNamePlaceholder?: string;

  // kanan: aksi tambahan
  rightActions?: React.ReactNode;

  // klik baris
  onRowClick?: (row: T) => void;

  // supplier controls (optional)
  suppliers?: Supplier[];
  selectedSupplierId?: string | null;
  onSelectSupplier?: (id: string | null) => void;
};

export default function DashboardTable<T>({
  columns,
  data,
  loading,
  page,
  pageSize,
  total,
  onPageChange,
  emptyText = 'No data',
  className,
  searchId,
  searchName,
  onSearchIdChange,
  onSearchNameChange,
  searchIdPlaceholder = 'Cari Item ID…',
  searchNamePlaceholder = 'Cari Item Name…',
  rightActions,
  onRowClick,
  suppliers = [],
  selectedSupplierId = null,
  onSelectSupplier,
}: Props<T>) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = (page - 1) * pageSize + data.length;
  const clickable = typeof onRowClick === 'function';

  const showSearch =
    typeof searchId === 'string' &&
    typeof searchName === 'string' &&
    typeof onSearchIdChange === 'function' &&
    typeof onSearchNameChange === 'function';

  // supplier dropdown state
  const [supOpen, setSupOpen] = useState(false);
  const [supQuery, setSupQuery] = useState('');
  const filteredSuppliers = useMemo(() => {
    const q = supQuery.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter(s => (s.name || s.id).toLowerCase().includes(q));
  }, [suppliers, supQuery]);

  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId) ?? null;

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className || ''}`}>
      {/* Toolbar */}
      {(showSearch || rightActions || suppliers.length > 0) && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 border-b">
          {/* Left: searches (ID + Name) and supplier select (moved next to Name) */}
          <div className="flex flex-wrap items-center gap-2">
            {showSearch ? (
              <>
                {/* Search by ID */}
                <label className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchId}
                    onChange={(e) => onSearchIdChange?.(e.target.value)}
                    placeholder={searchIdPlaceholder}
                    className="w-[12rem] rounded-2xl border border-slate-300 bg-white px-9 py-2 text-sm shadow-sm outline-none transition focus:ring-2 focus:ring-sky-300"
                  />
                </label>

                {/* Search by Name + supplier select inline */}
                <div className="flex items-center gap-2">
                  <label className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={searchName}
                      onChange={(e) => onSearchNameChange?.(e.target.value)}
                      placeholder={searchNamePlaceholder}
                      className="w-[16rem] rounded-2xl border border-slate-300 bg-white px-9 py-2 text-sm shadow-sm outline-none transition focus:ring-2 focus:ring-sky-300"
                    />
                  </label>

                  {/* supplier selector placed next to Name */}
                  {suppliers.length > 0 && onSelectSupplier ? (
                    <div className="relative">
                      <button
                        onClick={() => setSupOpen(v => !v)}
                        className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm hover:bg-slate-50"
                      >
                        <span className="text-sm">
                          {selectedSupplier ? selectedSupplier.name : 'All suppliers'}
                        </span>
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      </button>

                      {supOpen && (
                        <div className="absolute right-0 mt-2 w-72 rounded-lg border bg-white shadow-lg z-50">
                          <div className="p-2">
                            <div className="flex gap-2">
                              <input
                                value={supQuery}
                                onChange={(e) => setSupQuery(e.target.value)}
                                placeholder="Cari supplier..."
                                className="flex-1 rounded-md border px-3 py-2 text-sm outline-none"
                              />
                              <button
                                onClick={() => {
                                  setSupQuery('');
                                  setSupOpen(false);
                                  onSelectSupplier(null);
                                }}
                                title="Reset supplier"
                                className="rounded px-2 flex items-center justify-center text-slate-500 hover:bg-slate-100"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="max-h-56 overflow-auto mt-2">
                              <button
                                onClick={() => {
                                  onSelectSupplier(null);
                                  setSupOpen(false);
                                }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
                              >
                                All suppliers
                              </button>

                              {filteredSuppliers.map((s) => (
                                <button
                                  key={s.id || s.name}
                                  onClick={() => {
                                    onSelectSupplier(s.id || s.name);
                                    setSupOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${selectedSupplierId === (s.id || s.name) ? 'bg-sky-50' : ''}`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="truncate">{s.name || s.id}</div>
                                    <div className="text-xs text-slate-400">{s.id ? s.id : ''}</div>
                                  </div>
                                </button>
                              ))}

                              {filteredSuppliers.length === 0 && (
                                <div className="px-3 py-3 text-sm text-slate-400">No suppliers</div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>

          {/* Right: additional actions */}
          <div className="flex items-center gap-3 ml-auto">
            {rightActions ? <div>{rightActions}</div> : null}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed text-sm">
          <colgroup>
            {columns.map((col) => (
              <col key={col.key} style={{ width: col.width }} />
            ))}
          </colgroup>

          <thead className="bg-slate-50">
            <tr className="text-left text-slate-700">
              {columns.map((col) => (
                <th key={col.key} className={`px-4 py-3 font-medium ${col.className || ''}`}>
                  <div
                    className="truncate"
                    title={typeof col.header === 'string' ? col.header : undefined}
                    style={{ maxWidth: col.width }}
                  >
                    {col.header}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-500">
                  {emptyText}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={i}
                  onClick={clickable ? () => onRowClick?.(row) : undefined}
                  className={`border-t border-slate-100 ${i % 2 ? 'bg-slate-50/40' : 'bg-white'} ${clickable
                    ? 'cursor-pointer hover:bg-sky-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300'
                    : ''
                    }`}
                >
                  {columns.map((col) => {
                    const content = col.render ? col.render(row) : (row as any)[col.key];
                    const isPrimitive = typeof content === 'string' || typeof content === 'number';

                    return (
                      <td
                        key={col.key}
                        className={`px-4 py-3 whitespace-nowrap overflow-hidden ${col.className || ''}`}
                        style={{
                          maxWidth: col.width,
                          width: col.width,
                          textOverflow: 'ellipsis',
                        }}
                        title={isPrimitive ? String(content) : undefined}
                      >
                        {isPrimitive ? (
                          <span className="truncate block">{content}</span>
                        ) : (
                          <div className="truncate">{content}</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 text-sm text-slate-600">
        <span>
          Showing {start}–{end} of {total} results
        </span>
        <div className="flex items-center gap-2">
          <button
            className="rounded-full border border-slate-300 bg-white px-3 py-1.5 shadow-sm hover:bg-slate-50 disabled:opacity-50"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            Previous
          </button>
          <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
            {page} / {totalPages}
          </span>
          <button
            className="rounded-full border border-slate-300 bg-white px-3 py-1.5 shadow-sm hover:bg-slate-50 disabled:opacity-50"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
