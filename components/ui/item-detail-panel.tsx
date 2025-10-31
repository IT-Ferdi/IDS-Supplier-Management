'use client';

import { X, Package, Building2, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useMemo, useState } from 'react';
import { useTransactionData } from '@/hooks/useTransactionData';
import type { Item } from '@/types/item';
import type { Supplier } from '@/types/supplier';
import type { Transaction } from '@/types/transaction';

export default function ItemDetailPanel({
    item,
    onClose,
}: {
    item: Item | null;
    onClose: () => void;
}) {
    const { data: transactions, loading: loadingTransactions } = useTransactionData();

    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loadingSuppliers, setLoadingSuppliers] = useState(true);

    // Fetch supplier data
    useEffect(() => {
        async function fetchSuppliers() {
            try {
                setLoadingSuppliers(true);
                const res = await fetch('/api/supplier', { cache: 'no-store' });
                if (!res.ok) throw new Error('Failed to fetch suppliers');
                const data: Supplier[] = await res.json();
                setSuppliers(data);
            } catch (err) {
                console.error('Error fetching suppliers:', err);
            } finally {
                setLoadingSuppliers(false);
            }
        }
        fetchSuppliers();
    }, []);

    // Filter transaksi berdasarkan item.id
    const filteredTransactions = useMemo(() => {
        if (!item) return [];
        return transactions.filter(
            (tx: Transaction) =>
                tx.item_code?.toLowerCase() === item.id.toLowerCase()
        );
    }, [transactions, item]);

    // Ambil transaksi terbaru tiap supplier
    const latestBySupplier = useMemo(() => {
        const grouped: Record<string, Transaction[]> = {};
        filteredTransactions.forEach((tx) => {
            if (!grouped[tx.supplier]) grouped[tx.supplier] = [];
            grouped[tx.supplier].push(tx);
        });

        const latest: {
            supplier_id: string;
            supplier_name: string;
            last_transaction: string;
            rate_per_unit: number;
        }[] = [];

        Object.entries(grouped).forEach(([supplier_id, txs]) => {
            const sorted = txs.sort(
                (a, b) =>
                    new Date(b.transaction_date).getTime() -
                    new Date(a.transaction_date).getTime()
            );
            const latestTx = sorted[0];
            const ratePerUnit = latestTx.qty > 0 ? latestTx.rate / latestTx.qty : 0;
            latest.push({
                supplier_id,
                supplier_name: latestTx.supplier_name,
                last_transaction: latestTx.transaction_date,
                rate_per_unit: ratePerUnit,
            });
        });

        return latest;
    }, [filteredTransactions]);

    // Gabungkan dengan data supplier
    const suppliersWithDetail = useMemo(() => {
        return latestBySupplier.map((tx) => {
            const supplierDetail = suppliers.find((s) => s.id === tx.supplier_id);
            return {
                ...tx,
                rating: supplierDetail?.rating ?? '-',
                detail: supplierDetail ?? null,
            };
        });
    }, [latestBySupplier, suppliers]);

    // Summary (lowest, median, highest)
    const stats = useMemo(() => {
        if (!suppliersWithDetail.length) return null;
        const prices = suppliersWithDetail.map((s) => s.rate_per_unit).sort((a, b) => a - b);
        const cheapest = prices[0];
        const median = prices[Math.floor(prices.length / 2)];
        const highest = prices[prices.length - 1];
        return {
            cheapest,
            highest,
            median,
            count: suppliersWithDetail.length,
        };
    }, [suppliersWithDetail]);

    const loading = loadingTransactions || loadingSuppliers;

    return (
        <AnimatePresence>
            {item && (
                <>
                    {/* BACKDROP */}
                    <motion.div
                        key="backdrop"
                        className="fixed inset-0 bg-black/40 z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        onClick={onClose}
                    />

                    {/* PANEL */}
                    <motion.div
                        key="panel"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{
                            type: 'spring',
                            stiffness: 260,
                            damping: 30,
                        }}
                        className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl overflow-y-auto rounded-l-2xl"
                    >
                        {/* HEADER */}
                        <div className="flex items-center justify-between border-b px-6 py-4 bg-gradient-to-r from-indigo-500 to-sky-500 text-white">
                            <div>
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <Package className="h-5 w-5" /> {item.name}
                                </h2>
                                <p className="text-sm text-indigo-100">{item.id}</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="rounded-full p-2 text-white hover:bg-white/20 transition"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* BODY */}
                        <div className="overflow-y-auto max-h-[calc(100vh-64px)] p-6 space-y-6">
                            {/* ITEM INFO */}
                            <section>
                                <h3 className="text-sm font-medium text-slate-600 mb-1">Item Details</h3>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                    <div className="text-slate-500">Name</div>
                                    <div className="text-slate-800">{item.name}</div>

                                    <div className="text-slate-500">Description</div>
                                    <div className="text-slate-800">{item.description || '-'}</div>

                                    <div className="text-slate-500">Brand</div>
                                    <div className="text-slate-800">{item.brand || '-'}</div>

                                    <div className="text-slate-500">UOM</div>
                                    <div className="text-slate-800">{item.uom || '-'}</div>

                                    <div className="text-slate-500">Category</div>
                                    <div className="text-slate-800">{item.category || '-'}</div>
                                </div>
                            </section>

                            {/* 🔹 SUPPLIER LIST */}
                            <section>
                                <h3 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                                    <Building2 className="h-4 w-4" /> Suppliers Providing This Item
                                </h3>

                                {loading ? (
                                    <p className="text-sm text-slate-500">Loading data...</p>
                                ) : suppliersWithDetail.length === 0 ? (
                                    <p className="text-sm text-slate-500">No suppliers found.</p>
                                ) : (
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {suppliersWithDetail.map((s) => (
                                            <Card
                                                key={s.supplier_id}
                                                className="p-3 border border-slate-200 hover:bg-slate-50 transition-colors"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium text-slate-800">{s.supplier_name}</p>
                                                        <p className="text-xs text-slate-500">
                                                            Last: {new Date(s.last_transaction).toLocaleDateString('id-ID')}
                                                        </p>
                                                        <p className="text-sm text-slate-600 mt-1">
                                                            Price:{' '}
                                                            <span className="font-semibold text-sky-600">
                                                                Rp {s.rate_per_unit.toLocaleString('id-ID')}
                                                            </span>
                                                        </p>
                                                    </div>
                                                    <Badge
                                                        variant="secondary"
                                                        className="bg-yellow-50 text-yellow-700 border border-yellow-200"
                                                    >
                                                        <Star className="h-3 w-3 mr-1 fill-amber-400" /> {s.rating}
                                                    </Badge>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
