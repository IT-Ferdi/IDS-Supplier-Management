// components/dashboard/department-chart.tsx
'use client';

import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

type InputDatum = { name: string; value: number };
type ChartDatum = { name: string; count: number; color: string; percent: number };

const DEFAULT_COLORS = [
    '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#f97316', '#ec4899',
    '#60a5fa', '#34d399', '#a78bfa', '#fbbf24'
];

export default function DepartmentChart({
    data,
    selectedStatus = null, // optional; dapat dipakai untuk info/label UI
    selectedDept = null,
    onDeptClick,
    title = 'Departments',
    height = 220,
}: {
    data: InputDatum[]; // [{ name, value }]
    selectedStatus?: string | null;
    selectedDept?: string | null;
    onDeptClick?: (deptName: string) => void;
    title?: string;
    height?: number;
}) {
    const total = useMemo(() => data.reduce((s, d) => s + (d.value || 0), 0), [data]);

    const chartData: ChartDatum[] = useMemo(() => {
        if (!Array.isArray(data)) return [];
        // sort descending, take top N if mau (tidak membatasi di sini)
        const arr = data
            .map((d, i) => ({
                name: d.name || 'Unassigned',
                count: Number(d.value || 0),
            }))
            .sort((a, b) => b.count - a.count);

        return arr.map((d, i) => ({
            name: d.name,
            count: d.count,
            color: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
            percent: total > 0 ? Math.round((d.count / total) * 100) : 0,
        }));
    }, [data, total]);

    if (!chartData || chartData.length === 0) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                No data available.
            </div>
        );
    }

    const handleClick = (payload: any) => {
        const name = payload?.name;
        if (!name) return;
        onDeptClick?.(name);
    };

    return (
        <div
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            style={{ height: typeof height === 'number' ? `${height}px` : height ?? '320px' }}
        >
            <div className="flex items-start gap-4 h-full">
                {/* LEFT: Pie (lebih besar dan responsive) */}
                <div
                    className="flex items-center justify-center"
                    style={{ width: '48%', height: '100%', minHeight: 240 }}
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                dataKey="count"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius="55%"
                                outerRadius="90%"
                                onClick={(d) => handleClick(d)}
                            >
                                {chartData.map((entry, idx) => {
                                    const faded = selectedDept && selectedDept !== entry.name;
                                    const opacity = faded ? 0.32 : 1;
                                    return (
                                        <Cell
                                            key={`cell-${idx}`}
                                            fill={entry.color}
                                            stroke={entry.color}
                                            strokeWidth={selectedDept === entry.name ? 2 : 0}
                                            style={{ opacity }}
                                        />
                                    );
                                })}
                            </Pie>
                            <Tooltip formatter={(val: any, name: any, props: any) => [`${val} MR`, props.payload.name]} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* RIGHT: Legend / list */}
                <div className="flex-1 overflow-y-auto h-full">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold mb-2 text-slate-700">{title}</h3>
                        {selectedStatus ? (
                            <div className="text-xs text-slate-500">
                                Status: <span className="font-medium ml-1">{selectedStatus}</span>
                            </div>
                        ) : null}
                    </div>

                    <div className="space-y-2">
                        {chartData.map((d) => {
                            const isSelected = selectedDept === d.name;
                            const faded = selectedDept && !isSelected;
                            return (
                                <button
                                    key={d.name}
                                    onClick={() => onDeptClick?.(d.name)}
                                    className="w-full text-left flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-slate-50 transition"
                                    style={{ opacity: faded ? 0.6 : 1 }}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span
                                            className="shrink-0 inline-block rounded-full"
                                            style={{ width: 12, height: 12, background: d.color }}
                                        />
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium truncate text-slate-800">{d.name}</div>
                                            <div className="text-xs text-slate-500">{d.count} MR</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="text-sm font-semibold text-slate-700">{d.percent}%</div>
                                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div style={{ width: `${d.percent}%`, background: d.color, height: '100%' }} />
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );

}
