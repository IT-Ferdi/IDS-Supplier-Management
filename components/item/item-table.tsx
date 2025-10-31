'use client';

import { Plus, Search, Scale } from 'lucide-react';
import type { Item } from '@/types/item';

interface ItemTableProps {
    data: Item[];
    loading?: boolean;
    query?: string;
    onQueryChange?: (q: string) => void;
    page: number;
    pageSize: number;
    total: number;
    onRowClick?: (item: Item) => void;
    onPageChange?: (p: number) => void;
    onAdd?: () => void;
    className?: string;
}

export default function ItemTable({
    data,
    loading,
    query,
    onQueryChange,
    page,
    pageSize,
    total,
    onRowClick,
    onPageChange,
    onAdd,
    className,
}: ItemTableProps) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const clientTotal = total ?? data.length;

    return (
        <div className={['space-y-5', className].filter(Boolean).join(' ')}>
            {/* HEADER */}
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Master Items</h1>
                    <p className="mt-1 text-sm text-slate-500">List of all company item references (MID).</p>
                </div>

                <button
                    type="button"
                    onClick={onAdd}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-sky-600 hover:to-indigo-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-300"
                    title="Add Item"
                >
                    <Plus className="h-4 w-4" />
                    Add Item
                </button>
            </div>

            {/* TOOLBAR */}
            <div className="flex flex-wrap items-center gap-3">
                <label className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        value={query ?? ''}
                        onChange={(e) => onQueryChange?.(e.target.value)}
                        placeholder="Search item code or name…"
                        className="w-[22rem] max-w-[92vw] rounded-2xl border border-slate-300 bg-white px-10 py-2 text-sm shadow-sm outline-none transition focus:ring-2 focus:ring-sky-300"
                    />
                </label>
            </div>

            {/* TABLE */}
            <div className="flex flex-col rounded-3xl border border-slate-200 bg-white shadow-sm transition h-[calc(100dvh-220px)]">
                <div className="flex-1 overflow-x-auto overflow-y-auto">
                    <table className="w-full min-w-[980px] text-sm">
                        <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur">
                            <tr className="text-left text-slate-700">
                                {['Code', 'Name', 'Description', 'Brand', 'UOM', 'Category', ''].map((h) => (
                                    <th key={h} className="px-4 py-3 font-medium">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-16 text-center text-slate-400">
                                        Loading...
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-20 text-center text-slate-500">
                                        No data
                                    </td>
                                </tr>
                            ) : (
                                data.map((item, i) => (
                                    <tr
                                        key={item.id || `${i}-${item.name}`}
                                        onClick={() => onRowClick?.(item)}
                                        className={`border-t border-slate-100 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                                            } hover:bg-sky-50`}
                                    >
                                        <td className="px-4 py-3 font-mono text-slate-700">{item.id}</td>
                                        <td className="px-4 py-3">{item.name}</td>
                                        <td className="px-4 py-3">{item.description ?? '-'}</td>
                                        <td className="px-4 py-3">{item.brand ?? '-'}</td>
                                        <td className="px-4 py-3">{item.uom ?? '-'}</td>

                                        <td className="px-4 py-3">
                                            {item.category ? (
                                                <span className="inline-flex items-center rounded-full bg-violet-50 text-violet-700 ring-1 ring-violet-200 px-2 py-0.5 text-xs font-medium">
                                                    {item.category}
                                                </span>
                                            ) : (
                                                '-'
                                            )}
                                        </td>

                                        {/* Compare button */}
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-1.5 text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow-md"
                                                onClick={() => (window.location.href = `/item/compare/${item.id}`)}
                                            >
                                                <Scale className="h-4 w-4 text-sky-600" />
                                                Compare
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
