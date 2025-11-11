// hooks/useMaterialRequestData.tsx
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

export function useMaterialRequestData() {
    return useQuery<MaterialRequest[], Error>({
        queryKey: ['material-request', 'list'],
        queryFn: fetchMaterialRequests,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * utils: mapping branch name from cost_center string
 */
const BRANCH_NAMES: { [key: string]: string } = {
    'JKT': 'JAKARTA', 'SBY': 'SURABAYA', 'SMG': 'SEMARANG', 'MKS': 'MAKASSAR',
    'MDN': 'MEDAN', 'JBR': 'JEMBER', 'BDL': 'LAMPUNG'
};
function costCenterToBranch(costCenter?: string) {
    const cc = (costCenter ?? '').toString().trim();
    if (!cc) return 'Unassigned';
    if (cc.toUpperCase() === 'SBY-PG') return 'SURABAYA-PG';
    const code = cc.substring(0, 3).toUpperCase();
    return BRANCH_NAMES[code] || code;
}

/**
 * Filter params type
 */
export type MRFilterParams = {
    selectedStatus?: string | string[] | null;
    branch?: string | null;
    selectedBranch?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    selectedDepartment?: string | null;
    selectedCostCenter?: string | null;
    selectedProject?: string | null;
};

/**
 * useFilteredMaterialRequests
 * - return filtered MR array (use this in dashboard to compute aggByItem)
 */
export function useFilteredMaterialRequests(params: MRFilterParams = {}) {
    const { data: mrs = [], isLoading, error } = useMaterialRequestData();
    const {
        selectedStatus, selectedDepartment, selectedCostCenter, selectedProject, start_date, end_date, selectedBranch
    } = params;

    const normalizedStatuses = useMemo(() => {
        if (!selectedStatus) return null;
        return Array.isArray(selectedStatus) ? selectedStatus.map(s => (s ?? '').toString().toLowerCase()) : [selectedStatus.toString().toLowerCase()];
    }, [selectedStatus]);

    const startTime = useMemo(() => (start_date ? new Date(start_date).setHours(0, 0, 0, 0) : null), [start_date]);
    const endTime = useMemo(() => (end_date ? new Date(end_date).setHours(23, 59, 59, 999) : null), [end_date]);

    const filtered = useMemo(() => {
        if (!Array.isArray(mrs)) return [];
        return mrs.filter((mr) => {
            // status
            if (normalizedStatuses && normalizedStatuses.length > 0) {
                const st = (mr.status ?? '').toString().toLowerCase();
                if (!normalizedStatuses.includes(st)) return false;
            }

            // date range (transaction_date)
            if ((startTime || endTime) && mr.transaction_date) {
                const t = new Date(mr.transaction_date).getTime();
                if (startTime && t < startTime) return false;
                if (endTime && t > endTime) return false;
            }

            // selectedDepartment (item-level)
            if (selectedDepartment) {
                const ok = Array.isArray(mr.items) && mr.items.some(it => ((it.department ?? '') as string).toLowerCase().includes(selectedDepartment.toLowerCase()));
                if (!ok) return false;
            }

            // selectedCostCenter (item-level)
            if (selectedCostCenter) {
                const ok = Array.isArray(mr.items) && mr.items.some(it => ((it.cost_center ?? '') as string).toLowerCase().includes(selectedCostCenter.toLowerCase()));
                if (!ok) return false;
            }

            // selectedProject (item-level)
            if (selectedProject) {
                const ok = Array.isArray(mr.items) && mr.items.some(it => ((it.project ?? '') as string).toLowerCase().includes(selectedProject.toLowerCase()));
                if (!ok) return false;
            }

            // selectedBranch: match mr.cost_center -> branch
            if (selectedBranch) {
                const branch = costCenterToBranch(mr.cost_center);
                if (branch !== selectedBranch) return false;
            }

            return true;
        });
    }, [mrs, normalizedStatuses, startTime, endTime, selectedDepartment, selectedCostCenter, selectedProject, selectedBranch]);

    return {
        filtered,
        isLoading,
        error,
        raw: mrs,
    };
}

/**
 * Project list hook
 * - Menghasilkan daftar project (name, value, count)
 * - Params optional: selectedStatus, selectedBranch, date range
 */
export function useMaterialRequestProjectList(params?: {
    selectedStatus?: string | string[] | null;
    selectedBranch?: string | null;
    start_date?: string | null;
    end_date?: string | null;
}) {
    const { data: mrs = [], isLoading, error } = useMaterialRequestData();
    const { selectedStatus, selectedBranch, start_date, end_date } = params ?? {};

    const normalizedStatuses = useMemo(() => {
        if (!selectedStatus) return null;
        return Array.isArray(selectedStatus) ? selectedStatus.map(s => (s ?? '').toString().toLowerCase()) : [selectedStatus.toString().toLowerCase()];
    }, [selectedStatus]);

    const startTime = useMemo(() => (start_date ? new Date(start_date).setHours(0, 0, 0, 0) : null), [start_date]);
    const endTime = useMemo(() => (end_date ? new Date(end_date).setHours(23, 59, 59, 999) : null), [end_date]);

    const result = useMemo(() => {
        if (!Array.isArray(mrs) || mrs.length === 0) return { projects: [], total: 0 };

        const map = new Map<string, number>();

        mrs.forEach(mr => {
            // status filter
            if (normalizedStatuses && normalizedStatuses.length > 0) {
                const st = (mr.status ?? '').toString().toLowerCase();
                if (!normalizedStatuses.includes(st)) return;
            }

            // branch filter
            if (selectedBranch) {
                const branch = costCenterToBranch(mr.cost_center);
                if (branch !== selectedBranch) return;
            }

            // date range
            if ((startTime || endTime) && mr.transaction_date) {
                const t = new Date(mr.transaction_date).getTime();
                if (startTime && t < startTime) return;
                if (endTime && t > endTime) return;
            }

            (mr.items || []).forEach((it: MaterialRequestItem) => {
                const p = (it.project ?? '').toString().trim();
                if (!p) return;
                map.set(p, (map.get(p) ?? 0) + 1);
            });
        });

        const arr = Array.from(map.entries()).map(([name, count]) => ({ name, value: name, count }));
        arr.sort((a, b) => b.count - a.count);
        return { projects: arr, total: arr.reduce((s, x) => s + x.count, 0) };
    }, [mrs, normalizedStatuses, selectedBranch, startTime, endTime]);

    return { isLoading, error, ...result };
}

/**
 * Department summary (accept selectedBranch and selectedStatus and selectedProject)
 */
export function useMaterialRequestDepartmentSummary(params?: {
    selectedStatus?: string | string[] | null;
    selectedBranch?: string | null;
    selectedProject?: string | null;
    start_date?: string | null;
    end_date?: string | null;
}) {
    const { data: mrs = [], isLoading, error } = useMaterialRequestData();
    const { selectedStatus, selectedBranch, selectedProject, start_date, end_date } = params ?? {};

    const normalizedStatuses = useMemo(() => {
        if (!selectedStatus) return null;
        return Array.isArray(selectedStatus) ? selectedStatus.map(s => (s ?? '').toString().toLowerCase()) : [selectedStatus.toString().toLowerCase()];
    }, [selectedStatus]);

    const startTime = useMemo(() => (start_date ? new Date(start_date).setHours(0, 0, 0, 0) : null), [start_date]);
    const endTime = useMemo(() => (end_date ? new Date(end_date).setHours(23, 59, 59, 999) : null), [end_date]);

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

    const result = useMemo(() => {
        if (!Array.isArray(mrs) || mrs.length === 0) return { data: [], total: 0 };

        const map = new Map<string, number>();

        mrs.forEach((mr) => {
            // status filter
            if (normalizedStatuses && normalizedStatuses.length > 0) {
                const st = (mr.status ?? '').toString().toLowerCase();
                if (!normalizedStatuses.includes(st)) return;
            }

            // branch filter
            if (selectedBranch) {
                const branch = costCenterToBranch(mr.cost_center);
                if (branch !== selectedBranch) return;
            }

            // date range
            if ((startTime || endTime) && mr.transaction_date) {
                const t = new Date(mr.transaction_date).getTime();
                if (startTime && t < startTime) return;
                if (endTime && t > endTime) return;
            }

            // project filter (item-level)
            if (selectedProject) {
                const ok = Array.isArray(mr.items) && mr.items.some(it => ((it.project ?? '') as string).toLowerCase().includes(selectedProject.toLowerCase()));
                if (!ok) return;
            }

            // collect unique departments in this MR
            const seen = new Set<string>();
            (mr.items || []).forEach((it: MaterialRequestItem) => {
                const raw = (it.department ?? '').toString().trim().toUpperCase();
                if (!raw) return;
                const mapped = departmentMapping[raw] ?? raw;
                seen.add(mapped);
            });

            seen.forEach(dep => {
                map.set(dep, (map.get(dep) ?? 0) + 1);
            });
        });

        const arr = Array.from(map.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
        const total = arr.reduce((s, x) => s + x.count, 0);
        const data = arr.map((entry, i) => ({
            name: entry.name,
            count: entry.count,
            color: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
            percent: total > 0 ? Math.round((entry.count / total) * 100) : 0,
        }));

        return { data, total };
    }, [mrs, normalizedStatuses, selectedBranch, selectedProject, startTime, endTime]);

    return {
        isLoading,
        error,
        ...result,
    };
}

/**
 * Summary hook (accept selectedBranch + selectedDept + selectedStatus + selectedProject)
 */
export function useMaterialRequestSummary(params?: {
    selectedStatus?: string | string[] | null;
    selectedDepartment?: string | null;
    selectedBranch?: string | null;
    selectedProject?: string | null;
    start_date?: string | null;
    end_date?: string | null;
}) {
    const { data: mrs = [], isLoading, error } = useMaterialRequestData();
    const { selectedStatus, selectedDepartment, selectedBranch, selectedProject, start_date, end_date } = params ?? {};

    const normalizedStatuses = useMemo(() => {
        if (!selectedStatus) return null;
        return Array.isArray(selectedStatus) ? selectedStatus.map(s => (s ?? '').toString().toLowerCase()) : [selectedStatus.toString().toLowerCase()];
    }, [selectedStatus]);

    const startTime = useMemo(() => (start_date ? new Date(start_date).setHours(0, 0, 0, 0) : null), [start_date]);
    const endTime = useMemo(() => (end_date ? new Date(end_date).setHours(23, 59, 59, 999) : null), [end_date]);

    const result = useMemo(() => {
        if (!Array.isArray(mrs) || mrs.length === 0) {
            return { latestDate: null, nearestRequiredBy: null, totalMR: 0, draftCount: 0, partiallyOrderedCount: 0 };
        }

        let latest: string | null = null;
        const requiredDates: string[] = [];
        let total = 0;
        let draft = 0;
        let partial = 0;

        mrs.forEach((mr) => {
            // status filter
            if (normalizedStatuses && normalizedStatuses.length > 0) {
                const st = (mr.status ?? '').toString().toLowerCase();
                if (!normalizedStatuses.includes(st)) return;
            }

            // branch filter
            if (selectedBranch) {
                const branch = costCenterToBranch(mr.cost_center);
                if (branch !== selectedBranch) return;
            }

            // date range
            if ((startTime || endTime) && mr.transaction_date) {
                const t = new Date(mr.transaction_date).getTime();
                if (startTime && t < startTime) return;
                if (endTime && t > endTime) return;
            }

            // department filter (item-level)
            if (selectedDepartment) {
                const ok = Array.isArray(mr.items) && mr.items.some(it => ((it.department ?? '') as string).toLowerCase().includes(selectedDepartment.toLowerCase()));
                if (!ok) return;
            }

            // project filter (item-level)
            if (selectedProject) {
                const ok = Array.isArray(mr.items) && mr.items.some(it => ((it.project ?? '') as string).toLowerCase().includes(selectedProject.toLowerCase()));
                if (!ok) return;
            }

            // count MR
            total++;
            const st = (mr.status ?? '').toString().toLowerCase();
            if (st === 'draft') draft++;
            if (st === 'partially ordered') partial++;

            if (mr.transaction_date) {
                if (!latest || new Date(mr.transaction_date) > new Date(latest)) latest = mr.transaction_date;
            }
            if (mr.required_by) requiredDates.push(mr.required_by);
        });

        const today = new Date();
        const sortedReq = requiredDates.map(d => ({ raw: d, time: new Date(d).getTime() })).sort((a, b) => a.time - b.time);
        const future = sortedReq.find(s => s.time >= new Date(today.toDateString()).getTime());
        const nearest = future ? future.raw : (sortedReq[0]?.raw ?? null);

        return { latestDate: latest, nearestRequiredBy: nearest, totalMR: total, draftCount: draft, partiallyOrderedCount: partial };
    }, [mrs, normalizedStatuses, selectedDepartment, selectedBranch, selectedProject, startTime, endTime]);

    return {
        isLoading,
        error,
        ...result,
    };
}

/**
 * Branch summary hook (counts MR per branch)
 * - accept selectedProject as optional param too
 */
export function useMaterialRequestBranchSummary(params?: {
    selectedStatus?: string | string[] | null;
    selectedProject?: string | string[] | null;
    start_date?: string | null;
    end_date?: string | null;
}) {
    const { data: mrs = [], isLoading, error } = useMaterialRequestData();
    const { selectedStatus, selectedProject, start_date, end_date } = params ?? {};

    const normalizedStatuses = useMemo(() => {
        if (!selectedStatus) return null;
        return Array.isArray(selectedStatus) ? selectedStatus.map(s => (s ?? '').toString().toLowerCase()) : [selectedStatus.toString().toLowerCase()];
    }, [selectedStatus]);

    const normalizedProjects = useMemo(() => {
        if (!selectedProject) return null;
        return Array.isArray(selectedProject) ? selectedProject.map(s => (s ?? '').toString().toLowerCase()) : [selectedProject.toString().toLowerCase()];
    }, [selectedProject]);

    const startTime = useMemo(() => (start_date ? new Date(start_date).setHours(0, 0, 0, 0) : null), [start_date]);
    const endTime = useMemo(() => (end_date ? new Date(end_date).setHours(23, 59, 59, 999) : null), [end_date]);

    const result = useMemo(() => {
        if (!Array.isArray(mrs) || mrs.length === 0) return { data: [], total: 0 };

        const map = new Map<string, number>();
        Object.values(BRANCH_NAMES).forEach(n => map.set(n, 0));
        map.set('SURABAYA-PG', map.get('SURABAYA-PG') ?? 0);

        mrs.forEach((mr) => {
            if (normalizedStatuses && normalizedStatuses.length > 0) {
                const st = (mr.status ?? '').toString().toLowerCase();
                if (!normalizedStatuses.includes(st)) return;
            }

            if ((startTime || endTime) && mr.transaction_date) {
                const t = new Date(mr.transaction_date).getTime();
                if (startTime && t < startTime) return;
                if (endTime && t > endTime) return;
            }

            // project filter (item-level)
            if (normalizedProjects && normalizedProjects.length > 0) {
                // include MR only if any item matches one of selected projects
                const ok = Array.isArray(mr.items) && mr.items.some(it => {
                    const p = ((it.project ?? '') as string).toLowerCase();
                    return normalizedProjects.some(np => p.includes(np));
                });
                if (!ok) return;
            }

            const branch = costCenterToBranch(mr.cost_center);
            map.set(branch, (map.get(branch) ?? 0) + 1);
        });

        const arr = Array.from(map.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
        const total = arr.reduce((s, x) => s + x.count, 0);
        return { data: arr, total };
    }, [mrs, normalizedStatuses, normalizedProjects, startTime, endTime]);

    return { isLoading, error, ...result };
}
