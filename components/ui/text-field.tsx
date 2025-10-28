'use client';

import * as React from 'react';

export type TextFieldProps = {
    label?: string;
    requiredMark?: boolean;
    hint?: string;
    error?: string;
    className?: string;
    inputClassName?: string;

    // nilai biasa
    value: string;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
    placeholder?: string;
    type?: React.InputHTMLAttributes<HTMLInputElement>['type'];

    // ➕ tambahkan ini
    inputMode?: React.InputHTMLAttributes<HTMLInputElement>['inputMode'];
    autoComplete?: React.InputHTMLAttributes<HTMLInputElement>['autoComplete'];

    disabled?: boolean;
    name?: string;
    id?: string;
};

export default function TextField({
    label,
    requiredMark,
    hint,
    error,
    className,
    inputClassName,
    value,
    onChange,
    placeholder,
    type = 'text',
    // ➕ ambil props baru di sini
    inputMode,
    autoComplete,
    disabled,
    name,
    id,
}: TextFieldProps) {
    const autoId = React.useId();
    const inputId = id ?? name ?? autoId;

    return (
        <div className={['w-full', className].filter(Boolean).join(' ')}>
            {label && (
                <label
                    htmlFor={inputId}
                    className="mb-1 block text-sm font-medium text-slate-700"
                >
                    {label} {requiredMark && <span className="text-rose-500">*</span>}
                </label>
            )}

            <input
                id={inputId}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                // ➕ teruskan ke elemen input
                inputMode={inputMode}
                autoComplete={autoComplete}
                className={[
                    'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none',
                    'transition focus:ring-2 focus:ring-sky-300',
                    error ? 'border-rose-300 focus:ring-rose-200' : '',
                    disabled ? 'opacity-60 cursor-not-allowed' : '',
                    inputClassName,
                ]
                    .filter(Boolean)
                    .join(' ')}
            />

            {hint && !error && (
                <p className="mt-1 text-xs text-slate-500">{hint}</p>
            )}
            {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
        </div>
    );
}
