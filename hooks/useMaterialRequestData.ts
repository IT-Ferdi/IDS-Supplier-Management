'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { MaterialRequest, MaterialRequestItem } from '@/types/material-request';

async function fetchMaterialRequests(): Promise<MaterialRequest[]> {
    const res = await fetch('/api/material-request', { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to fetch material requests (${res.status})`);
    const json = await res.json();
    const arr: MaterialRequest[] = Array.isArray(json) ? json : (json?.data ?? []);
    return arr;
}

/**
 * Hook utama. Tetap seperti sekarang.
 */
export function useMaterialRequestData() {
    return useQuery<MaterialRequest[], Error>({
        queryKey: ['material-request', 'list'],
        queryFn: fetchMaterialRequests,
        staleTime: 5 * 60 * 1000, // 5 menit
    });
}

/**
 * Filter params. Semua opsional.
 * - selectedStatus: single string atau array (contoh: 'draft' atau ['draft','partially ordered'])
 * - branch: string (cari di mr.branch atau mr.cost_center)
 * - start_date / end_date: ISO date string (filter by transaction_date, bisa diganti ke required_by jika mau)
 * - selectedDepartment / selectedCostCenter / selectedProject: matching pada item-level
 */
export type MRFilterParams = {
    selectedStatus?: string | string[] | null;
    branch?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    selectedDepartment?: string | null;
    selectedCostCenter?: string | null;
    selectedProject?: string | null;
    // pilihan ke depan: groupBy?: 'project' | 'cost_center' | 'department'
};

export type ProjectGroup = { name: string; count: number };

/**
 * useFilteredMaterialRequests
 * - Gunakan untuk mendapatkan MR yang sudah difilter dan grouped by project.
 */
export function useFilteredMaterialRequests(params: MRFilterParams = {}) {
    const { data: mrs = [], isLoading, error } = useMaterialRequestData();

    const {
        selectedStatus,
        branch,
        start_date,
        end_date,
        selectedDepartment,
        selectedCostCenter,
        selectedProject,
    } = params;

    const normalizedStatuses = useMemo(() => {
        if (!selectedStatus) return null;
        if (Array.isArray(selectedStatus)) return selectedStatus.map((s) => (s ?? '').toString().toLowerCase());
        return [selectedStatus.toString().toLowerCase()];
    }, [selectedStatus]);

    const startTime = useMemo(() => (start_date ? new Date(start_date).setHours(0, 0, 0, 0) : null), [start_date]);
    const endTime = useMemo(() => (end_date ? new Date(end_date).setHours(23, 59, 59, 999) : null), [end_date]);

    const filtered = useMemo(() => {
        if (!Array.isArray(mrs)) return [];
        return mrs.filter((mr: MaterialRequest) => {
            // status
            if (normalizedStatuses && normalizedStatuses.length > 0) {
                const st = (mr.status ?? '').toString().toLowerCase();
                if (!normalizedStatuses.includes(st)) return false;
            }

            // branch / cost_center text match (opsional)
            if (branch) {

            }

            // date range -> gunakan transaction_date. Kalau mau required_by, ganti mr.transaction_date -> mr.required_by
            if ((startTime || endTime) && mr.transaction_date) {
                const t = new Date(mr.transaction_date).getTime();
                if (startTime && t < startTime) return false;
                if (endTime && t > endTime) return false;
            }

            // department filter (cari pada items)
            if (selectedDepartment) {
                const ok = Array.isArray(mr.items) && mr.items.some((it: MaterialRequestItem) =>
                    ((it.department ?? '') as string).toLowerCase().includes(selectedDepartment.toLowerCase())
                );
                if (!ok) return false;
            }

            // cost center filter (cari pada items)
            if (selectedCostCenter) {
                const ok = Array.isArray(mr.items) && mr.items.some((it: MaterialRequestItem) =>
                    ((it.cost_center ?? '') as string).toLowerCase().includes(selectedCostCenter.toLowerCase())
                );
                if (!ok) return false;
            }

            // project filter (cari pada items)
            if (selectedProject) {
                const ok = Array.isArray(mr.items) && mr.items.some((it: MaterialRequestItem) =>
                    ((it.project ?? '') as string).toLowerCase().includes(selectedProject.toLowerCase())
                );
                if (!ok) return false;
            }

            return true;
        });
    }, [mrs, normalizedStatuses, branch, startTime, endTime, selectedDepartment, selectedCostCenter, selectedProject]);

    // Group by project. Hitung berapa MR terkait masing-masing project.
    const groupedByProject = useMemo<ProjectGroup[]>(() => {
        const map = new Map<string, number>();

        filtered.forEach((mr: MaterialRequest) => {
            if (!Array.isArray(mr.items) || mr.items.length === 0) {
                const key = 'Unassigned';
                map.set(key, (map.get(key) ?? 0) + 1);
                return;
            }

            // kumpulkan unique project pada MR ini, supaya satu MR tidak dihitung berulang untuk project yang sama
            const set = new Set<string>();
            mr.items.forEach((it: MaterialRequestItem) => {
                const proj = (it.project ?? '').toString().trim();
                set.add(proj || 'Unassigned');
            });

            set.forEach((projName) => {
                const key = projName || 'Unassigned';
                map.set(key, (map.get(key) ?? 0) + 1);
            });
        });

        const arr = Array.from(map.entries()).map(([name, count]) => ({ name, count }));
        arr.sort((a, b) => b.count - a.count);
        return arr;
    }, [filtered]);

    // Totals / ringkasan counts per status
    const totals = useMemo(() => {
        const totalMR = filtered.length;
        const byStatus = (statuses: string[]) =>
            filtered.filter((m) => {
                const s = (m.status ?? '').toString().toLowerCase();
                return statuses.some((st) => s === st || s.includes(st));
            }).length;

        return {
            totalMR,
            draft: byStatus(['draft']),
            partiallyOrdered: byStatus(['partially ordered', 'partially_ordered', 'partiallyordered']),
        };
    }, [filtered]);

    return {
        filtered, // array MaterialRequest setelah filter
        groupedByProject, // [{name, count}]
        totals, // { totalMR, draft, partiallyOrdered }
        isLoading,
        error,
        raw: mrs,
    };
}

export function useMaterialRequestDepartmentSummary() {
    const { data: mrs = [], isLoading, error } = useMaterialRequestData();

    // Mapping department seperti di sistem utama
    const departmentMapping: { [key: string]: string } = {
        'CONDITION BASE MONITORING - IDS': 'CONDITION BASE MONITORING',
        'ELECTRICAL PANEL - IDS': 'ELECTRICAL PANEL',
        'FABRIKASI INDUSTRIAL BLOWER - IDS': 'BLOWER',
        'FABRIKASI INDUSTRIAL COMPRESSOR - IDS': 'COMPRESSOR',
        'FABRIKASI INDUSTRIAL VACUUM - IDS': 'VACUUM',
        'GENERAL FABRIKASI INDUSTRIAL - IDS': 'GENERAL INDUSTRI',
        'GENERAL INDUSTRI - IDS': 'GENERAL INDUSTRI',
        'INDUSTRIAL REPAIR - IDS': 'INDUSTRIAL REPAIR',
        'OTOMOTIF BANYUWANGI - IDS': 'OTOMOTIF',
        'OTOMOTIF BONDOWOSO - IDS': 'OTOMOTIF',
        'OTOMOTIF JEMBER - IDS': 'OTOMOTIF',
        'OTOMOTIF LUMAJANG - IDS': 'OTOMOTIF',
        'OTOMOTIF PROBOLINGGO - IDS': 'OTOMOTIF',
        'REWINDING - IDS': 'REWINDING',
        'SERVICE BLOWER - IDS': 'BLOWER',
        'SERVICE COMPRESSOR - IDS': 'COMPRESSOR',
        'SERVICE VACUUM - IDS': 'VACUUM',
        'SPARE PART BLOWER - IDS': 'BLOWER',
        'SPARE PART COMPRESSOR - IDS': 'COMPRESSOR',
        'SPARE PART VACUUM - IDS': 'VACUUM',
        'UNIT BLOWER - IDS': 'BLOWER',
        'UNIT COMPRESSOR - IDS': 'COMPRESSOR',
        'UNIT VACUUM - IDS': 'VACUUM'
    };

    const DEFAULT_COLORS = [
        '#2563eb', '#f59e0b', '#10b981', '#ef4444',
        '#7c3aed', '#06b6d4', '#f97316', '#0891b2',
    ];

    const departmentData = useMemo(() => {
        if (!mrs || mrs.length === 0) return { data: [], total: 0 };

        const map = new Map<string, number>();

        mrs.forEach((mr) => {
            const seen = new Set<string>();
            (mr.items || []).forEach((it) => {
                const raw = (it.department || '').trim().toUpperCase();
                if (!raw) return;
                const mapped = departmentMapping[raw] ?? raw;
                seen.add(mapped);
            });
            seen.forEach((dep) => {
                map.set(dep, (map.get(dep) ?? 0) + 1);
            });
        });

        const arr = Array.from(map.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        const total = arr.reduce((sum, x) => sum + x.count, 0);

        const data = arr.map((entry, i) => {
            const color = DEFAULT_COLORS[i % DEFAULT_COLORS.length];
            const percent = total > 0 ? Math.round((entry.count / total) * 100) : 0;
            return { ...entry, color, percent };
        });

        return { data, total };
    }, [mrs]);

    return {
        isLoading,
        error,
        ...departmentData, // { data, total }
    };
}
