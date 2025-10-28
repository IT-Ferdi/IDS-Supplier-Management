// hooks/useRegionData.ts
'use client';

import { useQuery } from '@tanstack/react-query';

/** Bentuk data seragam dari API internal */
export type Row = { code: string; name: string };
export type Option = { label: string; value: string };

const toOptions = (rows: Row[] = []): Option[] =>
  rows
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, 'id'))
    .map((r) => ({ label: r.name, value: r.code }));

/* =======================
 * COUNTRIES
 * ======================= */
export const useCountries = () =>
  useQuery<Row[], Error>({
    queryKey: ['region', 'countries'],
    queryFn: async () => {
      const res = await fetch('/api/region/country', { cache: 'force-cache' });
      if (!res.ok) throw new Error('Failed to fetch countries');
      return res.json();
    },
    staleTime: 1000 * 60 * 60 * 24, // 1 hari
  });

export const useCountryOptions = () => {
  const q = useCountries();
  return {
    ...q,
    data: q.data ? toOptions(q.data) : [],
  };
};

/* =======================
 * PROVINCES
 * ======================= */
export const useProvinces = () =>
  useQuery<Row[], Error>({
    queryKey: ['region', 'provinces'],
    queryFn: async () => {
      const res = await fetch('/api/region/province', { cache: 'force-cache' });
      if (!res.ok) throw new Error('Failed to fetch provinces');
      return res.json();
    },
    staleTime: 1000 * 60 * 60 * 24,
  });

export const useProvinceOptions = () => {
  const q = useProvinces();
  return {
    ...q,
    data: q.data ? toOptions(q.data) : [],
  };
};

/* =======================
 * CITIES (depend on provinceCode)
 * ======================= */
export const useCities = (provinceCode?: string) =>
  useQuery<Row[], Error>({
    queryKey: ['region', 'cities', provinceCode],
    queryFn: async () => {
      const res = await fetch(
        `/api/region/city/${encodeURIComponent(provinceCode!)}`,
        { cache: 'force-cache' }
      );
      if (!res.ok) throw new Error('Failed to fetch cities');
      return res.json();
    },
    enabled: !!provinceCode, // hanya jalan kalau ada kode provinsi
    staleTime: 1000 * 60 * 60 * 24,
  });

export const useCityOptions = (provinceCode?: string) => {
  const q = useCities(provinceCode);
  return {
    ...q,
    data: q.data ? toOptions(q.data) : [],
  };
};
