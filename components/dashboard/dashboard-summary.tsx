'use client';

import React from 'react';
import { Package, CalendarDays, Clock, X, RefreshCw } from 'lucide-react';
import DateRangeInputs from '@/components/ui/date-range-inputs';

type Props = {
    // MR transaction_date range (controlled by parent)
    mrStart?: string | null;
    mrEnd?: string | null;
    onMrChange?: (s: string | null, e: string | null) => void;

    // Required-by range
    reqStart?: string | null;
    reqEnd?: string | null;
    onReqChange?: (s: string | null, e: string | null) => void;

    latestDate?: string;
    nearestRequiredBy?: string;
    totalMR: number;
    draftCount: number;
    pendingCount: number;
    partiallyOrderedCount: number;

    // interactivity
    selectedStatus?: string | null;
    onSelectStatus?: (status: string | null) => void;

    selectedDepartment?: string | null;
    onSelectDepartment?: (dept: string | null) => void;

    // refresh handler
    onRefresh?: () => void;
};

export default function DashboardSummary({
    mrStart,
    mrEnd,
    onMrChange,
    reqStart,
    reqEnd,
    onReqChange,
    latestDate,
    nearestRequiredBy,
    totalMR,
    draftCount,
    partiallyOrderedCount,
    pendingCount,
    selectedStatus = null,
    onSelectStatus,
    selectedDepartment = null,
    onSelectDepartment,
    onRefresh,
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
                    'inline-flex flex-col items-center justify-center rounded-full px-4 py-1.5 text-sm font-semibold shadow-sm transition',
                    isSelected ? `${bg} ${fg} ring-2 ring-offset-1` : 'bg-slate-100 text-slate-800 hover:bg-slate-200',
                ].join(' ')}
                aria-pressed={isSelected}
            >
                <span className="whitespace-nowrap">{label}</span>
            </button>
        );
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* MR Date Range (uses DateRangeInputs) */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-1.5">
                        <CalendarDays className="h-4 w-4 text-sky-600" />
                        MR Date Range
                    </h3>
                </div>

                <div className="mt-3">
                    <DateRangeInputs
                        start={mrStart}
                        end={mrEnd}
                        onChange={(s, e) => onMrChange?.(s, e)}
                    />
                    <div className="mt-2 font-semibold text-xs text-slate-700">
                        Range tanggal Transaction Material Request.
                    </div>
                </div>
            </div>

            {/* Required-by Range */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-amber-600" />
                        Required-by Range
                    </h3>
                </div>

                <div className="mt-3">
                    <DateRangeInputs
                        start={reqStart}
                        end={reqEnd}
                        onChange={(s, e) => onReqChange?.(s, e)}
                    />
                    <div className="mt-2 font-semibold text-xs text-slate-700">
                        Range tanggal Required By Material Request
                    </div>
                </div>
            </div>

            {/* MR Status Summary (clickable) */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-1.5">
                        <Package className="h-4 w-4 text-indigo-600" />
                        Material Request Status
                    </h3>

                    <div className="flex items-center gap-2">
                        {onRefresh ? (
                            <button
                                type="button"
                                onClick={onRefresh}
                                title="Reset semua filter dan refresh"
                                className="inline-flex items-center gap-2 rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Refresh
                            </button>
                        ) : null}
                    </div>
                </div>

                <div className="flex items-center justify-end mb-2">
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

                    <div className="flex flex-col items-center text-center">
                        {statusButton('Pending', 'pending', 'bg-red-500', 'text-white')}
                        <span className="text-base font-bold text-slate-800 mt-1">{pendingCount}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
