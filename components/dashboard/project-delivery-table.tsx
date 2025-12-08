// components/dashboard/project-delivery-table.tsx
'use client';

import React, { useMemo } from 'react';
import { useFilteredMaterialRequests } from '@/hooks/useMaterialRequestData';
import type { MRFilterParams } from '@/hooks/useMaterialRequestData';
import type { MaterialRequest, MaterialRequestItem } from '@/types/material-request';

type Props = {
    filters?: Partial<MRFilterParams>;
    onSelectProject?: (projectName: string) => void;
    maxRows?: number;
};

function formatDateIso(iso?: string | null) {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * ProjectDeliveryTable (NEW logic: newest delivery_date per project)
 *
 * - Scans filteredMRs (already filtered by dashboard filters)
 * - For each MR -> each item:
 *    - reads item.project (trim)
 *    - reads item.delivery_date (if valid date)
 * - For each project, keeps the MAX (latest) delivery_date across all items
 * - Only includes projects that have at least one valid delivery_date
 * - Sorts by delivery_date desc (newest first)
 */
export default function ProjectDeliveryTable({ filters, onSelectProject, maxRows = 20 }: Props) {
    const { filtered: filteredMRs = [], isLoading, error } = useFilteredMaterialRequests({
        selectedStatus: filters?.selectedStatus ?? null,
        selectedBranch: filters?.selectedBranch ?? null,
        selectedType: filters?.selectedType ?? null,
        start_date: filters?.start_date ?? null,
        end_date: filters?.end_date ?? null,
        required_start: filters?.required_start ?? null,
        required_end: filters?.required_end ?? null,
        selectedDepartment: (filters as any)?.selectedDepartment ?? null,
        selectedProject: filters?.selectedProject ?? null,
    });

    const rows = useMemo(() => {
        const map = new Map<string, string>(); // project -> iso date (max/latest)

        (filteredMRs as MaterialRequest[]).forEach((mr) => {
            (mr.items ?? []).forEach((it: MaterialRequestItem) => {
                const projRaw = (it.project ?? '').toString().trim();
                if (!projRaw) return;

                const rawDelivery = (it as any).delivery_date ?? null;
                if (!rawDelivery) return;

                // Try parse date
                const dt = new Date(rawDelivery);
                if (isNaN(dt.getTime())) return;

                const iso = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).toISOString(); // normalize to date ISO
                const cur = map.get(projRaw);
                if (!cur) {
                    map.set(projRaw, iso);
                } else {
                    // keep the latest (max)
                    if (iso > cur) map.set(projRaw, iso);
                }
            });
        });

        // Build array only for projects that have delivery_date
        const arr = Array.from(map.entries()).map(([project, deliveryIso]) => ({
            project,
            deliveryIso,
        }));

        // Sort newest first (desc)
        arr.sort((a, b) => {
            if (a.deliveryIso === b.deliveryIso) return a.project.localeCompare(b.project);
            return b.deliveryIso.localeCompare(a.deliveryIso);
        });

        return arr.slice(0, maxRows);
    }, [filteredMRs, maxRows]);

    if (isLoading) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-500">
                Loading projects...
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-rose-600">
                Failed to load projects.
            </div>
        );
    }

    if (rows.length === 0) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-500">
                No projects with delivery date found.
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-slate-700">Project</div>
                <div className="text-xs text-slate-400">Delivery Date</div>
            </div>

            <div className="divide-y max-h-[350px] overflow-auto">
                {rows.map((r) => (
                    <button
                        key={r.project}
                        onClick={() => onSelectProject?.(r.project)}
                        className="w-full text-left py-2 px-2 hover:bg-slate-50 rounded-md flex items-center justify-between gap-4"
                        title={r.project}
                    >
                        <div className="min-w-0">
                            <div className="text-sm font-medium text-slate-800 truncate">{r.project}</div>
                        </div>
                        <div className="text-sm text-amber-600">
                            {formatDateIso(r.deliveryIso)}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
