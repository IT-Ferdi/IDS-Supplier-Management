import { useEffect, useState } from 'react';
import type { Transaction } from '@/types/transaction';

export function useTransactionData() {
    const [data, setData] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                setLoading(true);
                const res = await fetch('/api/transaction');
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                const json = await res.json();
                setData(json.data || json);
            } catch (err) {
                console.error('Failed to fetch transactions:', err);
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, []);

    return { data, loading, error };
}
