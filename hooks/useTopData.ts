'use client';

import { useCallback, useEffect, useState } from 'react';

export type TopItem = {
  _id?: string;
  id: string;          // contoh: "Net 14"
  nama: string;        // contoh: "Net 14"
  credit_days: number; // contoh: 14
  invoice_portion?: number;
};

export function useTopData(api: string = '/api/top') {
  const [data, setData] = useState<TopItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTop = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(api, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed to fetch TOP (${res.status})`);
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(api, { cache: 'no-store' });
        if (!res.ok) throw new Error(`Failed to fetch TOP (${res.status})`);
        const json = await res.json();
        if (!cancelled) setData(Array.isArray(json) ? json : []);
      } catch (e: any) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api]);

  return { data, loading, error, refetch: fetchTop };
}
