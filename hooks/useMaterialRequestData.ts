// hooks/useMaterialRequestData.tsx
'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { MaterialRequest, MaterialRequestItem } from '@/types/material-request';

type PoMeta = { po_name?: string; supplier?: string; transaction_date?: string };

type MakePoPayload = {
    item_codes: string[];
    po_meta?: {
        po_name?: string;
        supplier?: string;
        transaction_date?: string;
        qty?: number;
        uom?: string;
        [k: string]: any;
    };
};

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

function toDateOnlyTS(raw: any) {
    if (!raw) return null;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return null;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * small helper to normalize strings for comparison
 */
function normalize(s?: string | null) {
    if (s === null || s === undefined) return '';
    return String(s).toLowerCase().trim();
}

/**
 * project type classifier (shared logic)
 */
function classifyProjectType(projectRaw?: string) {
    const p = (projectRaw ?? '').toString().trim().toUpperCase();
    if (!p) return 'Lain-lain';
    const projectPatterns = [/^SO-/, /^SOW-/, /^PK\//, /^PPM\//, /^PP\//];
    if (projectPatterns.some(rx => rx.test(p))) return 'Project';
    if (p.startsWith('OPERATIONAL') || p.startsWith('OPERATIONAL-')) return 'Operational';
    if (p === 'STOCK') return 'Stock';
    return 'Lain-lain';
}

function getMrType(mr: MaterialRequest) {
    if (!Array.isArray(mr.items) || mr.items.length === 0) return 'Lain-lain';
    for (const it of mr.items) {
        if (classifyProjectType(it.project) === 'Project') return 'Project';
    }
    for (const it of mr.items) {
        if (classifyProjectType(it.project) === 'Operational') return 'Operational';
    }
    for (const it of mr.items) {
        if (classifyProjectType(it.project) === 'Stock') return 'Stock';
    }
    return 'Lain-lain';
}

export type MRType = 'Project' | 'Operational' | 'Stock' | 'Lain-lain';

/**
 * Filter params type
 */
export type MRFilterParams = {
    selectedStatus?: string | string[] | null;
    branch?: string | null;
    selectedBranch?: string | null;
    selectedType?: MRType | null;
    start_date?: string | null;        // transaction_date start
    end_date?: string | null;          // transaction_date end
    required_start?: string | null;    // required_by start
    required_end?: string | null;
    selectedDepartment?: string | null;
    selectedCostCenter?: string | null;
    selectedProject?: string | null;
};

/**
 * useFilteredMaterialRequests
 */
export function useFilteredMaterialRequests(params: MRFilterParams = {}) {
    const { data: mrs = [], isLoading, error } = useMaterialRequestData();
    const {
        selectedStatus,
        selectedDepartment,
        selectedCostCenter,
        selectedProject,
        start_date,
        end_date,
        selectedBranch,
        selectedType,
        required_start,
        required_end,
    } = params;

    const normalizedStatuses = useMemo(() => {
        if (!selectedStatus) return null;
        return Array.isArray(selectedStatus) ? selectedStatus.map(s => (s ?? '').toString().toLowerCase()) : [selectedStatus.toString().toLowerCase()];
    }, [selectedStatus]);

    const startTime = useMemo(() => (start_date ? new Date(start_date).setHours(0, 0, 0, 0) : null), [start_date]);
    const endTime = useMemo(() => (end_date ? new Date(end_date).setHours(23, 59, 59, 999) : null), [end_date]);

    const reqStartTime = useMemo(() => (required_start ? new Date(required_start).setHours(0, 0, 0, 0) : null), [required_start]);
    const reqEndTime = useMemo(() => (required_end ? new Date(required_end).setHours(23, 59, 59, 999) : null), [required_end]);

    const filtered = useMemo(() => {
        if (!Array.isArray(mrs)) return [];
        const normProject = normalize(selectedProject ?? null);
        const normDept = normalize(selectedDepartment ?? null);
        const normCostCenter = normalize(selectedCostCenter ?? null);

        return mrs.filter((mr) => {
            // selectedProject (item-level) - use includes on normalized strings
            if (normProject) {
                const ok = Array.isArray(mr.items) && mr.items.some(it => normalize(it.project).includes(normProject));
                if (!ok) return false;
            }

            // status
            if (normalizedStatuses && normalizedStatuses.length > 0) {
                const st = (mr.status ?? '').toString().toLowerCase();
                if (!normalizedStatuses.includes(st)) return false;
            }

            if ((startTime || endTime)) {
                const t = toDateOnlyTS(mr.transaction_date);
                if (t === null) return false;

                if (startTime && t < startTime) return false;
                if (endTime && t > endTime) return false;
            }

            // required_by range
            if ((reqStartTime || reqEndTime)) {
                const t = toDateOnlyTS(mr.required_by);
                if (t === null) return false;

                if (reqStartTime && t < reqStartTime) return false;
                if (reqEndTime && t > reqEndTime) return false;
            }

            // selectedDepartment (item-level)
            if (normDept) {
                const ok = Array.isArray(mr.items) && mr.items.some(it => normalize(it.department).includes(normDept));
                if (!ok) return false;
            }

            // selectedCostCenter (item-level)
            if (normCostCenter) {
                const ok = Array.isArray(mr.items) && mr.items.some(it => normalize(it.cost_center).includes(normCostCenter));
                if (!ok) return false;
            }

            // selectedBranch
            if (selectedBranch) {
                const branch = costCenterToBranch(mr.cost_center);
                if (branch !== selectedBranch) return false;
            }

            // selectedType
            if (selectedType) {
                const mrType = getMrType(mr);
                if (mrType !== selectedType) return false;
            }

            return true;
        });
    }, [mrs, normalizedStatuses, startTime, endTime, reqStartTime, reqEndTime, selectedDepartment, selectedCostCenter, selectedProject, selectedBranch, selectedType]);

    return {
        filtered,
        isLoading,
        error,
        raw: mrs,
    };
}

/**
 * Project list hook
 */
export function useMaterialRequestProjectList(params?: {
    selectedStatus?: string | string[] | null;
    selectedBranch?: string | null;
    selectedType?: MRType | null;
    start_date?: string | null;
    end_date?: string | null;
    required_start?: string | null;
    required_end?: string | null;
}) {
    const { data: mrs = [], isLoading, error } = useMaterialRequestData();
    const { selectedStatus, selectedBranch, selectedType, start_date, end_date, required_start, required_end } = params ?? {};

    const normalizedStatuses = useMemo(() => {
        if (!selectedStatus) return null;
        return Array.isArray(selectedStatus) ? selectedStatus.map(s => (s ?? '').toString().toLowerCase()) : [selectedStatus.toString().toLowerCase()];
    }, [selectedStatus]);

    const startTime = useMemo(() => (start_date ? new Date(start_date).setHours(0, 0, 0, 0) : null), [start_date]);
    const endTime = useMemo(() => (end_date ? new Date(end_date).setHours(23, 59, 59, 999) : null), [end_date]);

    const reqStartTime = useMemo(() => (required_start ? new Date(required_start).setHours(0, 0, 0, 0) : null), [required_start]);
    const reqEndTime = useMemo(() => (required_end ? new Date(required_end).setHours(23, 59, 59, 999) : null), [required_end]);

    const result = useMemo(() => {
        if (!Array.isArray(mrs) || mrs.length === 0) return { projects: [], total: 0 };

        const map = new Map<string, number>();

        mrs.forEach(mr => {
            if (normalizedStatuses && normalizedStatuses.length > 0) {
                const st = (mr.status ?? '').toString().toLowerCase();
                if (!normalizedStatuses.includes(st)) return;
            }

            if (selectedBranch) {
                const branch = costCenterToBranch(mr.cost_center);
                if (branch !== selectedBranch) return;
            }

            if (selectedType) {
                const mrType = getMrType(mr);
                if (mrType !== selectedType) return;
            }

            if ((startTime || endTime)) {
                const t = toDateOnlyTS(mr.transaction_date);
                if (t === null) return false;

                if (startTime && t < startTime) return false;
                if (endTime && t > endTime) return false;
            }

            if ((reqStartTime || reqEndTime)) {
                const t = toDateOnlyTS(mr.required_by);
                if (t === null) return false;

                if (reqStartTime && t < reqStartTime) return false;
                if (reqEndTime && t > reqEndTime) return false;
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
    }, [mrs, normalizedStatuses, selectedBranch, selectedType, startTime, endTime, reqStartTime, reqEndTime]);

    return { isLoading, error, ...result };
}

/**
 * Department summary
 */
export function useMaterialRequestDepartmentSummary(params?: {
    selectedStatus?: string | string[] | null;
    selectedBranch?: string | null;
    selectedProject?: string | null;
    selectedType?: MRType | null;
    start_date?: string | null;
    end_date?: string | null;
    required_start?: string | null;
    required_end?: string | null;
}) {
    const { data: mrs = [], isLoading, error } = useMaterialRequestData();
    const { selectedStatus, selectedBranch, selectedProject, selectedType, start_date, end_date, required_start, required_end } = params ?? {};

    const normalizedStatuses = useMemo(() => {
        if (!selectedStatus) return null;
        return Array.isArray(selectedStatus) ? selectedStatus.map(s => (s ?? '').toString().toLowerCase()) : [selectedStatus.toString().toLowerCase()];
    }, [selectedStatus]);

    const startTime = useMemo(() => (start_date ? new Date(start_date).setHours(0, 0, 0, 0) : null), [start_date]);
    const endTime = useMemo(() => (end_date ? new Date(end_date).setHours(23, 59, 59, 999) : null), [end_date]);

    const reqStartTime = useMemo(() => (required_start ? new Date(required_start).setHours(0, 0, 0, 0) : null), [required_start]);
    const reqEndTime = useMemo(() => (required_end ? new Date(required_end).setHours(23, 59, 59, 999) : null), [required_end]);

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
            if (normalizedStatuses && normalizedStatuses.length > 0) {
                const st = (mr.status ?? '').toString().toLowerCase();
                if (!normalizedStatuses.includes(st)) return;
            }

            if (selectedBranch) {
                const branch = costCenterToBranch(mr.cost_center);
                if (branch !== selectedBranch) return;
            }

            if (selectedType) {
                const mrType = getMrType(mr);
                if (mrType !== selectedType) return;
            }

            if ((startTime || endTime)) {
                const t = toDateOnlyTS(mr.transaction_date);
                if (t === null) return false;

                if (startTime && t < startTime) return false;
                if (endTime && t > endTime) return false;
            }

            if ((reqStartTime || reqEndTime)) {
                const t = toDateOnlyTS(mr.required_by);
                if (t === null) return false;

                if (reqStartTime && t < reqStartTime) return false;
                if (reqEndTime && t > reqEndTime) return false;
            }

            if (selectedProject) {
                const ok = Array.isArray(mr.items) &&
                    mr.items.some(it => it.project === selectedProject);
                if (!ok) return false;
            }

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
    }, [mrs, normalizedStatuses, selectedBranch, selectedProject, selectedType, startTime, endTime, reqStartTime, reqEndTime]);

    return {
        isLoading,
        error,
        ...result,
    };
}

/**
 * Summary hook
 */
export function useMaterialRequestSummary(params?: {
    selectedStatus?: string | string[] | null;
    selectedDepartment?: string | null;
    selectedBranch?: string | null;
    selectedProject?: string | null;
    selectedType?: MRType | null;
    start_date?: string | null;
    end_date?: string | null;
    required_start?: string | null;
    required_end?: string | null;
}) {
    const { data: mrs = [], isLoading, error } = useMaterialRequestData();
    const { selectedStatus, selectedDepartment, selectedBranch, selectedProject, selectedType, start_date, end_date, required_start, required_end } = params ?? {};

    const normalizedStatuses = useMemo(() => {
        if (!selectedStatus) return null;
        return Array.isArray(selectedStatus) ? selectedStatus.map(s => (s ?? '').toString().toLowerCase()) : [selectedStatus.toString().toLowerCase()];
    }, [selectedStatus]);

    const startTime = useMemo(() => (start_date ? new Date(start_date).setHours(0, 0, 0, 0) : null), [start_date]);
    const endTime = useMemo(() => (end_date ? new Date(end_date).setHours(23, 59, 59, 999) : null), [end_date]);

    const reqStartTime = useMemo(() => (required_start ? new Date(required_start).setHours(0, 0, 0, 0) : null), [required_start]);
    const reqEndTime = useMemo(() => (required_end ? new Date(required_end).setHours(23, 59, 59, 999) : null), [required_end]);

    const result = useMemo(() => {
        if (!Array.isArray(mrs) || mrs.length === 0) {
            return { latestDate: null, nearestRequiredBy: null, totalMR: 0, draftCount: 0, partiallyOrderedCount: 0 };
        }

        let oldestTransactionIso: string | null = null;
        let oldestRequiredByIso: string | null = null;
        let oldestRequiredByTs: number | null = null;

        let total = 0;
        let draft = 0;
        let partial = 0;
        let pending = 0;

        mrs.forEach((mr) => {
            if (selectedProject) {
                const normSel = normalize(selectedProject);
                const ok = Array.isArray(mr.items) &&
                    mr.items.some(it => normalize(it.project).startsWith(normSel));
                if (!ok) return false;
            }

            if (normalizedStatuses && normalizedStatuses.length > 0) {
                const st = (mr.status ?? '').toString().toLowerCase();
                if (!normalizedStatuses.includes(st)) return;
            }

            if (selectedBranch) {
                const branch = costCenterToBranch(mr.cost_center);
                if (branch !== selectedBranch) return;
            }

            if (selectedType) {
                const mrType = getMrType(mr);
                if (mrType !== selectedType) return;
            }

            if ((startTime || endTime)) {
                const t = toDateOnlyTS(mr.transaction_date);
                if (t === null) return false;

                if (startTime && t < startTime) return false;
                if (endTime && t > endTime) return false;
            }

            if ((reqStartTime || reqEndTime)) {
                const t = toDateOnlyTS(mr.required_by);
                if (t === null) return false;

                if (reqStartTime && t < reqStartTime) return false;
                if (reqEndTime && t > reqEndTime) return false;
            }

            if (selectedDepartment) {
                const ok = Array.isArray(mr.items) && mr.items.some(it => normalize(it.department).includes(normalize(selectedDepartment)));
                if (!ok) return;
            }

            total++;
            const st = (mr.status ?? '').toString().toLowerCase();
            if (st === 'draft') draft++;
            if (st === 'partially ordered') partial++;
            if (st === 'pending') pending++;

            if (mr.transaction_date) {
                const t = new Date(mr.transaction_date);
                if (!isNaN(t.getTime())) {
                    if (!oldestTransactionIso || new Date(mr.transaction_date) < new Date(oldestTransactionIso)) {
                        oldestTransactionIso = mr.transaction_date;
                    }
                }
            }

            if (mr.required_by) {
                const d = new Date(mr.required_by);
                if (!isNaN(d.getTime())) {
                    const ts = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
                    if (oldestRequiredByTs === null || ts < oldestRequiredByTs) {
                        oldestRequiredByTs = ts;
                        oldestRequiredByIso = mr.required_by;
                    }
                }
            }
        });

        return {
            latestDate: oldestTransactionIso,
            nearestRequiredBy: oldestRequiredByIso,
            totalMR: total,
            draftCount: draft,
            partiallyOrderedCount: partial,
            pendingCount: pending,
        };
    }, [mrs, normalizedStatuses, selectedDepartment, selectedBranch, selectedProject, selectedType, startTime, endTime, reqStartTime, reqEndTime]);

    return {
        isLoading,
        error,
        ...result,
    };
}

/**
 * Branch summary hook
 */
export function useMaterialRequestBranchSummary(params?: {
    selectedStatus?: string | string[] | null;
    selectedProject?: string | string[] | null;
    selectedType?: MRType | null;
    start_date?: string | null;
    end_date?: string | null;
    required_start?: string | null;
    required_end?: string | null;
    selectedBranch?: string | null;
}) {
    const { data: mrs = [], isLoading, error } = useMaterialRequestData();
    const { selectedStatus, selectedProject, selectedType, start_date, end_date, required_start, required_end, selectedBranch } = params ?? {};

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

    const reqStartTime = useMemo(() => (required_start ? new Date(required_start).setHours(0, 0, 0, 0) : null), [required_start]);
    const reqEndTime = useMemo(() => (required_end ? new Date(required_end).setHours(23, 59, 59, 999) : null), [required_end]);

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

            if ((startTime || endTime)) {
                const t = toDateOnlyTS(mr.transaction_date);
                if (t === null) return false;

                if (startTime && t < startTime) return false;
                if (endTime && t > endTime) return false;
            }

            if ((reqStartTime || reqEndTime)) {
                const t = toDateOnlyTS(mr.required_by);
                if (t === null) return false;

                if (reqStartTime && t < reqStartTime) return false;
                if (reqEndTime && t > reqEndTime) return false;
            }

            if (normalizedProjects && normalizedProjects.length > 0) {
                const ok = Array.isArray(mr.items) && mr.items.some(it => {
                    const p = normalize(it.project);
                    return normalizedProjects.some(np => p.includes(np));
                });
                if (!ok) return;
            }

            if (selectedType) {
                const mrType = getMrType(mr);
                if (mrType !== selectedType) return;
            }

            if (selectedBranch) {
                const branch = costCenterToBranch(mr.cost_center);
                if (branch !== selectedBranch) return;
            }

            const branch = costCenterToBranch(mr.cost_center);
            map.set(branch, (map.get(branch) ?? 0) + 1);
        });

        const arr = Array.from(map.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
        const total = arr.reduce((s, x) => s + x.count, 0);
        return { data: arr, total };
    }, [mrs, normalizedStatuses, normalizedProjects, selectedType, startTime, endTime, reqStartTime, reqEndTime, selectedBranch]);

    return { isLoading, error, ...result };
}

