'use client';

import * as React from 'react';
import FileUpload from '@/components/ui/file-upload';

export type SupplierAttachmentsValue = {
    npwp: File | null;
    ktp: File | null;
    nib: File | null;
    companyProfile: File | null;
    catalogue: File | null;
    agencyLetter: File | null; // Surat Keagenan
};

export type SupplierAttachmentsErrors = Partial<{
    npwp: string;
    ktp: string;
    nib: string;
    companyProfile: string;
    catalogue: string;
    agencyLetter: string;
}>;

export const EMPTY_ATTACHMENTS: SupplierAttachmentsValue = {
    npwp: null,
    ktp: null,
    nib: null,
    companyProfile: null,
    catalogue: null,
    agencyLetter: null,
};

type Props = {
    value: SupplierAttachmentsValue;
    onChange: (patch: Partial<SupplierAttachmentsValue>) => void;
    errors?: SupplierAttachmentsErrors;
    className?: string;
    /** Default: 'image/*,application/pdf' */
    accept?: string;
    /** Default: 10 (MB) */
    maxSizeMB?: number;
};

export default function AttachmentsSection({
    value,
    onChange,
    errors,
    className,
    accept = 'image/*,application/pdf',
    maxSizeMB = 10,
}: Props) {
    return (
        <section
            className={['space-y-4 rounded-2xl border bg-white p-5', className]
                .filter(Boolean)
                .join(' ')}
        >
            <header>
                <h2 className="text-lg font-semibold">Lampiran</h2>
            </header>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FileUpload
                    label="Lampiran NPWP"
                    requiredMark
                    value={value.npwp}
                    onChange={(f) => onChange({ npwp: f })}
                    accept={accept}
                    maxSizeMB={maxSizeMB}
                    hint="Lampirkan file/gambar (PDF/JPG/PNG)"
                    error={errors?.npwp}
                />

                <FileUpload
                    label="Lampiran Company Profile"
                    requiredMark
                    value={value.companyProfile}
                    onChange={(f) => onChange({ companyProfile: f })}
                    accept={accept}
                    maxSizeMB={maxSizeMB}
                    hint="Lampirkan file/gambar (PDF/JPG/PNG)"
                    error={errors?.companyProfile}
                />

                <FileUpload
                    label="Lampiran KTP"
                    requiredMark
                    value={value.ktp}
                    onChange={(f) => onChange({ ktp: f })}
                    accept={accept}
                    maxSizeMB={maxSizeMB}
                    hint="Lampirkan file/gambar (PDF/JPG/PNG)"
                    error={errors?.ktp}
                />

                <FileUpload
                    label="Lampiran Catalogue Product"
                    requiredMark
                    value={value.catalogue}
                    onChange={(f) => onChange({ catalogue: f })}
                    accept={accept}
                    maxSizeMB={maxSizeMB}
                    hint="Lampirkan file/gambar (PDF/JPG/PNG)"
                    error={errors?.catalogue}
                />

                <FileUpload
                    label="Lampiran NIB"
                    requiredMark
                    value={value.nib}
                    onChange={(f) => onChange({ nib: f })}
                    accept={accept}
                    maxSizeMB={maxSizeMB}
                    hint="Lampirkan file/gambar (PDF/JPG/PNG)"
                    error={errors?.nib}
                />

                <FileUpload
                    label="Lampiran Surat Keagenan"
                    requiredMark
                    value={value.agencyLetter}
                    onChange={(f) => onChange({ agencyLetter: f })}
                    accept={accept}
                    maxSizeMB={maxSizeMB}
                    hint="Lampirkan file/gambar (PDF/JPG/PNG)"
                    error={errors?.agencyLetter}
                />
            </div>
        </section>
    );
}
