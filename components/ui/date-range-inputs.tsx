'use client';

import React, { useEffect, useRef, useState } from 'react';

function formatDisplay(d?: string | null) {
    if (!d) return '-';
    try {
        const dt = new Date(d);
        if (isNaN(dt.getTime())) return '-';
        return dt.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return d;
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
    const [startLocal, setStartLocal] = useState<string | null>(start ?? null);
    const [endLocal, setEndLocal] = useState<string | null>(end ?? null);
    const userChanged = useRef(false);

    // keep sync with parent
    useEffect(() => {
        if (userChanged.current) {
            userChanged.current = false;
            return;
        }
        setStartLocal(start ?? null);
        setEndLocal(end ?? null);
    }, [start, end]);

    const notify = (s: string | null, e: string | null) => {
        onChange?.(s, e);
    };

    const onStartChange = (v: string) => {
        userChanged.current = true;
        const s = v || null;
        let e = endLocal;

        if (s && e && new Date(e) < new Date(s)) {
            e = s;
            setEndLocal(e);
        }
        setStartLocal(s);
        notify(s, e);
    };

    const onEndChange = (v: string) => {
        userChanged.current = true;
        const e = v || null;
        let s = startLocal;

        if (e && s && new Date(s) > new Date(e)) {
            s = e;
            setStartLocal(s);
        }
        setEndLocal(e);
        notify(s, e);
    };

    const inputCls =
        'w-full rounded-md border px-3 py-1.5 text-sm bg-white';

    return (
        <div className="space-y-1">
            {/* Row of inputs */}
            <div className="flex items-center gap-2">
                <input
                    type="date"
                    className={inputCls}
                    value={startLocal ?? ''}
                    onChange={(e) => onStartChange(e.target.value)}
                    min={min ?? undefined}
                    max={max ?? undefined}
                />

                <input
                    type="date"
                    className={inputCls}
                    value={endLocal ?? ''}
                    onChange={(e) => onEndChange(e.target.value)}
                    min={min ?? undefined}
                    max={max ?? undefined}
                />
            </div>

            {/* From–To text */}
            <div className="flex justify-between text-xs text-slate-500">
                <span>
                    From:{' '}
                    <span className="font-medium text-slate-700">
                        {formatDisplay(startLocal)}
                    </span>
                </span>

                <span>
                    To:{' '}
                    <span className="font-medium text-slate-700">
                        {formatDisplay(endLocal)}
                    </span>
                </span>
            </div>
        </div>
    );
}