/**
 * useMaterialRequestTypeSummary
 */
export type MRTypeCount = { type: 'Project' | 'Operational' | 'Stock' | 'Lain-lain'; count: number };

export function useMaterialRequestTypeSummary(params?: {
    selectedStatus?: string | string[] | null;
    selectedBranch?: string | null;
    selectedProject?: string | null;
    selectedType?: 'Project' | 'Operational' | 'Stock' | 'Lain-lain' | string | null;
    start_date?: string | null;
    end_date?: string | null;
    required_start?: string | null;
    required_end?: string | null;
}) {
    const { data: mrs = [], isLoading, error } = useMaterialRequestData();
    const { selectedStatus, selectedBranch, selectedProject, selectedType, start_date, end_date, required_start, required_end } = params ?? {};

    const normalizedStatuses = useMemo(() => {
        if (!selectedStatus) return null;
        return Array.isArray(selectedStatus)
            ? selectedStatus.map(s => (s ?? '').toString().toLowerCase())
            : [selectedStatus.toString().toLowerCase()];
    }, [selectedStatus]);

    const normalizedType = useMemo(() => {
        if (!selectedType) return null;
        const t = (selectedType ?? '').toString().trim();
        if (!t) return null;
        const up = t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
        if (['Project', 'Operational', 'Stock', 'Lain-lain'].includes(up)) return up;
        return null;
    }, [selectedType]);

    const startTime = useMemo(() => (start_date ? new Date(start_date).setHours(0, 0, 0, 0) : null), [start_date]);
    const endTime = useMemo(() => (end_date ? new Date(end_date).setHours(23, 59, 59, 999) : null), [end_date]);

    const reqStartTime = useMemo(() => (required_start ? new Date(required_start).setHours(0, 0, 0, 0) : null), [required_start]);
    const reqEndTime = useMemo(() => (required_end ? new Date(required_end).setHours(23, 59, 59, 999) : null), [required_end]);

    const result = useMemo(() => {
        if (!Array.isArray(mrs) || mrs.length === 0) {
            return { data: [], total: 0 };
        }

        const counts: Record<string, number> = {
            'Project': 0,
            'Operational': 0,
            'Stock': 0,
            'Lain-lain': 0,
        };

        mrs.forEach(mr => {
            if (normalizedStatuses && normalizedStatuses.length > 0) {
                const st = (mr.status ?? '').toString().toLowerCase();
                if (!normalizedStatuses.includes(st)) return;
            }

            if (selectedBranch) {
                const branch = costCenterToBranch(mr.cost_center);
                if (branch !== selectedBranch) return;
            }

            if ((startTime || endTime)) {
                const t = toDateOnlyTS(mr.transaction_date);
                if (t === null) return false;

                if (startTime && t < startTime) return false;
                if (endTime && t > endTime) return false;
            }

            if ((reqStartTime || reqEndTime)) {
                const t = toDateOnlyTS(mr.required_by);
                if (t === null) return false;

                if (reqStartTime && t < reqStartTime) return false;
                if (reqEndTime && t > reqEndTime) return false;
            }

            if (selectedProject) {
                const ok = Array.isArray(mr.items) &&
                    mr.items.some(it => it.project === selectedProject);
                if (!ok) return false;
            }

            let assignedType: 'Project' | 'Operational' | 'Stock' | 'Lain-lain' = 'Lain-lain';
            if (Array.isArray(mr.items) && mr.items.length > 0) {
                for (const it of mr.items) {
                    const t = classifyProjectType(it.project);
                    if (t === 'Project') { assignedType = 'Project'; break; }
                }
                if (assignedType === 'Lain-lain') {
                    for (const it of mr.items) {
                        const t = classifyProjectType(it.project);
                        if (t === 'Operational') { assignedType = 'Operational'; break; }
                    }
                }
                if (assignedType === 'Lain-lain') {
                    for (const it of mr.items) {
                        const t = classifyProjectType(it.project);
                        if (t === 'Stock') { assignedType = 'Stock'; break; }
                    }
                }
            }

            if (normalizedType && assignedType !== normalizedType) return;

            counts[assignedType] = (counts[assignedType] ?? 0) + 1;
        });

        const arr: MRTypeCount[] = [
            { type: 'Project', count: counts['Project'] },
            { type: 'Operational', count: counts['Operational'] },
            { type: 'Stock', count: counts['Stock'] },
            { type: 'Lain-lain', count: counts['Lain-lain'] },
        ];

        const total = arr.reduce((s, x) => s + x.count, 0);
        return { data: arr, total };
    }, [mrs, normalizedStatuses, selectedBranch, selectedProject, normalizedType, startTime, endTime, reqStartTime, reqEndTime]);

    return { isLoading, error, ...result };
}

