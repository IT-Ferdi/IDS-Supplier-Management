'use client';

import { useEffect, useMemo, useState } from 'react';
import { useItems } from '@/hooks/useItemData';
import { ArrowDown, ArrowUp, Building2, Star, Download } from 'lucide-react';
import type { ItemRow } from '@/types/item';

interface Supplier {
    id: string;
    nama: string;
    rating?: number;
    items?: [string, number][];
}

interface ItemCompareProps {
    mid: string;
}

export default function ItemCompare({ mid }: ItemCompareProps) {
    const { data: items, isLoading: isItemsLoading } = useItems();
    const [suppliers, setSuppliers] = useState<(Supplier & { price: number })[]>([]);
    const [loadingSuppliers, setLoadingSuppliers] = useState(true);

    useEffect(() => {
        async function fetchSuppliers() {
            try {
                setLoadingSuppliers(true);
                const res = await fetch('/api/supplier', { cache: 'no-store' });
                if (!res.ok) throw new Error('Failed to fetch suppliers');
                const data: Supplier[] = await res.json();

                const supplierWithPrice = data
                    .map((s) => {
                        const found = s.items?.find((it) => it[0] === mid);
                        return found ? { ...s, price: found[1] } : null;
                    })
                    .filter(Boolean) as (Supplier & { price: number })[];

                setSuppliers(supplierWithPrice);
            } catch (err) {
                console.error('Error fetching suppliers:', err);
            } finally {
                setLoadingSuppliers(false);
            }
        }

        fetchSuppliers();
    }, [mid]);

    const item = items?.find((it: ItemRow) => it.id === mid) || null;

    const stats = useMemo(() => {
        if (!suppliers.length) return null;
        const prices = suppliers.map((s) => s.price).sort((a, b) => a - b);
        const cheapest = prices[0];
        const median = prices[Math.floor(prices.length / 2)];
        const highest = prices[prices.length - 1];
        return {
            cheapest,
            highest,
            median,
            count: suppliers.length,
        };
    }, [suppliers]);

    const loading = isItemsLoading || loadingSuppliers;

    if (loading)
        return <div className="p-6 text-gray-500">Loading data...</div>;
    if (!item)
        return <div className="p-6 text-gray-500">Item tidak ditemukan.</div>;

    return (
        <div className="space-y-6 text-gray-800 min-h-screen p-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold">Compare Prices</h1>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm">
                    <Download className="h-4 w-4" /> Export CSV
                </button>
            </div>

            {/* Item Info */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-2">
                <h2 className="text-xl font-semibold">{item.name}</h2>
                <p className="text-gray-600">{item.description || '-'}</p>
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

            {/* Summary Cards */}
            {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                        <p className="text-gray-500 text-sm">Cheapest Price</p>
                        <p className="text-lg font-semibold text-emerald-600">
                            IDR {stats.cheapest.toLocaleString('id-ID')}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                        <p className="text-gray-500 text-sm">Median</p>
                        <p className="text-lg font-semibold">
                            IDR {stats.median.toLocaleString('id-ID')}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                        <p className="text-gray-500 text-sm">Highest Price</p>
                        <p className="text-lg font-semibold text-rose-600">
                            IDR {stats.highest.toLocaleString('id-ID')}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                        <p className="text-gray-500 text-sm"># Suppliers</p>
                        <p className="text-lg font-semibold">{stats.count}</p>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto shadow-sm">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-100 text-gray-700">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium">Supplier</th>
                            <th className="px-4 py-3 text-left font-medium">Rating</th>
                            <th className="px-4 py-3 text-left font-medium">Price (Rp)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {suppliers.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-4 py-10 text-center text-gray-500">
                                    Tidak ada supplier yang menjual item ini.
                                </td>
                            </tr>
                        ) : (
                            suppliers.map((s, i) => (
                                <tr
                                    key={s.id}
                                    className={`border-t border-gray-200 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                        } hover:bg-gray-100`}
                                >
                                    <td className="px-4 py-3 flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-gray-500" />
                                        {s.nama}
                                    </td>
                                    <td className="px-4 py-3">
                                        {s.rating ? (
                                            <div className="flex items-center gap-1 text-amber-500">
                                                <Star className="h-4 w-4 fill-amber-400" /> {s.rating}
                                            </div>
                                        ) : (
                                            '-'
                                        )}
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-blue-600">
                                        Rp {s.price.toLocaleString('id-ID')}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
