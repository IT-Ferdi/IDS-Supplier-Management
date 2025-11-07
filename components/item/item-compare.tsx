'use client';

import { useEffect, useMemo, useState } from 'react';
import { Building2, Star, Download } from 'lucide-react';
import { useItems } from '@/hooks/useItemData';
import { useTransactionData } from '@/hooks/useTransactionData';
import type { Supplier } from '@/types/supplier';
import type { ItemRow } from '@/types/item';
import SupplierDetailPanel from '@/components/ui/supplier-detail-panel';
import type { Transaction } from '@/types/transaction';

interface ItemCompareProps {
    mid: string;
}

export default function ItemCompare({ mid }: ItemCompareProps) {
    const { data: items, isLoading: isItemsLoading } = useItems();
    const { data: transactions, loading: loadingTransactions } = useTransactionData();

    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [loadingSuppliers, setLoadingSuppliers] = useState(true);

    const item = useMemo(
        () => items?.find((it: ItemRow) => it.id === mid) || null,
        [items, mid]
    );

    // Fetch supplier
    useEffect(() => {
        (async () => {
            try {
                setLoadingSuppliers(true);
                const res = await fetch('/api/supplier', { cache: 'no-store' });
                if (!res.ok) throw new Error('Failed to fetch suppliers');
                const data: Supplier[] = await res.json();
                setSuppliers(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingSuppliers(false);
            }
        })();
    }, []);

    // Flatten transaksi -> baris per item yang match mid
    const filtered = useMemo(() => {
        const rows: {
            supplier: string;
            supplier_name: string;
            transaction_date: string;
            status: string;
            qty: number;
            rate: number;
            uom?: string;
        }[] = [];

        transactions.forEach((tx: Transaction) => {
            if (!Array.isArray(tx.items)) return;
            tx.items.forEach((it) => {
                if (it.item_code?.toLowerCase() === mid.toLowerCase()) {
                    rows.push({
                        supplier: tx.supplier,
                        supplier_name: tx.supplier_name ?? '',
                        transaction_date: tx.transaction_date,
                        status: tx.status ?? '',
                        qty: Number(it.qty ?? 0),
                        rate: Number(it.rate ?? 0),
                        uom: it.uom ?? '',
                    });
                }
            });
        });

        return rows;
    }, [transactions, mid]);

    // Ambil transaksi terbaru per supplier
    const latestBySupplier = useMemo(() => {
        const grouped: Record<string, typeof filtered> = {};
        filtered.forEach((r) => {
            if (!grouped[r.supplier]) grouped[r.supplier] = [];
            grouped[r.supplier].push(r);
        });

        return Object.entries(grouped).map(([supplier_id, rows]) => {
            const latest = rows
                .slice()
                .sort(
                    (a, b) =>
                        new Date(b.transaction_date).getTime() -
                        new Date(a.transaction_date).getTime()
                )[0];

            const qty = Number(latest.qty ?? 0);
            const rate = Number(latest.rate ?? 0);

            return {
                supplier_id,
                supplier_name: latest.supplier_name,
                last_transaction: latest.transaction_date,
                uom: latest.uom,
                rate_per_unit: rate,        // harga per unit sesuai struktur baru
                qty,                        // simpan qty
                grand_total: rate * qty,    // kolom baru: rate * qty
            };
        });
    }, [filtered]);

    // Merge rating + detail supplier
    const suppliersWithDetail = useMemo(() => {
        return latestBySupplier.map((tx) => {
            const s = suppliers.find((sp) => sp.id === tx.supplier_id);
            const numericRating =
                s && s.rating != null && !Number.isNaN(Number(s.rating))
                    ? Number(s.rating)
                    : 0;

            return {
                ...tx,
                rating: numericRating,
                detail: s ?? null,
            };
        });
    }, [latestBySupplier, suppliers]);

    // Stats
    const stats = useMemo(() => {
        if (!suppliersWithDetail.length) return null;
        const prices = suppliersWithDetail.map((s) => s.rate_per_unit).sort((a, b) => a - b);
        const cheapest = prices[0];
        const median = prices[Math.floor(prices.length / 2)];
        const highest = prices[prices.length - 1];
        return { cheapest, highest, median, count: suppliersWithDetail.length };
    }, [suppliersWithDetail]);

    const loading = isItemsLoading || loadingTransactions || loadingSuppliers;
    if (loading) return <div className="p-6 text-slate-500">Loading data...</div>;
    if (!item) return <div className="p-6 text-slate-500">Item tidak ditemukan.</div>;

    return (
        <div className="space-y-6 text-slate-800 bg-white min-h-screen p-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold">Compare Prices</h1>
                <button className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-sky-600 hover:to-indigo-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-300">
                    <Download className="h-4 w-4" /> Export CSV
                </button>
            </div>

            {/* Item info */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
                <h2 className="text-xl font-semibold">{item.name}</h2>
                <p className="text-slate-600">{item.description || '-'}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                    {item.category && (
                        <span className="inline-flex items-center rounded-full bg-purple-100 text-purple-700 ring-1 ring-purple-200 px-3 py-0.5 text-xs font-medium">
                            {item.category}
                        </span>
                    )}
                    {item.brand && (
                        <span className="inline-flex items-center rounded-full bg-sky-100 text-sky-700 ring-1 ring-sky-200 px-3 py-0.5 text-xs font-medium">
                            {item.brand}
                        </span>
                    )}
                    {item.uom && (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 px-3 py-0.5 text-xs font-medium">
                            {item.uom}
                        </span>
                    )}
                </div>
            </div>

            {/* Summary */}
            {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                        <p className="text-slate-500 text-sm">Cheapest Price</p>
                        <p className="text-lg font-semibold text-emerald-600">
                            IDR {stats.cheapest.toLocaleString('id-ID')}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                        <p className="text-slate-500 text-sm">Median</p>
                        <p className="text-lg font-semibold">
                            IDR {stats.median.toLocaleString('id-ID')}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                        <p className="text-slate-500 text-sm">Highest Price</p>
                        <p className="text-lg font-semibold text-rose-600">
                            IDR {stats.highest.toLocaleString('id-ID')}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                        <p className="text-slate-500 text-sm"># Suppliers</p>
                        <p className="text-lg font-semibold">{stats.count}</p>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-x-auto shadow-sm">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-100 text-slate-700">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium">Supplier</th>
                            <th className="px-4 py-3 text-left font-medium">Rating</th>
                            <th className="px-4 py-3 text-left font-medium">Transaksi Terakhir</th>
                            <th className="px-4 py-3 text-left font-medium">Qty</th>
                            <th className="px-4 py-3 text-left font-medium">Harga / UOM</th>
                            <th className="px-4 py-3 text-left font-medium">Grand Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {suppliersWithDetail.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                                    Tidak ada transaksi untuk item ini.
                                </td>
                            </tr>
                        ) : (
                            suppliersWithDetail.map((s, i) => (
                                <tr
                                    key={s.supplier_id}
                                    onClick={() => s.detail && setSelectedSupplier(s.detail)}
                                    className={`cursor-pointer border-t border-slate-200 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                                        } hover:bg-blue-50 transition-colors`}
                                >
                                    <td className="px-4 py-3 flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-slate-500" />
                                        {s.supplier_name}
                                    </td>
                                    <td className="px-4 py-3">
                                        {s.rating > 0 ? (
                                            <div className="flex items-center gap-1 text-amber-500">
                                                <Star className="h-4 w-4 fill-amber-400" /> {s.rating}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-slate-400">
                                                <Star className="h-4 w-4 fill-amber-400" /> 0
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">
                                        {new Date(s.last_transaction).toLocaleDateString('id-ID')}
                                    </td>
                                    <td className="px-4 py-3">
                                        {s.qty.toLocaleString('id-ID')} {s.uom || ''}
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-blue-600">
                                        Rp {s.rate_per_unit.toLocaleString('id-ID')} / {s.uom || 'unit'}
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-green-600">
                                        Rp {s.grand_total.toLocaleString('id-ID')}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>

                </table>
            </div>

            {/* Panel */}
            {selectedSupplier && (
                <>
                    <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setSelectedSupplier(null)} />
                    <SupplierDetailPanel
                        supplier={selectedSupplier}
                        onClose={() => setSelectedSupplier(null)}
                    />
                </>
            )}
        </div>
    );
}
