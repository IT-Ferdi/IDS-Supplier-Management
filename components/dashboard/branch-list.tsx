// components/dashboard/branch-list.tsx
'use client';

import React from 'react';

type BranchItem = { name: string; count: number };

export default function BranchList({
    data,
    total = 0,
    selectedBranch = null,
    onBranchClick,
    title = 'Branch / Kota',
}: {
    data: BranchItem[];
    total?: number;
    selectedBranch?: string | null;
    onBranchClick?: (name: string | null) => void;
    title?: string;
}) {
    // filter hanya yang count > 0
    const visible = Array.isArray(data) ? data.filter(d => Number(d.count) > 0) : [];

    // jika setelah filter tidak ada yang tampil, return null
    if (visible.length === 0 || total === 0) return null;

    const COLORS = ['#10B981', '#60A5FA', '#F59E0B', '#EF4444', '#7C3AED', '#06B6D4', '#F97316', '#0891B2'];

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
                <div className="text-xs text-slate-500">Total MR: <span className="font-medium text-slate-700">{total}</span></div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
                {visible.map((d, idx) => {
                    const active = selectedBranch === d.name;
                    const color = COLORS[idx % COLORS.length];
                    return (
                        <button
                            key={d.name}
                            type="button"
                            onClick={() => onBranchClick?.(active ? null : d.name)}
                            className={[
                                'w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2 transition',
                                active ? 'bg-sky-50 ring-1 ring-sky-200' : 'hover:bg-slate-50'
                            ].join(' ')}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <span
                                    className="inline-flex items-center justify-center rounded-full text-sm font-semibold px-3 py-1.5"
                                    style={{ background: color + '33', color: color }}
                                >
                                    {d.name}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="text-sm font-semibold text-slate-700">{d.count}</div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
