// components/ui/date-range-inputs.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';

function formatDisplay(iso?: string | null) {
    if (!iso) return '-';
    try {
        const d = new Date(iso);
        if (isNaN(d.getTime())) return '-';
        return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: '2-digit' });
    } catch {
        return iso;
    }
}

export default function DateRangeInputs({
    start,
    end,
    min,
    max,
    onChange,
}: {
    start?: string | null;
    end?: string | null;
    min?: string | null;
    max?: string | null;
    onChange?: (s: string | null, e: string | null) => void;
}) {
    // local state to keep inputs controlled and avoid flicker when props arrive async
    const [startLocal, setStartLocal] = useState<string | null>(start ?? null);
    const [endLocal, setEndLocal] = useState<string | null>(end ?? null);

    // track whether last update originated from user (so we don't clobber on prop sync)
    const userChangedRef = useRef(false);

    // when parent props change, update local state only if user hasn't just updated (prevents immediate override)
    useEffect(() => {
        if (userChangedRef.current) {
            // give control back to parent; clear flag so future prop updates still sync
            userChangedRef.current = false;
            return;
        }
        setStartLocal(start ?? null);
        setEndLocal(end ?? null);
    }, [start, end]);

    // call parent onChange when user changes local values
    const notify = (s: string | null, e: string | null) => {
        if (onChange) onChange(s, e);
    };

    const onStartChange = (v: string) => {
        userChangedRef.current = true;
        const s = v || null;
        // keep endLocal >= startLocal: if end earlier, move end = start
        let newEnd = endLocal;
        if (s && newEnd && new Date(newEnd) < new Date(s)) {
            newEnd = s;
            setEndLocal(newEnd);
        }
        setStartLocal(s);
        notify(s, newEnd);
    };

    const onEndChange = (v: string) => {
        userChangedRef.current = true;
        const e = v || null;
        // keep startLocal <= endLocal: if start later, move start = end
        let newStart = startLocal;
        if (e && newStart && new Date(newStart) > new Date(e)) {
            newStart = e;
            setStartLocal(newStart);
        }
        setEndLocal(e);
        notify(newStart, e);
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
            <label className="text-sm text-slate-600 mb-2 block">Date range</label>

            <div className="flex gap-3 items-center mb-3">
                <div className="relative flex-1">
                    <input
                        type="date"
                        className="w-full rounded-md border px-3 py-2 pr-10 text-sm bg-white"
                        value={startLocal ?? ''}
                        onChange={(e) => onStartChange(e.target.value)}
                        min={min ?? undefined}
                        max={max ?? undefined}
                        aria-label="Start date"
                    />
                    <div className="absolute right-3 top-2.5 text-slate-400 pointer-events-none">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
                        </svg>
                    </div>
                </div>

                <div className="relative flex-1">
                    <input
                        type="date"
                        className="w-full rounded-md border px-3 py-2 pr-10 text-sm bg-white"
                        value={endLocal ?? ''}
                        onChange={(e) => onEndChange(e.target.value)}
                        min={min ?? undefined}
                        max={max ?? undefined}
                        aria-label="End date"
                    />
                    <div className="absolute right-3 top-2.5 text-slate-400 pointer-events-none">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
                        </svg>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500">
                <div>
                    From: <span className="font-medium text-slate-700">{formatDisplay(startLocal)}</span>
                </div>
                <div className="text-right">
                    To: <span className="font-medium text-slate-700">{formatDisplay(endLocal)}</span>
                </div>
            </div>
        </div>
    );
}
