// components/ui/dashboard-table.tsx
'use client';

import React from 'react';
import { Search } from 'lucide-react';

type Column<T> = {
  key: string;
  header: string;
  className?: string;
  render?: (row: T) => React.ReactNode;
};

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

  // OPTIONAL built-in 2 search inputs (ID + Name)
  searchId?: string;
  searchName?: string;
  onSearchIdChange?: (v: string) => void;
  onSearchNameChange?: (v: string) => void;
  searchIdPlaceholder?: string;
  searchNamePlaceholder?: string;

  // OPTIONAL right-slot for extra actions (export, etc)
  rightActions?: React.ReactNode;
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
}: Props<T>) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = (page - 1) * pageSize + data.length;

  const showSearch =
    typeof searchId === 'string' &&
    typeof searchName === 'string' &&
    typeof onSearchIdChange === 'function' &&
    typeof onSearchNameChange === 'function';

  return (
    <div className={['rounded-2xl border border-slate-200 bg-white shadow-sm', className].filter(Boolean).join(' ')}>
      {/* Toolbar */}
      {(showSearch || rightActions) && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 border-b">
          {/* Left: dual search */}
          {showSearch ? (
            <div className="flex flex-wrap items-center gap-2">
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchId}
                  onChange={(e) => onSearchIdChange?.(e.target.value)}
                  placeholder={searchIdPlaceholder}
                  className="w-[14rem] rounded-2xl border border-slate-300 bg-white px-9 py-2 text-sm shadow-sm outline-none transition focus:ring-2 focus:ring-sky-300"
                />
              </label>
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchName}
                  onChange={(e) => onSearchNameChange?.(e.target.value)}
                  placeholder={searchNamePlaceholder}
                  className="w-[18rem] rounded-2xl border border-slate-300 bg-white px-9 py-2 text-sm shadow-sm outline-none transition focus:ring-2 focus:ring-sky-300"
                />
              </label>
            </div>
          ) : <div />}

          {/* Right: actions */}
          {rightActions ? <div className="ml-auto">{rightActions}</div> : null}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-slate-700">
              {columns.map((col) => (
                <th key={col.key} className={['px-4 py-3 font-medium', col.className].filter(Boolean).join(' ')}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-12 text-center text-slate-400" colSpan={columns.length}>Loading…</td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td className="px-4 py-12 text-center text-slate-500" colSpan={columns.length}>{emptyText}</td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={i} className={`border-t border-slate-100 ${i % 2 ? 'bg-slate-50/40' : 'bg-white'}`}>
                  {columns.map((col) => (
                    <td key={col.key} className={['px-4 py-3', col.className].filter(Boolean).join(' ')}>
                      {col.render ? col.render(row) : (row as any)[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Pagination */}
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
