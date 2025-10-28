'use client';

import * as React from 'react';

export type RadioOption<T extends string = string> = {
    label: string;
    value: T;
    description?: string;
    disabled?: boolean;
};

export interface RadioGroupProps<T extends string = string> {
    name: string;
    value: T | undefined;
    onChange: (val: T) => void;
    options: RadioOption<T>[];
    direction?: 'row' | 'col';
    className?: string;
    size?: 'sm' | 'md';
}

export default function RadioGroup<T extends string = string>({
    name,
    value,
    onChange,
    options,
    direction = 'col',
    className,
    size = 'md',
}: RadioGroupProps<T>) {
    const labelCls = size === 'sm' ? 'text-sm' : 'text-base';
    const padCls = size === 'sm' ? 'py-1.5 px-2.5' : 'py-2 px-3';

    return (
        <div
            role="radiogroup"
            aria-labelledby={`${name}-label`}
            className={[
                direction === 'row' ? 'flex flex-wrap items-center gap-3' : 'space-y-2',
                className,
            ].filter(Boolean).join(' ')}
        >
            {options.map((opt) => {
                const checked = value === opt.value;
                return (
                    <label
                        key={opt.value}
                        className={[
                            'inline-flex items-center rounded-xl border transition',
                            'hover:bg-slate-50 cursor-pointer',
                            padCls,
                            checked
                                ? 'border-sky-400 bg-sky-50 ring-1 ring-sky-200'
                                : 'border-slate-300',
                            opt.disabled ? 'opacity-50 cursor-not-allowed' : '',
                        ].join(' ')}
                    >
                        <input
                            type="radio"
                            name={name}
                            value={opt.value}
                            className="peer sr-only"
                            checked={checked}
                            onChange={() => !opt.disabled && onChange(opt.value)}
                            disabled={opt.disabled}
                        />

                        {/* BULATAN RADIO */}
                        <span
                            className={[
                                'mr-2 inline-block h-4 w-4 rounded-full border transition-colors duration-150',
                                checked
                                    ? 'border-sky-500 bg-sky-500 ring-2 ring-sky-200'
                                    : 'border-slate-400 bg-white',
                            ].join(' ')}
                        />

                        <span className={['font-medium text-slate-800', labelCls].join(' ')}>
                            {opt.label}
                        </span>

                        {opt.description && (
                            <span className="ml-2 text-xs text-slate-500">{opt.description}</span>
                        )}
                    </label>
                );
            })}
        </div>
    );
}
