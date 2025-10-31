'use client';

import { useQuery } from '@tanstack/react-query';
import type { SupplierRow } from '@/types/supplier';

type SupplierDoc = {
    _id?: string;
    id: string;
    nama: string;
    alamat_pusat?: string | null;
    kota_pusat?: string | null;
    telp_sales?: string | null;
    email_sales?: string | null;
    telp_finance?: string | null;
    email_finance?: string | null;
    no_npwp?: string | null;
    nik?: string | null;
    alamat_pajak?: string | null;
    payment_terms_template?: string | null;
    payment_terms?: string | null;
    rating?: number | null;
    items?: [string, number][] | null;
    categories?: string[] | null;
};

const normalize = (d: SupplierDoc): SupplierRow => ({
    id: d.id,
    nama: d.nama,
    alamat_pusat: d.alamat_pusat ?? null,
    kota_pusat: d.kota_pusat ?? null,
    telp_sales: d.telp_sales ?? null,
    email_sales: d.email_sales ?? null,
    telp_finance: d.telp_finance ?? null,
    email_finance: d.email_finance ?? null,
    no_npwp: d.no_npwp ?? null,
    nik: d.nik ?? null,
    alamat_pajak: d.alamat_pajak ?? null,
    payment_terms_template: d.payment_terms_template ?? null,
    payment_terms: d.payment_terms ?? null,
    rating: d.rating ?? 0,
    items: d.items ?? [],
    categories: d.categories ?? null,
});

async function fetchSuppliers(): Promise<SupplierRow[]> {
    const res = await fetch('/api/supplier', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch suppliers');
    const json = await res.json();
    // terima array langsung, atau {data: [...]}
    const arr: SupplierDoc[] = Array.isArray(json) ? json : json?.data ?? [];
    return arr.map(normalize);
}

export function useSuppliers() {
    return useQuery({
        queryKey: ['suppliers'],
        queryFn: fetchSuppliers,
        staleTime: 5 * 60 * 1000, // 5 menit
    });
}
