'use client';

import React from 'react';
import { Package, CalendarDays, Clock, X } from 'lucide-react';

type Props = {
    latestDate?: string;
    nearestRequiredBy?: string;
    totalMR: number;
    draftCount: number;
    partiallyOrderedCount: number;

    // interactivity
    selectedStatus?: string | null;
    onSelectStatus?: (status: string | null) => void;

    selectedDepartment?: string | null;
    onSelectDepartment?: (dept: string | null) => void;
};

export default function DashboardSummary({
    latestDate,
    nearestRequiredBy,
    totalMR,
    draftCount,
    partiallyOrderedCount,
    selectedStatus = null,
    onSelectStatus,
    selectedDepartment = null,
    onSelectDepartment,
}: Props) {
    const formatDate = (d?: string) =>
        d
            ? new Date(d).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            })
            : '-';

    const statusButton = (label: string, value: string | null, bg: string, fg: string) => {
        const isSelected = selectedStatus === value;
        return (
            <button
                type="button"
                onClick={() => onSelectStatus?.(isSelected ? null : value)}
                className={[
                    'inline-flex flex-col items-center justify-center rounded-full px-5 py-2 text-sm font-semibold shadow transition',
                    isSelected
                        ? `${bg} ${fg} ring-2 ring-offset-1 ring-opacity-60`
                        : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                ].join(' ')}
                aria-pressed={isSelected}
            >
                <span className="whitespace-nowrap text-sm">{label}</span>
            </button>
        );
    };

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

                <p className="mt-2 text-3xl font-bold text-gray-900 tracking-tight">{formatDate(latestDate)}</p>
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

                <p className="mt-2 text-3xl font-bold text-gray-900 tracking-tight">{formatDate(nearestRequiredBy)}</p>
                <p className="text-xs text-slate-500 mt-1">Tanggal permintaan terdekat</p>
            </div>

            {/* MR Status Summary (clickable) */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-1.5">
                        <Package className="h-4 w-4 text-indigo-600" />
                        Material Request Status
                    </h3>

                    {/* show selected department (if any) with clear action */}
                    <div className="flex items-center gap-2">
                        {selectedDepartment ? (
                            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                                <span className="truncate max-w-[10rem]">{selectedDepartment}</span>
                                <button
                                    type="button"
                                    onClick={() => onSelectDepartment?.(null)}
                                    aria-label="Clear department"
                                    className="rounded-full p-1 hover:bg-slate-200"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ) : (
                            <div className="text-xs text-slate-400">All departments</div>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-start gap-4">
                    <div className="flex flex-col items-center text-center">
                        {statusButton('Total', null, 'bg-slate-800', 'text-white')}
                        <span className="text-base font-bold text-slate-800 mt-1">{totalMR}</span>
                    </div>

                    <div className="flex flex-col items-center text-center">
                        {statusButton('Draft', 'draft', 'bg-sky-600', 'text-white')}
                        <span className="text-base font-bold text-slate-800 mt-1">{draftCount}</span>
                    </div>

                    <div className="flex flex-col items-center text-center">
                        {statusButton('Partially Ordered', 'partially ordered', 'bg-amber-500', 'text-white')}
                        <span className="text-base font-bold text-slate-800 mt-1">{partiallyOrderedCount}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
