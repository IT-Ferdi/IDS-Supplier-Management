'use client';

import { useQuery } from '@tanstack/react-query';
import type { UomDoc, UomRow } from '@/types/uom';

async function fetchUoms(): Promise<UomRow[]> {
    const res = await fetch('/api/uom', { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to fetch UOMs (${res.status})`);
    const json = await res.json();

    // API bisa mengembalikan array langsung, atau { data: [...] }
    const arr: UomDoc[] = Array.isArray(json) ? json : (json?.data ?? []);
    return arr
        .filter(Boolean)
        .map((d) => ({
            id: String(d.id ?? d.name ?? '').trim(),
            name: String(d.name ?? d.id ?? '').trim(),
        }))
        // buang yang kosong
        .filter((u) => u.id && u.name);
}

export function useUomData() {
    return useQuery({
        queryKey: ['uoms'],
        queryFn: fetchUoms,
        staleTime: 5 * 60 * 1000, // 5 menit
    });
}
