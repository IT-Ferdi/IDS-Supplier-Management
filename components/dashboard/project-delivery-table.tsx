// components/dashboard/project-delivery-table.tsx
'use client';

import React, { useMemo, useState } from 'react';
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

export default function ProjectDeliveryTable({ filters, onSelectProject, maxRows = 999 }: Props) {
    const { filtered: filteredMRs = [], isLoading, error } = useFilteredMaterialRequests({
        selectedStatus: filters?.selectedStatus ?? null,
        selectedBranch: filters?.selectedBranch ?? null,
        selectedType: filters?.selectedType ?? null,
        start_date: filters?.start_date ?? null,
        end_date: filters?.end_date ?? null,
        required_start: filters?.required_start ?? null,
        required_end: filters?.required_end ?? null,
        selectedDepartment: filters?.selectedDepartment ?? null,
        selectedProject: filters?.selectedProject ?? null,
    });

    // 🔍 Search state
    const [search, setSearch] = useState('');

    // 📄 Pagination
    const [page, setPage] = useState(1);
    const pageSize = 10; // fixed page size, can be made adjustable

    const rows = useMemo(() => {
        const map = new Map<string, string>(); // project -> latest date

        (filteredMRs as MaterialRequest[]).forEach((mr) => {
            (mr.items ?? []).forEach((it: MaterialRequestItem) => {
                const proj = (it.project ?? '').toString().trim();
                if (!proj) return;

                const raw = (it as any).delivery_date ?? null;
                if (!raw) return;

                const dt = new Date(raw);
                if (isNaN(dt.getTime())) return;

                const iso = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).toISOString();
                const cur = map.get(proj);

                if (!cur || iso > cur) {
                    map.set(proj, iso);
                }
            });
        });

        let arr = Array.from(map.entries()).map(([project, deliveryIso]) => ({
            project,
            deliveryIso,
        }));

        // 🔍 Search filter
        if (search.trim() !== '') {
            const q = search.toLowerCase();
            arr = arr.filter((r) => r.project.toLowerCase().includes(q));
        }

        // Sort newest first
        arr.sort((a, b) => b.deliveryIso.localeCompare(a.deliveryIso));

        return arr;
    }, [filteredMRs, search]);

    const totalRows = rows.length;
    const totalPages = Math.ceil(totalRows / pageSize);

    // clamp page
    const currentPage = Math.min(page, totalPages || 1);

    const pagedRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
                <div className="text-sm font-medium text-slate-700">Project & Due Date</div>
            </div>
            {/* SEARCH */}
            <input
                type="text"
                value={search}
                onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                }}
                placeholder="Search Project..."
                className="w-full mb-3 px-2 py-1.5 border rounded-md text-sm"
            />

            {/* TABLE LIST */}
            <div className="divide-y max-h-[260px] overflow-auto">
                {pagedRows.map((r) => (
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

            {/* PAGINATION */}
            <div className="flex items-center justify-between mt-3 text-sm">
                <div className="text-slate-500">
                    Page {currentPage} / {totalPages || 1}
                </div>

                <div className="flex gap-2">
                    <button
                        disabled={currentPage <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="px-2 py-1 border rounded disabled:opacity-40"
                    >
                        Prev
                    </button>

                    <button
                        disabled={currentPage >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        className="px-2 py-1 border rounded disabled:opacity-40"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}
