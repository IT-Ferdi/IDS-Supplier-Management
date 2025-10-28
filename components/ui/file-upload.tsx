// components/ui/file-upload.tsx
'use client';

import * as React from 'react';

type Props = {
    label?: string;
    requiredMark?: boolean;
    value: File | null;
    onChange: (f: File | null) => void;
    accept?: string;       // default: 'image/*,application/pdf'
    maxSizeMB?: number;    // default: 10
    hint?: string;
    error?: string;
    id?: string;
    disabled?: boolean;
    className?: string;
};

export default function FileUpload({
    label,
    requiredMark,
    onChange,
    accept = 'image/*,application/pdf',
    maxSizeMB = 10,
    hint,
    error,
    id,
    disabled,
    className,
}: Props) {
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const [dragActive, setDragActive] = React.useState(false);
    const [localError, setLocalError] = React.useState<string | null>(null);

    const mergedError = localError || error;

    const validateAndSet = (file: File | null) => {
        setLocalError(null);
        if (!file) {
            onChange(null);
            return;
        }

        const maxBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxBytes) {
            setLocalError(`Ukuran file melebihi ${maxSizeMB} MB`);
            return;
        }

        if (accept && accept !== '*') {
            const acceptList = accept.split(',').map((s) => s.trim());
            const ok = acceptList.some((a) => {
                if (!a) return true;
                if (a.endsWith('/*')) {
                    const major = a.split('/')[0];
                    return file.type.startsWith(`${major}/`);
                }
                return file.type === a || file.name.toLowerCase().endsWith(a.toLowerCase());
            });
            if (!ok) {
                setLocalError('Tipe file tidak diperbolehkan');
                return;
            }
        }
        onChange(file);
    };

    const handleBrowse = () => inputRef.current?.click();

    const onDragEnter = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (disabled) return;
        setDragActive(true);
    };
    const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); };
    const onDrop = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation(); setDragActive(false);
        if (disabled) return;
        const f = e.dataTransfer.files?.[0] ?? null;
        validateAndSet(f);
    };

    return (
        <div className={['space-y-2', className].filter(Boolean).join(' ')}>
            {label && (
                <label htmlFor={id} className="block text-sm font-medium text-slate-800">
                    {label} {requiredMark && <span className="text-rose-500">*</span>}
                </label>
            )}

            <div
                role="button"
                tabIndex={0}
                onClick={handleBrowse}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();            // cegah scroll saat tekan spasi
                        handleBrowse();
                    }
                }}
                onDragEnter={onDragEnter}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={[
                    'group relative rounded-2xl border-2 border-dashed px-4 py-6 transition',
                    disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
                    dragActive
                        ? 'border-sky-400 bg-sky-50/60'
                        : mergedError
                            ? 'border-rose-300 bg-rose-50/40'
                            : 'border-slate-300 hover:border-sky-300 hover:bg-slate-50',
                ].join(' ')}
                aria-disabled={disabled}
                aria-describedby={
                    mergedError
                        ? (id ? `${id}-error` : undefined)
                        : (hint && id ? `${id}-hint` : undefined)
                }
            />

            {hint && !mergedError && (
                <p id={id ? `${id}-hint` : undefined} className="text-xs text-slate-500">
                    {hint}
                </p>
            )}

            {mergedError && (
                <p
                    id={id ? `${id}-error` : undefined}
                    className="text-xs text-rose-600"
                    aria-live="polite"
                >
                    {mergedError}
                </p>
            )}
        </div>
    );
}
