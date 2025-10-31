'use client';

import { X, Package, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSuppliers } from "@/hooks/useSupplierData";
import type { Item } from '@/types/item';

export default function ItemDetailPanel({
    item,
    onClose,
}: {
    item: Item | null;
    onClose: () => void;
}) {
    const { data: suppliers, isLoading, error } = useSuppliers();

    // 🧠 Filter supplier yang menyediakan item ini berdasarkan item.id
    const relatedSuppliers = (suppliers ?? [])
        .map((s) => {
            if (!Array.isArray(s.items)) return null;

            // asumsi struktur s.items = [["MID-0001", 12000], ["MID-0002", 34000]]
            const found = s.items.find((i: any) =>
                i[0]?.toLowerCase() === item?.id?.toLowerCase()
            );
            if (!found) return null;

            return {
                ...s,
                price: found[1], // ambil harga dari index ke-1
            };
        })
        .filter(Boolean);

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
                                <h2 className="text-lg font-semibold leading-tight flex items-center gap-2">
                                    <Package className="h-5 w-5" />
                                    {item.name}
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

                            {/* SUPPLIER SECTION */}
                            <section>
                                <h3 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                                    <Building2 className="h-4 w-4" /> Suppliers Providing This Item
                                </h3>

                                {isLoading && (
                                    <p className="text-sm text-slate-500">Loading suppliers...</p>
                                )}
                                {error && (
                                    <p className="text-sm text-red-500">Error loading suppliers</p>
                                )}
                                {!isLoading && !error && relatedSuppliers.length === 0 && (
                                    <p className="text-sm text-slate-500">
                                        No suppliers found for this item.
                                    </p>
                                )}

                                {!isLoading && !error && relatedSuppliers.length > 0 && (
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {relatedSuppliers.map((s: any, index: number) => (
                                            <Card
                                                key={s.id || index}
                                                className="p-3 border border-slate-200 hover:bg-slate-50 transition-colors"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium text-slate-800">{s.nama ?? s.name}</p>
                                                        <p className="text-xs text-slate-500">
                                                            Code: {s.id || '-'}
                                                        </p>
                                                        <p className="text-sm text-slate-600 mt-1">
                                                            Price:{' '}
                                                            <span className="font-semibold text-sky-600">
                                                                Rp {s.price?.toLocaleString('id-ID')}
                                                            </span>
                                                        </p>
                                                    </div>
                                                    {s.rating && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="bg-yellow-50 text-yellow-700 border border-yellow-200"
                                                        >
                                                            ⭐ {s.rating}
                                                        </Badge>
                                                    )}
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
