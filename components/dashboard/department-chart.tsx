'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

type ChartData = {
    name: string;
    count: number;
    color: string;
    percent: number;
}[];

export default function DepartmentChart({
    chartData,
    height = 160,
}: {
    chartData: ChartData;
    height?: number;
}) {
    if (!chartData || chartData.length === 0) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                No data available.
            </div>
        );
    }

    return (
        <div
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            style={{ height }}
        >
            <div className="flex flex-col md:flex-row items-stretch gap-4 h-full">
                {/* Chart bagian kiri */}
                <div className="flex-shrink-0 w-full md:w-1/2 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                dataKey="count"
                                innerRadius="55%"     // lebih tebal
                                outerRadius="85%"
                                strokeWidth={4}
                                cx="50%"
                                cy="50%"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(val: any, name: any, props: any) => [`${val} MR`, props.payload.name]}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Legend bagian kanan */}
                <div className="flex-1 overflow-y-auto">
                    <h3 className="text-sm font-semibold mb-3 text-slate-700">Departments</h3>
                    <div className="space-y-2">
                        {chartData.map((d) => (
                            <div key={d.name} className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span
                                        className="shrink-0 inline-block rounded-full"
                                        style={{ width: 10, height: 10, background: d.color }}
                                    />
                                    <span className="truncate text-sm font-medium text-slate-700">
                                        {d.name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-slate-600">
                                        {d.percent}%
                                    </span>
                                    <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            style={{
                                                width: `${d.percent}%`,
                                                background: d.color,
                                                height: '100%',
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
