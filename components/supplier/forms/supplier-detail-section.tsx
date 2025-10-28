'use client';

import * as React from 'react';
import TextField from '@/components/ui/text-field';
import RadioGroup, { RadioOption } from '@/components/ui/radio-group';
import SelectField from '@/components/ui/select-field';
import { INDUSTRY_OPTIONS } from '@/components/supplier/constants';

export type CompanyType = 'PT' | 'CV' | 'PERSONAL';

export interface SupplierDetailValue {
    companyName: string;
    companyType: CompanyType | undefined;
    industry: string;             // required
    groupAffiliation?: string;
}

export interface SupplierDetailSectionProps {
    value: SupplierDetailValue;
    onChange: (patch: Partial<SupplierDetailValue>) => void;
    errors?: Partial<Record<keyof SupplierDetailValue, string>>;
    className?: string;
}

const COMPANY_TYPE_OPTIONS: RadioOption<CompanyType>[] = [
    { label: 'PT', value: 'PT' },
    { label: 'CV', value: 'CV' },
    { label: 'Perorangan', value: 'PERSONAL' },
];

export default function SupplierDetailSection({
    value,
    onChange,
    errors,
    className,
}: SupplierDetailSectionProps) {
    const sectionId = 'supplier-detail';

    return (
        <section
            aria-labelledby={`${sectionId}-title`}
            className={['space-y-4 rounded-2xl border bg-white p-5', className]
                .filter(Boolean)
                .join(' ')}
        >
            <header>
                <h2 id={`${sectionId}-title`} className="text-lg font-semibold">
                    Detail Perusahaan
                </h2>
                <p className="text-sm text-slate-500">Isikan informasi utama perusahaan.</p>
            </header>

            {/* 1) Nama Perusahaan (required) */}
            <TextField
                label="Nama Perusahaan"
                requiredMark
                placeholder="Contoh: PT Contoh Abadi"
                value={value.companyName}
                onChange={(e) => onChange({ companyName: e.target.value })}
                error={errors?.companyName}
            />

            {/* 2) Jenis Perusahaan (required) */}
            <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                    Jenis Perusahaan <span className="text-rose-500">*</span>
                </label>
                <RadioGroup<CompanyType>
                    name="companyType"
                    value={value.companyType}
                    onChange={(val) => onChange({ companyType: val })}
                    options={COMPANY_TYPE_OPTIONS}
                    direction="row"
                    size="md"
                />
                {errors?.companyType && (
                    <p className="mt-1 text-xs text-rose-600">{errors.companyType}</p>
                )}
            </div>

            {/* 3) Bidang Industri (required) */}
            <SelectField
                label="Bidang Industri Perusahaan"
                requiredMark
                placeholder="Pilih Bidang Industri Perusahaan"
                value={value.industry ?? ''}                   // fallback aman
                onChange={(v) => onChange({ industry: v })}
                options={INDUSTRY_OPTIONS}
                selectClassName="pl-3 pr-8"
                error={errors?.industry}
            />

            {/* 4) Afiliasi Group Perusahaan (opsional) */}
            <TextField
                label="Afiliasi Group Perusahaan"
                placeholder="Contoh: Group Intidaya"
                value={value.groupAffiliation ?? ''}
                onChange={(e) => onChange({ groupAffiliation: e.target.value })}
                hint="Boleh dikosongkan bila tidak ada."
                error={errors?.groupAffiliation}
            />
        </section>
    );
}
