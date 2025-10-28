'use client';

import * as React from 'react';
import TextField from '@/components/ui/text-field';
import FileUpload from '@/components/ui/file-upload';

export type MaterialDatasheetValue = {
    materialName: string;
    brand: string;
    photo: File | null;
};

export type MaterialDatasheetErrors = Partial<{
    materialName: string;
    brand: string;
    photo: string;
}>;

type Props = {
    value: MaterialDatasheetValue;
    onChange: (patch: Partial<MaterialDatasheetValue>) => void;
    errors?: MaterialDatasheetErrors;
    className?: string;
};

export default function MaterialDatasheetSection({
    value,
    onChange,
    errors,
    className,
}: Props) {
    return (
        <section
            className={['space-y-4 rounded-2xl border bg-white p-5', className]
                .filter(Boolean)
                .join(' ')}
        >
            <header>
                <h2 className="text-lg font-semibold">Detail Material</h2>
            </header>

            <TextField
                label="Nama Material"
                requiredMark
                placeholder="Enter your answer"
                value={value.materialName}
                onChange={(e) => onChange({ materialName: e.target.value })}
                error={errors?.materialName}
            />

            <TextField
                label="Merk"
                requiredMark
                placeholder="Enter your answer"
                value={value.brand}
                onChange={(e) => onChange({ brand: e.target.value })}
                error={errors?.brand}
            />

            <FileUpload
                label="Foto Material"
                requiredMark
                value={value.photo}
                onChange={(file) => onChange({ photo: file })}
                accept="image/*"
                maxSizeMB={10}
                error={errors?.photo}
            />
        </section>
    );
}
