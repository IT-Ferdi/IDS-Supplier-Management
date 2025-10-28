'use client';

import * as React from 'react';
import TextareaField from '@/components/ui/textarea-field';

export interface MaterialUsageValue {
    usageNote: string; // deskripsi penggunaan material (required)
}

export interface MaterialUsageSectionProps {
    value: MaterialUsageValue;
    onChange: (patch: Partial<MaterialUsageValue>) => void;
    errors?: Partial<Record<keyof MaterialUsageValue, string>>;
    className?: string;
    maxLength?: number; // optional: batasi panjang teks (mis. 1000)
}

export default function MaterialUsageSection({
    value,
    onChange,
    errors,
    className,
    maxLength = 1000,
}: MaterialUsageSectionProps) {
    const [count, setCount] = React.useState(value.usageNote?.length ?? 0);

    return (
        <section
            className={['space-y-4 rounded-2xl border bg-white p-5', className]
                .filter(Boolean)
                .join(' ')}
        >
            <header>
                <h2 className="text-lg font-semibold">Penggunaan Material</h2>
            </header>

            <TextareaField
                label="Penggunaan Material"
                requiredMark
                placeholder="Catatan secara deskriptif tentang penggunaan item dan tujuan utama item"
                value={value.usageNote}
                onChange={(e) => {
                    setCount(e.target.value.length);
                    onChange({ usageNote: e.target.value });
                }}
                maxLength={maxLength}
                hint={`Maks ${maxLength} karakter • ${count}/${maxLength}`}
                error={errors?.usageNote}
            />
        </section>
    );
}
