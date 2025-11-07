// hooks/useItemData.ts
'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ItemRow } from '@/types/item';

/** Ambil semua item dari API */
async function fetchItems(url = '/api/item'): Promise<ItemRow[]> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch items (${res.status})`);
  const json = await res.json();
  return Array.isArray(json) ? json : (json.data ?? []);
}

/** Ambil MID berikutnya (auto increment) */
async function fetchNextMid(url = '/api/item/next-mid'): Promise<string> {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error('Gagal mengambil Next MID');
  const json = await r.json();
  return typeof json === 'string' ? json : (json?.data ?? '');
}
/** Hook utama daftar item */
export function useItems(opts?: {
  url?: string;
  staleTime?: number;
  enabled?: boolean;
}) {
  const url = opts?.url ?? '/api/item';
  const staleTime = opts?.staleTime ?? 5 * 60 * 1000;
  return useQuery<ItemRow[], Error>({
    queryKey: ['items', url],
    queryFn: () => fetchItems(url),
    staleTime,
    enabled: opts?.enabled ?? true,
  });
}

/** Hook ambil item by ID */
export function useItemById(id?: string, opts?: { url?: string }) {
  const url = opts?.url ?? '/api/item';
  const q = useItems({ url });
  const item =
    id && q.data ? q.data.find((it) => it.id?.toLowerCase() === id.toLowerCase()) : undefined;
  return { ...q, item };
}

export function useNextMid(opts?: { url?: string; enabled?: boolean }) {
  const url = opts?.url ?? '/api/item/next-mid';
  const enabled = opts?.enabled ?? true;

  return useQuery({
    queryKey: ['next-mid', url],
    queryFn: () => fetchNextMid(url),
    enabled,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}


/** Prefetch item ke cache */
export function usePrefetchItems() {
  const qc = useQueryClient();
  return async (url = '/api/item') => {
    await qc.prefetchQuery({
      queryKey: ['items', url],
      queryFn: () => fetchItems(url),
      staleTime: 5 * 60 * 1000,
    });
  };
}

/** Invalidasi cache items */
export function invalidateItemsCache(
  qc: ReturnType<typeof useQueryClient>,
  url = '/api/item'
) {
  qc.invalidateQueries({ queryKey: ['items', url] });
}
