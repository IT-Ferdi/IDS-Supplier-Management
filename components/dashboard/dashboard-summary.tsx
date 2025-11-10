'use client';

import React from 'react';
import { Package, CalendarDays, Clock } from 'lucide-react';

type Props = {
    latestDate?: string;
    nearestRequiredBy?: string;
    totalMR: number;
    draftCount: number;
    partiallyOrderedCount: number;
};

export default function DashboardSummary({
    latestDate,
    nearestRequiredBy,
    totalMR,
    draftCount,
    partiallyOrderedCount,
}: Props) {
    const formatDate = (d?: string) =>
        d
            ? new Date(d).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            })
            : '-';

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Latest MR Date */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-1.5">
                        <CalendarDays className="h-4 w-4 text-sky-600" />
                        Latest MR Date
                    </h3>
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-900 tracking-tight">
                    {formatDate(latestDate)}
                </p>
                <p className="text-xs text-slate-500 mt-1">Tanggal pembuatan MR terbaru</p>
            </div>

            {/* Nearest Required By */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-amber-600" />
                        Nearest Required By
                    </h3>
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-900 tracking-tight">
                    {formatDate(nearestRequiredBy)}
                </p>
                <p className="text-xs text-slate-500 mt-1">Tanggal permintaan terdekat</p>
            </div>

            {/* MR Status Summary */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-1.5">
                    <Package className="h-4 w-4 text-indigo-600" />
                    Material Request Status
                </h3>

                <div className="flex flex-wrap items-start gap-4">
                    {/* Total */}
                    <div className="flex flex-col items-center text-center">
                        <span className="rounded-full bg-slate-100 text-slate-800 text-sm font-semibold px-4 py-1.5 shadow-sm">
                            Total
                        </span>
                        <span className="text-base font-bold text-slate-800 mt-1">
                            {totalMR}
                        </span>
                    </div>

                    {/* Draft */}
                    <div className="flex flex-col items-center text-center">
                        <span className="rounded-full bg-sky-100 text-sky-800 text-sm font-semibold px-4 py-1.5 shadow-sm">
                            Draft
                        </span>
                        <span className="text-base font-bold text-slate-800 mt-1">
                            {draftCount}
                        </span>
                    </div>

                    {/* Partially Ordered */}
                    <div className="flex flex-col items-center text-center">
                        <span className="rounded-full bg-amber-100 text-amber-800 text-sm font-semibold px-4 py-1.5 shadow-sm">
                            Partially Ordered
                        </span>
                        <span className="text-base font-bold text-slate-800 mt-1">
                            {partiallyOrderedCount}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
