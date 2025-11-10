'use client';

import React from 'react';
import { Search } from 'lucide-react';

type Column<T> = {
  key: string;
  header: string;
  width: string; // wajib agar kolom fixed
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

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className || ''}`}>
      {/* Toolbar */}
      {(showSearch || rightActions) && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 border-b">
          {showSearch ? (
            <div className="flex flex-wrap items-center gap-2">
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

              {/* Search by Name */}
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchName}
                  onChange={(e) => onSearchNameChange?.(e.target.value)}
                  placeholder={searchNamePlaceholder}
                  className="w-[16rem] rounded-2xl border border-slate-300 bg-white px-9 py-2 text-sm shadow-sm outline-none transition focus:ring-2 focus:ring-sky-300"
                />
              </label>
            </div>
          ) : (
            <div />
          )}

          {/* Right actions */}
          {rightActions ? <div className="ml-auto">{rightActions}</div> : null}
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
