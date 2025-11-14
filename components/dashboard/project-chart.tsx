// components/dashboard/project-chart.tsx
'use client';

import React, { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useMaterialRequestData } from '@/hooks/useMaterialRequestData';
import type { MaterialRequest } from '@/types/material-request';

type Props = {
    statuses?: string[]; // optional filter by MR.status (gunakan lowercase)
    startDate?: string | null;
    endDate?: string | null;
    topN?: number; // gabungkan sisa jadi "Other"
    height?: number;
};

const DEFAULT_COLORS = [
    '#2f80ed', '#17bf6b', '#9b51e0', '#f2c94c', '#ff7a7a',
    '#56ccf2', '#f2994a', '#bb6bd9', '#6fcf97', '#d0a9ff',
];

export default function ProjectPie({
    statuses,
    startDate = null,
    endDate = null,
    topN = 8,
    height = 220,
}: Props) {
    const { data: mrs = [], isLoading, error } = useMaterialRequestData();

    const data = useMemo(() => {
        if (!Array.isArray(mrs)) return [];

        const okStatus = (s?: string) =>
            !statuses || statuses.length === 0 ? true : !!s && statuses.includes(s.toLowerCase());

        const inRange = (d?: string) => {
            if (!d) return false;
            const t = new Date(d).getTime();
            if (startDate) {
                const s = new Date(startDate).getTime();
                if (t < s) return false;
            }
            if (endDate) {
                const e = new Date(endDate).getTime();
                if (t > e) return false;
            }
            return true;
        };

        // hitung per project. Project ada di tiap item.
        const map = new Map<string, number>();

        (mrs as MaterialRequest[]).forEach((mr) => {
            const st = (mr.status ?? '').toLowerCase();
            if (!okStatus(st)) return;

            if ((startDate || endDate) && !inRange(mr.transaction_date)) return;

            (mr.items ?? []).forEach((it: any) => {
                const proj = (it.project ?? '').toString().trim();
                if (!proj) return;
                map.set(proj, (map.get(proj) ?? 0) + 1);
            });
        });

        let arr = Array.from(map.entries()).map(([name, count]) => ({ name, count }));
        arr.sort((a, b) => b.count - a.count);

        if (topN > 0 && arr.length > topN) {
            const top = arr.slice(0, topN);
            const rest = arr.slice(topN);
            const other = rest.reduce((s, r) => s + r.count, 0);
            top.push({ name: 'Other', count: other });
            arr = top;
        }

        const total = arr.reduce((s, r) => s + r.count, 0);
        return arr.map((r, i) => ({
            name: r.name,
            value: r.count,
            percent: total > 0 ? Math.round((r.count / total) * 100) : 0,
            color: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
        }));
    }, [mrs, statuses, startDate, endDate, topN]);

    if (isLoading) return <div className="rounded-xl border border-slate-200 bg-white p-4">Loading chart…</div>;
    if (error) return <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">Gagal memuat data chart</div>;
    if (!data.length) return <div className="rounded-xl border border-slate-200 bg-white p-4">Tidak ada data project.</div>;

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 h-[220px] flex items-center">
            <div className="flex flex-col md:flex-row items-stretch gap-4 w-full">
                {/* Chart */}
                <div className="flex-shrink-0 w-full md:w-1/2 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                innerRadius="30%"
                                outerRadius="85%"
                                dataKey="value"
                                cx="50%"
                                cy="50%"
                            >
                                {data.map((entry, idx) => (
                                    <Cell key={`c-${idx}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(val: any) => `${val} MR`} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="flex-1 overflow-y-auto">
                    <h3 className="text-base font-semibold mb-2">Projects</h3>
                    <div className="space-y-1.5">
                        {data.map((d) => (
                            <div
                                key={d.name}
                                className="flex items-center justify-between gap-3 text-sm"
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <span
                                        className="inline-block rounded-full shrink-0"
                                        style={{
                                            width: 10,
                                            height: 10,
                                            background: d.color,
                                        }}
                                    />
                                    <span className="truncate font-semibold text-base md:text-lg">{d.name}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
