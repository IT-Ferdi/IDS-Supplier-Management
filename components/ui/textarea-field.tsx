'use client';

import * as React from 'react';

export interface TextareaFieldProps
    extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'children'> {
    label?: string;
    requiredMark?: boolean;
    hint?: string;
    error?: string;
    containerClassName?: string;
    textareaClassName?: string;
}

export default function TextareaField({
    label,
    requiredMark,
    hint,
    error,
    className,
    containerClassName,
    textareaClassName,
    ...props
}: TextareaFieldProps) {
    return (
        <div className={['space-y-1', containerClassName].filter(Boolean).join(' ')}>
            {label && (
                <label className="block text-sm font-medium text-slate-700">
                    {label} {requiredMark && <span className="text-rose-500">*</span>}
                </label>
            )}

            <textarea
                {...props}
                className={[
                    // base
                    'w-full rounded-xl border bg-white px-3 py-2 text-sm leading-6 outline-none transition',
                    // state
                    error
                        ? 'border-rose-300 ring-2 ring-rose-200'
                        : 'border-slate-300 focus:ring-2 focus:ring-sky-300',
                    'placeholder:text-slate-400',
                    'min-h-[104px]',
                    textareaClassName,
                    className,
                ]
                    .filter(Boolean)
                    .join(' ')}
            />

            {hint && <p className="text-xs text-slate-500">{hint}</p>}
            {error && <p className="text-xs text-rose-600">{error}</p>}
        </div>
    );
}
