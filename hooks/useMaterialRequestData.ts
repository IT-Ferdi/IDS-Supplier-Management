'use client';

import { useQuery } from '@tanstack/react-query';
import type { MaterialRequest } from '@/types/material-request';

async function fetchMaterialRequests(): Promise<MaterialRequest[]> {
    const res = await fetch('/api/material-request', { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to fetch material requests (${res.status})`);

    const json = await res.json();
    // API bisa mengembalikan array langsung atau { data: [...] }
    const arr: MaterialRequest[] = Array.isArray(json) ? json : (json?.data ?? []);
    return arr;
}

export function useMaterialRequestData(p0?: { statuses: string[]; }) {
    return useQuery<MaterialRequest[], Error>({
        queryKey: ['material-request', 'list'],
        queryFn: fetchMaterialRequests,
        staleTime: 5 * 60 * 1000, // 5 menit
    });
}
