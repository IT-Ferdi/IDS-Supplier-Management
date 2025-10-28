'use client';

import * as React from 'react';
import { Plus, Search, Download } from 'lucide-react';

export type Item = {
    id: string;
    namaMaterial: string;
    merk?: string;
    dimensi?: string;                // Dimensi / Ukuran
    berat?: string;
    penggunaan?: string;             // Penggunaan Material
    visualQc?: string;
    dimensiQc?: string;
    fungsiQc?: string;
    suhuKelembapan?: string;         // Suhu & Kelembapan Penyimpanan
    posisiPeletakan?: string;
    keamananPerlindungan?: string;
    shelfLife?: string;              // Waktu Simpan / Shelf Life
};

export type ItemTableProps = {
    data: Item[];
    loading?: boolean;

    // search (by nama material / merk)
    query?: string;
    onQueryChange?: (q: string) => void;

    // actions
    onAdd?: () => void;
    onExportCsv?: () => void;
    onRowClick?: (row: Item) => void;

    // pagination (server/client ok)
    page?: number;        // 1-based
    pageSize?: number;    // default 10
    total?: number;       // total rows (server mode)
    onPageChange?: (page: number) => void;

    className?: string;
};

export default function ItemTable({
    data,
    loading,
    query,
    onQueryChange,
    onAdd,
    onExportCsv,
    onRowClick,
    page = 1,
    pageSize = 10,
    total,
    onPageChange,
    className,
}: ItemTableProps) {
    const clientTotal = total ?? data.length;
    const totalPages = Math.max(1, Math.ceil(clientTotal / pageSize));

    return (
        <div className={['space-y-5', className].filter(Boolean).join(' ')}>
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Items</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Daftar material & kebutuhan QA/QC.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onAdd}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-sky-600 hover:to-indigo-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-300"
                    title="Tambah Item"
                >
                    <Plus className="h-4 w-4" />
                    Tambah Item
                </button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
                <label className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        value={query ?? ''}
                        onChange={(e) => onQueryChange?.(e.target.value)}
                        placeholder="Cari nama material / merk…"
                        className="w-[22rem] max-w-[92vw] rounded-2xl border border-slate-300 bg-white px-10 py-2 text-sm shadow-sm outline-none transition focus:ring-2 focus:ring-sky-300"
                    />
                </label>

                <div className="ml-auto">
                    <button
                        type="button"
                        onClick={onExportCsv}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-300"
                        title="Export CSV"
                    >
                        <Download className="h-4 w-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Table card (full-height inner scroll) */}
            <div className="flex flex-col rounded-3xl border border-slate-200 bg-white shadow-sm transition h-[calc(100dvh-220px)]">
                <div className="flex-1 overflow-x-auto overflow-y-auto">
                    <table className="w-full min-w-[1080px] text-sm">
                        <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur">
                            <tr className="text-left text-slate-700">
                                {[
                                    'Nama Material',
                                    'Merk',
                                    'Dimensi / Ukuran',
                                    'Berat',
                                    'Penggunaan Material',
                                    'Visual QC',
                                    'Dimensi QC',
                                    'Fungsi QC',
                                    'Suhu & Kelembapan Penyimpanan',
                                    'Posisi Peletakan',
                                    'Keamanan & Perlindungan',
                                    'Waktu Simpan / Shelf Life',
                                    '',
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
                                    <td colSpan={13} className="px-4 py-16">
                                        <div className="flex items-center justify-center gap-3 text-slate-600">
                                            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-transparent" />
                                            Loading items…
                                        </div>
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={13} className="px-4 py-20">
                                        <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 text-center">
                                            <div className="rounded-full bg-sky-50 p-3 text-sky-600">
                                                <Plus className="h-5 w-5" />
                                            </div>
                                            <p className="text-slate-600 font-medium">
                                                Belum ada item
                                            </p>
                                            <p className="text-slate-500 text-sm">
                                                Klik tombol di bawah untuk menambahkan item pertama.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={onAdd}
                                                className="mt-1 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-sky-600 hover:to-indigo-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-300"
                                                aria-label="Tambah Item"
                                            >
                                                <Plus className="h-4 w-4" />
                                                Tambah Item
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                data.map((it, i) => (
                                    <tr
                                        key={it.id}
                                        className={`border-t border-slate-100 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                                            } hover:bg-sky-50`}
                                        onClick={() => onRowClick?.(it)}
                                    >
                                        <td className="px-4 py-3 font-medium text-slate-800">
                                            {it.namaMaterial}
                                        </td>
                                        <td className="px-4 py-3">{it.merk ?? '-'}</td>
                                        <td className="px-4 py-3">{it.dimensi ?? '-'}</td>
                                        <td className="px-4 py-3">{it.berat ?? '-'}</td>
                                        <td className="px-4 py-3">{it.penggunaan ?? '-'}</td>
                                        <td className="px-4 py-3">{it.visualQc ?? '-'}</td>
                                        <td className="px-4 py-3">{it.dimensiQc ?? '-'}</td>
                                        <td className="px-4 py-3">{it.fungsiQc ?? '-'}</td>
                                        <td className="px-4 py-3">{it.suhuKelembapan ?? '-'}</td>
                                        <td className="px-4 py-3">{it.posisiPeletakan ?? '-'}</td>
                                        <td className="px-4 py-3">{it.keamananPerlindungan ?? '-'}</td>
                                        <td className="px-4 py-3">{it.shelfLife ?? '-'}</td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                type="button"
                                                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow-md"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onRowClick?.(it);
                                                }}
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Pagination */}
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
    