/**
 * MR Date range hook
 */
export type MRDateRangeParams = {
    selectedStatus?: string | string[] | null;
    selectedBranch?: string | null;
    selectedProject?: string | null;
    selectedType?: MRType | null;
    selectedDepartment?: string | null;
    date_field?: 'required_by' | 'transaction_date';
};
/**
 * Format an UTC-midnight timestamp (ms) into YYYY-MM-DD string (UTC-based).
 * If ts is null/undefined returns ''.
 */
function formatDateISOFromTS(ts: number | null | undefined): string {
    if (ts === null || ts === undefined) return '';
    const d = new Date(ts);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

/**
 * MR Date range hook (REVISED)
 */
export function useMaterialRequestDateRange(params?: MRDateRangeParams) {
    const { data: mrs = [], isLoading, error } = useMaterialRequestData();
    const {
        selectedStatus,
        selectedBranch,
        selectedProject,
        selectedType,
        selectedDepartment,
        date_field = 'required_by',
    } = params ?? {};

    const normalizedStatuses = useMemo(() => {
        if (!selectedStatus) return null;
        return Array.isArray(selectedStatus)
            ? selectedStatus.map(s => (s ?? '').toString().toLowerCase())
            : [selectedStatus.toString().toLowerCase()];
    }, [selectedStatus]);

    const result = useMemo(() => {
        // default -> today (use UTC date to avoid timezone shift)
        const today = new Date();
        const isoToday = formatDateISOFromTS(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

        if (!Array.isArray(mrs) || mrs.length === 0) {
            return { minDate: isoToday, maxDate: isoToday };
        }

        let minTs: number | null = null;
        let maxTs: number | null = null;

        for (const mr of mrs) {
            if (normalizedStatuses && normalizedStatuses.length > 0) {
                const st = (mr.status ?? '').toString().toLowerCase();
                if (!normalizedStatuses.includes(st)) continue;
            }

            if (selectedBranch) {
                const branch = costCenterToBranch(mr.cost_center);
                if (branch !== selectedBranch) continue;
            }

            if (selectedType) {
                const mrType = getMrType(mr);
                if (mrType !== selectedType) continue;
            }

            if (selectedDepartment) {
                const ok = Array.isArray(mr.items) && mr.items.some(it => normalize(it.department).includes(normalize(selectedDepartment)));
                if (!ok) continue;
            }

            if (selectedProject) {
                const ok = Array.isArray(mr.items) &&
                    mr.items.some(it => it.project === selectedProject);
                if (!ok) continue;
            }

            const raw = (mr as any)[date_field];
            if (!raw) continue;

            // use toDateOnlyTS to normalize to UTC-midnight ms
            const t = toDateOnlyTS(raw);
            if (t === null) continue;

            if (minTs === null || t < minTs) minTs = t;
            if (maxTs === null || t > maxTs) maxTs = t;
        }

        function addOneDay(iso: string) {
            const d = new Date(iso);
            d.setDate(d.getDate() + 1);
            return d.toISOString().slice(0, 10);
        }

        const isoMinRaw = minTs ? new Date(minTs).toISOString().slice(0, 10) : isoToday;
        const isoMaxRaw = maxTs ? new Date(maxTs).toISOString().slice(0, 10) : isoToday;

        // FIX: tambahkan +1 hari agar tidak telat 1 hari karena shift UTC → lokal
        const isoMin = addOneDay(isoMinRaw);
        const isoMax = addOneDay(isoMaxRaw);

        return { minDate: isoMin, maxDate: isoMax };

        return { minDate: isoMin, maxDate: isoMax };
    }, [mrs, normalizedStatuses, selectedBranch, selectedProject, selectedType, selectedDepartment, date_field]);

    return { minDate: result.minDate, maxDate: result.maxDate, isLoading, error };
}


async function apiMakePo(payload: MakePoPayload) {
    const res = await fetch('/api/material-request/make-po', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Make PO failed: ${res.status} ${text}`);
    }
    return res.json();
}

export function useMakePo() {
    const mutation = useMutation({
        mutationFn: async (payload: MakePoPayload) => {
            const res = await fetch('/api/material-request/make-po', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const text = await res.text().catch(() => null);
                throw new Error(text || `Make PO failed (${res.status})`);
            }

            return res.json();
        },

        onError: (err) => {
            console.error('useMakePo error:', err);
        },

    });

    return mutation;
}
