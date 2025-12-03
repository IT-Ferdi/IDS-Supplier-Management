// components/dashboard/project-delivery-table.tsx
'use client';

import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { useFilteredMaterialRequests } from '@/hooks/useMaterialRequestData';
import type { MRType } from '@/hooks/useMaterialRequestData';
import type { MaterialRequest, MaterialRequestItem } from '@/types/material-request';

type Filters = {
    selectedStatus?: string | string[] | null;
    selectedBranch?: string | null;
    selectedType?: MRType | null;
    start_date?: string | null;
    end_date?: string | null;
    required_start?: string | null;
    required_end?: string | null;
    selectedDepartment?: string | null;
    selectedProject?: string | null;
};

type Props = {
    filters?: Filters;
    onSelectProject?: (projectName: string | null) => void;
    maxRows?: number;
};

/**
 * ProjectDeliveryTable (simplified)
 * Columns: Project | MR count | Delivery Date
 * Delivery Date = next upcoming delivery_date (>= today) if available,
 * otherwise earliest delivery_date; else '-'
 */
export default function ProjectDeliveryTable({ filters, onSelectProject, maxRows = 999 }: Props) {
    const { filtered: filteredMRs = [], isLoading, error } = useFilteredMaterialRequests({
        selectedStatus: filters?.selectedStatus,
        selectedBranch: filters?.selectedBranch,
        selectedType: filters?.selectedType,
        start_date: filters?.start_date,
        end_date: filters?.end_date,
        required_start: filters?.required_start,
        required_end: filters?.required_end,
        selectedDepartment: filters?.selectedDepartment,
        selectedProject: filters?.selectedProject,
    });

    const rows = useMemo(() => {
        if (!Array.isArray(filteredMRs)) return [];

        const map = new Map<string, { count: number; dates: number[] }>();

        for (const mr of filteredMRs as MaterialRequest[]) {
            const items = mr.items ?? [];
            for (const it of items as MaterialRequestItem[]) {
                const projectName = (it.project ?? '').toString().trim();
                if (!projectName) continue;

                const raw = (it as any).delivery_date ?? null;
                let ts: number | null = null;
                if (raw) {
                    const d = new Date(raw);
                    if (!isNaN(d.getTime())) {
                        ts = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
                    }
                }

                const cur = map.get(projectName) ?? { count: 0, dates: [] };
                cur.count += 1;
                if (ts !== null) cur.dates.push(ts);
                map.set(projectName, cur);
            }
        }

        const todayTs = (() => {
            const d = new Date();
            return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        })();

        const arr = Array.from(map.entries()).map(([name, v]) => {
            const datesSorted = v.dates.slice().sort((a, b) => a - b);
            const next = datesSorted.find(d => d >= todayTs) ?? null;
            const fallback = datesSorted.length > 0 ? datesSorted[0] : null;
            const chosen = next ?? fallback;
            return {
                name,
                count: v.count,
                deliveryTs: chosen, // may be null
            };
        });

        // sort: most MR count first, then earliest delivery
        arr.sort((a, b) => {
            if (b.count !== a.count) return b.count - a.count;
            const aKey = a.deliveryTs ?? Number.MAX_SAFE_INTEGER;
            const bKey = b.deliveryTs ?? Number.MAX_SAFE_INTEGER;
            return aKey - bKey;
        });

        return arr.slice(0, maxRows);
    }, [filteredMRs, maxRows]);

    const fmt = (ts: number | null) => {
        if (!ts) return '-';
        const d = new Date(ts);
        return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <Card className="p-3">
            {isLoading ? (
                <div className="text-sm text-slate-500">Loading…</div>
            ) : error ? (
                <div className="text-sm text-rose-600">Gagal memuat data</div>
            ) : rows.length === 0 ? (
                <div className="text-sm text-slate-500">No projects found</div>
            ) : (
                <div className="overflow-auto max-h-[360px]">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 sticky top-0">
                            <tr className="text-left text-slate-600">
                                <th className="px-3 py-2 font-medium">Project</th>
                                <th className="px-3 py-2 font-medium w-36">Delivery Date</th>
                            </tr>
                        </thead>

                        <tbody>
                            {rows.map(r => (
                                <tr
                                    key={r.name}
                                    onClick={() => onSelectProject ? onSelectProject(r.name) : undefined}
                                    className="border-t border-slate-100 hover:bg-sky-50 cursor-pointer"
                                    title={`Click to filter by project ${r.name}`}
                                >
                                    <td className="px-3 py-2 max-w-[220px] truncate">{r.name}</td>
                                    <td className={`px-3 py-2 ${r.deliveryTs ? 'text-amber-700 font-medium' : 'text-slate-400'}`}>{fmt(r.deliveryTs)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Card>
    );
}
