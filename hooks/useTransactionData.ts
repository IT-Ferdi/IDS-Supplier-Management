// hooks/useTransactionData.ts
'use client';

import { useEffect, useState, useMemo } from 'react';
import type { Transaction, TransactionItem } from '@/types/transaction';

/**
 * Hook dasar: ambil semua transaksi dari API
 */
export function useTransactionData() {
    const [data, setData] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        const fetchTransactions = async () => {
            try {
                setLoading(true);
                const res = await fetch('/api/transaction', { cache: 'no-store' });
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                const json = await res.json();
                const arr = json?.data ?? json;
                if (mounted) setData(Array.isArray(arr) ? arr : []);
            } catch (err) {
                console.error('Failed to fetch transactions:', err);
                if (mounted) setError((err as Error).message);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchTransactions();
        return () => {
            mounted = false;
        };
    }, []);

    return { data, loading, error };
}

/**
 * Util: parse tanggal transaksi ke Date yang valid
 */
function parseTxDate(d?: string | null): Date | null {
    if (!d) return null;
    // support "YYYY-MM-DD" and ISO
    const dt = new Date(d);
    if (!isNaN(dt.getTime())) return dt;
    // fallback try replace space -> T
    const alt = new Date(d.replace(' ', 'T'));
    return isNaN(alt.getTime()) ? null : alt;
}

/**
 * Bentuk output item aggregated untuk supplier
 */
export type SupplierItemAgg = {
    key: string; // primary key used (item_code or item_name)
    item_code?: string | null;
    item_name?: string | null;
    uom?: string | null;
    lastPrice: number;
    lastPurchaseAt: string; // ISO or original string
    qty?: number | null;
    // raw transaksi/entry bila perlu debugging
    raw?: {
        transactionId?: string;
        transactionName?: string;
    } | null;
};

/**
 * Util: dari daftar Transaction, filter supplier lalu ambil record terakhir per item.
 *
 * Logika:
 * - iter semua transaksi dengan transaction.supplier === supplierId
 * - untuk tiap transaksi, iter items[] jika ada
 * - gunakan key = item_code (jika ada) atau item_name
 * - untuk setiap key, simpan entry yang memiliki transaction_date paling baru
 */
export function getSupplierItemsFromTransactions(
    transactions: Transaction[],
    supplierId?: string
): SupplierItemAgg[] {
    if (!supplierId) return [];

    const map = new Map<string, SupplierItemAgg>();

    for (const tx of transactions) {
        if (!tx) continue;

        // supplier field
        const sup = tx.supplier ?? null;
        if (!sup) continue;
        if (String(sup) !== String(supplierId)) continue;

        const txDateRaw = tx.transaction_date ?? null;
        const txDate = parseTxDate(txDateRaw) ?? new Date(0);

        const items: TransactionItem[] = Array.isArray(tx.items) && tx.items.length ? tx.items : [];

        if (items.length === 0) {
            // fallback legacy single-item on tx root (jika ada)
            if (tx.item_code && tx.item_name) {
                const key = String(tx.item_code ?? tx.item_name);
                const existing = map.get(key);
                const existingDate = existing ? parseTxDate(existing.lastPurchaseAt) ?? new Date(0) : new Date(0);

                // ambil uom dari root tx jika ada
                const fallbackUom = (tx as any).uom ?? null;

                if (txDate.getTime() > existingDate.getTime()) {
                    map.set(key, {
                        key,
                        item_code: tx.item_code ?? null,
                        item_name: tx.item_name ?? null,
                        uom: fallbackUom,
                        lastPrice: Number(tx.rate ?? 0),
                        lastPurchaseAt: txDateRaw ?? txDate.toISOString(),
                        qty: typeof tx.qty === 'number' ? tx.qty : (tx.qty ? Number(tx.qty) : null),
                        raw: { transactionId: tx._id, transactionName: tx.name },
                    });
                }
            }
            continue;
        }

        for (const it of items) {
            if (!it) continue;
            const code = (it.item_code ?? it.idx ?? it.detail_name ?? it.item_name) as string | undefined;
            const name = it.item_name ?? null;
            const uom = it.uom ?? null;
            const rate = Number(it.rate ?? 0);
            const qty = typeof it.qty === 'number' ? Number(it.qty) : (it.qty ? Number(it.qty) : null);

            const key = String(code ?? name ?? '').trim();
            if (!key) continue;

            const existing = map.get(key);
            const existingDate = existing ? parseTxDate(existing.lastPurchaseAt) ?? new Date(0) : new Date(0);

            // ambil record yang lebih baru (>= juga boleh jika ingin replace on equal date)
            if (txDate.getTime() >= existingDate.getTime()) {
                map.set(key, {
                    key,
                    item_code: it.item_code ?? null,
                    item_name: name,
                    uom,
                    lastPrice: rate,
                    lastPurchaseAt: tx.transaction_date ?? txDate.toISOString(),
                    qty,
                    raw: { transactionId: tx._id, transactionName: tx.name },
                });
            }
        }
    }

    const out = Array.from(map.values()).sort((a, b) => {
        const na = (a.item_name ?? a.key ?? '').toLowerCase();
        const nb = (b.item_name ?? b.key ?? '').toLowerCase();
        return na < nb ? -1 : na > nb ? 1 : 0;
    });

    return out;
}


/**
 * Hook: gunakan transaction data dan kembalikan daftar item terakhir untuk supplier
 */
export function useSupplierItems(supplierId?: string) {
    const { data: transactions = [], loading, error } = useTransactionData();

    const items = useMemo(() => {
        if (!supplierId) return [];
        return getSupplierItemsFromTransactions(transactions, supplierId);
    }, [transactions, supplierId]);

    return {
        items,
        loading,
        error,
    };
}
