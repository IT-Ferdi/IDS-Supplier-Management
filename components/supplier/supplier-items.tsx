'use client';

import React, { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useSupplierItems } from '@/hooks/useTransactionData';
import { useSuppliers } from '@/hooks/useSupplierData';
import StarRating from '@/components/ui/star-rating';
import { Tag, Clock } from 'lucide-react';

function fmtDate(d?: string | null) {
    if (!d) return '-';
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return '-';
    return dt.toLocaleDateString('id-ID');
}
function fmtRp(n?: number | null) {
    if (n == null || isNaN(Number(n))) return '-';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
}

function median(values: number[]) {
    if (!values.length) return 0;
    const arr = values.slice().sort((a, b) => a - b);
    const mid = Math.floor(arr.length / 2);
    if (arr.length % 2 === 0) return (arr[mid - 1] + arr[mid]) / 2;
    return arr[mid];
}

export default function SupplierItems({ supplierId: supplierIdProp }: { supplierId?: string }) {
    const params = (typeof useParams === 'function' ? useParams() : null) as any;
    const supplierId = supplierIdProp ?? params?.id;

    const { items = [], loading, error } = useSupplierItems(supplierId);
    const { data: suppliers = [], isLoading: loadingSuppliers } = useSuppliers();
    const supplier = suppliers.find((s) => s.id === supplierId);

    const stats = useMemo(() => {
        const prices = items.map((i) => Number(i.lastPrice ?? 0)).filter((p) => !isNaN(p) && p > 0);
        return {
            cheapest: prices.length ? Math.min(...prices) : 0,
            highest: prices.length ? Math.max(...prices) : 0,
            median: median(prices),
            count: items.length,
        };
    }, [items]);

    return (
        <div className="space-y-6 p-6">
            {/* HEADER */}
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold">{supplier?.nama ?? supplierId}</h1>

                        {supplier?.kota_pusat && <p className="text-sm text-slate-600">{supplier.kota_pusat}</p>}
                        {supplier?.alamat_pusat && <p className="text-sm text-slate-500">{supplier.alamat_pusat}</p>}

                        {Array.isArray(supplier?.categories) && supplier.categories.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {supplier.categories.map((cat: string) => (
                                    <span
                                        key={cat}
                                        className="inline-flex items-center rounded-full bg-violet-50 text-violet-700 ring-1 ring-violet-200 px-2 py-0.5 text-xs font-medium"
                                    >
                                        {cat}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <StarRating value={supplier?.rating ?? 0} readOnly size={16} />
                        <div className="text-sm text-slate-600">{supplier?.rating ?? 0}</div>
                    </div>
                </div>
            </div>

            {/* METRICS */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <div className="rounded-2xl border bg-white p-4 shadow-sm">
                    <div className="text-xs text-slate-500">Cheapest Price</div>
                    <div className="mt-2 text-lg font-semibold text-emerald-600">{fmtRp(stats.cheapest)}</div>
                </div>

                <div className="rounded-2xl border bg-white p-4 shadow-sm">
                    <div className="text-xs text-slate-500">Median</div>
                    <div className="mt-2 text-lg font-semibold">{fmtRp(stats.median)}</div>
                </div>

                <div className="rounded-2xl border bg-white p-4 shadow-sm">
                    <div className="text-xs text-slate-500">Highest Price</div>
                    <div className="mt-2 text-lg font-semibold text-rose-600">{fmtRp(stats.highest)}</div>
                </div>

                <div className="rounded-2xl border bg-white p-4 shadow-sm">
                    <div className="text-xs text-slate-500"># Items</div>
                    <div className="mt-2 text-lg font-semibold">{stats.count}</div>
                </div>
            </div>

            {/* TABLE */}
            <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 text-left">Item</th>
                            <th className="px-4 py-3 text-left">UOM</th>
                            <th className="px-4 py-3 text-left">Transaksi Terakhir</th>
                            <th className="px-4 py-3 text-left">Qty</th>
                            <th className="px-4 py-3 text-left">Harga / UOM</th>
                            <th className="px-4 py-3 text-left">Grand Total</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading || loadingSuppliers ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                                    Loading…
                                </td>
                            </tr>
                        ) : error ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-10 text-center text-rose-600">Gagal memuat data.</td>
                            </tr>
                        ) : items.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">Tidak ada item ditemukan.</td>
                            </tr>
                        ) : (
                            items.map((it) => {
                                const price = Number(it.lastPrice ?? 0) || 0;
                                const qty = typeof it.qty === 'number' && !isNaN(it.qty) ? it.qty : 1;
                                const grand = price * (qty ?? 1);

                                return (
                                    <tr key={it.key} className="border-t hover:bg-slate-50 transition">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="text-sm font-medium">{it.item_name ?? it.item_code ?? it.key}</div>
                                            </div>
                                        </td>

                                        <td className="px-4 py-3">
                                            {it.uom ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                                                    <Tag className="h-3 w-3" />
                                                    {it.uom}
                                                </span>
                                            ) : (
                                                '-'
                                            )}
                                        </td>

                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Clock className="h-4 w-4 text-slate-400" />
                                                <span>{fmtDate(it.lastPurchaseAt)}</span>
                                            </div>
                                        </td>

                                        <td className="px-4 py-3 text-sm text-slate-700">{String(it.qty ?? '-')}</td>

                                        <td className="px-4 py-3">
                                            <a className="text-sky-600 hover:underline text-sm font-medium">
                                                {fmtRp(price)} {it.uom ? `/ ${it.uom}` : ''}
                                            </a>
                                        </td>

                                        <td className="px-4 py-3 text-emerald-600 font-semibold">{fmtRp(grand)}</td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <div>
                <button onClick={() => (typeof window !== 'undefined' && window.history.back())} className="rounded-xl border px-4 py-2 bg-white shadow-sm hover:bg-slate-50">
                    Back
                </button>
            </div>
        </div>
    );
}
