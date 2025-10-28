'use client';

import { useQuery } from '@tanstack/react-query';
import type { ItemRow } from '@/types/item';

async function fetchItems(): Promise<ItemRow[]> {
  const res = await fetch('/api/item', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch items');
  return res.json();
}

export function useItems() {
  return useQuery({
    queryKey: ['items'],
    queryFn: fetchItems,
    staleTime: 5 * 60 * 1000, // 5 menit
  });
}
