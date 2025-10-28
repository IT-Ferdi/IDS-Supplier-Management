'use client';

import * as React from 'react';

export type Option = {
  // TERBARU: hindari any → pakai unknown
  label: unknown;
  value: string;
  disabled?: boolean;
};

export interface SelectFieldProps {
  label?: string;
  requiredMark?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  options: Option[];
  error?: string;
  className?: string;
  selectClassName?: string;
  disabled?: boolean;
}

// helper kecil untuk “menyulap” tipe bebas menjadi string yang aman
function pickLabel(raw: unknown): string {
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'number' || typeof raw === 'boolean') return String(raw);
  if (raw && typeof raw === 'object') {
    const rec = raw as Record<string, unknown>;
    if (typeof rec.description === 'string') return rec.description;
    if (typeof rec.value === 'string' || typeof rec.value === 'number' || typeof rec.value === 'boolean') {
      return String(rec.value);
    }
  }
  return '';
}

export default function SelectField({
  label,
  requiredMark,
  value,
  onChange,
  placeholder = 'Select…',
  options,
  error,
  className,
  selectClassName,
  disabled = false,
}: SelectFieldProps) {
  // Sanitize options: pastikan value string & label string
  const safeOptions = React.useMemo(() => {
    return (Array.isArray(options) ? options : [])
      .filter((opt): opt is Option => !!opt && typeof opt.value === 'string')
      .map((opt) => ({
        ...opt,
        label: pickLabel(opt.label),
      }));
  }, [options]);

  const hasValue = safeOptions.some((o) => o.value === value);
  const controlledValue = hasValue ? value : '';

  return (
    <div className={className}>
      {label && (
        <label className="mb-1 block text-sm font-medium text-slate-700">
          {label} {requiredMark && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          value={controlledValue}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={[
            'w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition',
            'border-slate-300 focus:ring-2 focus:ring-sky-300',
            disabled ? 'opacity-60 cursor-not-allowed' : '',
            selectClassName,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {/* Placeholder */}
          <option value="" disabled hidden>
            {placeholder}
          </option>

          {safeOptions.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label as string}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
