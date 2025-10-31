'use client';

import { X, ExternalLink } from 'lucide-react';
import StarRating from '@/components/ui/star-rating';
import type { Supplier } from '@/types/supplier';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTransactionData } from "@/hooks/useTransactionData";

function TransactionTable({ supplierName }: { supplierName: string }) {
    const { data, loading, error } = useTransactionData();

    const supplierTransactions = data.filter(
        (tx) => tx.supplier_name?.toLowerCase() === supplierName?.toLowerCase()
    );

    if (loading) return <p className="text-sm text-slate-500">Loading transactions...</p>;
    if (error) return <p className="text-sm text-red-500">Error loading transactions</p>;
    if (supplierTransactions.length === 0)
        return <p className="text-sm text-slate-500">No transactions found for this supplier.</p>;

    return (
        <Card>
            <div className="space-y-2 max-h-64 overflow-y-auto">
                {supplierTransactions.map((tx, index) => (
                    <div
                        key={tx._id}
                        className="flex items-center justify-between p-2 bg-muted rounded-md cursor-pointer hover:bg-muted/80 transition-colors"
                    >
                        {/* Left side */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                                    {index + 1}
                                </div>
                                <div>
                                    <p className="font-medium">{tx.name}</p>
                                    <p className="text-sm text-muted-foreground">{tx.item_name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Qty: {tx.qty ?? 0} @ Rp{(tx.rate ?? 0).toLocaleString('id-ID')}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Date: {tx.transaction_date
                                            ? new Date(tx.transaction_date).toLocaleDateString('id-ID')
                                            : '-'}
                                    </p>
                                </div>
                                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </div>

                        {/* Right side */}
                        <div className="text-right">
                            <Badge
                                variant="secondary"
                                className={`${tx.status === 'Completed'
                                        ? 'bg-green-100 text-green-700 border border-green-200'
                                        : tx.status === 'Pending'
                                            ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                                    }`}
                            >
                                {tx.status}
                            </Badge>
                            <p className="font-medium mt-1">
                                Rp{(tx.rate ?? 0).toLocaleString('id-ID')}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}

export default function SupplierDetailPanel({
    supplier,
    onClose,
}: {
    supplier: Supplier | null;
    onClose: () => void;
}) {
    const raw = (supplier?.raw ?? {}) as Record<string, any>;

    // 🔹 Lebih aman: ambil dari raw dulu, fallback ke supplier
    const safe = (key: string): string => {
        const fromRaw = raw[key];
        const fromMain = (supplier as any)?.[key];
        const v = fromRaw ?? fromMain;
        return typeof v === 'string' ? v : v == null ? '-' : String(v);
    };

    const renderPaymentTerms = () => {
        const terms = raw['payment_terms'];
        if (Array.isArray(terms) && terms.length > 0) {
            return (
                <div className="flex flex-wrap gap-2 mt-1">
                    {terms.map((t, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700 ring-1 ring-slate-200"
                        >
                            <span className="font-medium">{t.description ?? '-'}</span>
                            {t.value && (
                                <span className="rounded bg-white px-1.5 py-0.5 text-[10px] text-slate-600 ring-1 ring-slate-200">
                                    {t.value} days
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            );
        }
        return <div className="text-slate-500 text-sm">-</div>;
    };

    return (
        <AnimatePresence>
            {supplier && (
                <>
                    {/* 🌫 Backdrop */}
                    <motion.div
                        key="backdrop"
                        className="fixed inset-0 bg-black/40 z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        onClick={onClose}
                    />

                    {/* 📋 Panel */}
                    <motion.div
                        key="panel"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                        className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl overflow-y-auto rounded-l-2xl"
                    >
                        {/* HEADER */}
                        <div className="flex items-center justify-between border-b px-6 py-4 bg-gradient-to-r from-sky-500 to-indigo-500 text-white">
                            <div>
                                <h2 className="text-lg font-semibold leading-tight">
                                    {supplier?.nama ?? supplier?.name ?? 'Supplier Detail'}
                                </h2>
                                <h2 className="text-xs opacity-90">{supplier?.code ?? '-'}</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="rounded-full p-2 text-white hover:bg-white/20 transition"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* BODY */}
                        <div className="overflow-y-auto max-h-[calc(100vh-64px)] p-6 space-y-5">
                            {/* Categories */}
                            <section>
                                <h3 className="text-sm font-medium text-slate-600 mb-1">Categories</h3>
                                {supplier.categories?.length ? (
                                    <div className="flex flex-wrap gap-1.5">
                                        {supplier.categories.map((c) => (
                                            <span
                                                key={c}
                                                className="inline-flex items-center rounded-full bg-violet-50 text-violet-700 ring-1 ring-violet-200 px-2 py-0.5 text-xs font-medium"
                                            >
                                                {c}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-slate-400 text-sm">-</div>
                                )}
                            </section>

                            {/* Rating */}
                            <section>
                                <h3 className="text-sm font-medium text-slate-600 mb-1">Rating</h3>
                                <StarRating value={supplier.rating ?? 0} readOnly size={18} step={0.5} />
                            </section>

                            {/* Payment Terms */}
                            <section>
                                <h3 className="text-sm font-medium text-slate-600 mb-1">
                                    Payment Terms Template
                                </h3>
                                <div className="text-slate-800 text-sm">{safe('payment_terms_template')}</div>

                                <h3 className="text-sm font-medium text-slate-600 mt-3 mb-1">
                                    Payment Terms Detail
                                </h3>
                                {renderPaymentTerms()}
                            </section>

                            {/* Company Info */}
                            <section>
                                <h3 className="text-sm font-medium text-slate-600 mb-1">Company Info</h3>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                    <div className="text-slate-500">Nama</div>
                                    <div className="text-slate-800">{safe('nama')}</div>

                                    <div className="text-slate-500">Alamat Pusat</div>
                                    <div className="text-slate-800">{safe('alamat_pusat')}</div>

                                    <div className="text-slate-500">Kota Pusat</div>
                                    <div className="text-slate-800">{safe('kota_pusat')}</div>

                                    <div className="text-slate-500">NPWP</div>
                                    <div className="text-slate-800">{safe('no_npwp')}</div>

                                    <div className="text-slate-500">NIK</div>
                                    <div className="text-slate-800">{safe('nik')}</div>

                                    <div className="text-slate-500">Alamat Pajak</div>
                                    <div className="text-slate-800 col-span-2 break-words">
                                        {safe('alamat_pajak')}
                                    </div>
                                </div>
                            </section>

                            {/* Contact Info */}
                            <section>
                                <h3 className="text-sm font-medium text-slate-600 mb-1">
                                    Contact Information
                                </h3>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                    <div className="text-slate-500">Telp Sales</div>
                                    <div className="text-slate-800">{safe('telp_sales')}</div>

                                    <div className="text-slate-500">Email Sales</div>
                                    <div className="text-slate-800">{safe('email_sales')}</div>

                                    <div className="text-slate-500">Telp Finance</div>
                                    <div className="text-slate-800">{safe('telp_finance')}</div>

                                    <div className="text-slate-500">Email Finance</div>
                                    <div className="text-slate-800">{safe('email_finance')}</div>
                                </div>
                            </section>

                            {/* Updated info */}
                            <section>
                                <h3 className="text-sm font-medium text-slate-600 mb-1">Last Updated</h3>
                                <div className="text-sm text-slate-800">
                                    {supplier.updatedAt
                                        ? new Date(supplier.updatedAt).toLocaleString('id-ID')
                                        : '-'}
                                </div>
                            </section>

                            {/* Transactions */}
                            <section>
                                <h3 className="text-sm font-medium text-slate-600 mb-2">Transactions</h3>
                                <TransactionTable supplierName={supplier?.nama ?? supplier?.name ?? ''} />
                            </section>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
