'use client';

import * as React from 'react';
import TextField from '@/components/ui/text-field';
import SelectField, { type Option } from '@/components/ui/select-field';

export type TaxIdType = 'NPWP' | 'NIK';

export interface TaxInfoValue {
    /** pilih salah satu identitas pajak yang akan diisi */
    taxIdType: TaxIdType;
    /** isi jika taxIdType = 'NPWP' */
    npwp: string;
    /** isi jika taxIdType = 'NIK' */
    nik: string;

    /** nama wajib pajak yang terdaftar (di NPWP/NIK) */
    registeredName: string;
    /** alamat sesuai KTP/NPWP */
    registeredAddress: string;

    /** perusahaan kena kewajiban pajak? */
    hasCorporateTax: 'YES' | 'NO';

    /** nomor rekening untuk pembayaran */
    bankAccountNo: string;
}

export type TaxInfoErrors = Partial<{
    taxIdType: string;
    npwp: string;
    nik: string;
    registeredName: string;
    registeredAddress: string;
    hasCorporateTax: string;
    bankAccountNo: string;
}>;

export interface TaxInfoSectionProps {
    value: TaxInfoValue;
    onChange: (patch: Partial<TaxInfoValue>) => void;
    errors?: TaxInfoErrors;
    className?: string;
}

const TAX_ID_TYPE_OPTIONS: Option[] = [
    { label: 'NPWP', value: 'NPWP' },
    { label: 'NIK (KTP)', value: 'NIK' },
];

const YES_NO_OPTIONS: Option[] = [
    { label: 'Ya', value: 'YES' },
    { label: 'Tidak', value: 'NO' },
];

/** nilai awal yang bisa kamu pakai di parent */
export const EMPTY_TAX: TaxInfoValue = {
    taxIdType: 'NPWP',
    npwp: '',
    nik: '',
    registeredName: '',
    registeredAddress: '',
    hasCorporateTax: 'YES',
    bankAccountNo: '',
};

export default function TaxInfoSection({
    value,
    onChange,
    errors,
    className,
}: TaxInfoSectionProps) {
    const handleTaxTypeChange = (v: string) => {
        const type = (v as TaxIdType) || 'NPWP';
        // ketika ganti jenis identitas, kosongkan field lawannya
        onChange({
            taxIdType: type,
            npwp: type === 'NPWP' ? value.npwp : '',
            nik: type === 'NIK' ? value.nik : '',
        });
    };

    const taxNumberLabel = value.taxIdType === 'NPWP' ? 'Nomor NPWP' : 'Nomor NIK';
    const taxNumberHint =
        value.taxIdType === 'NPWP'
            ? 'Masukkan 15 digit NPWP.'
            : 'Masukkan 16 digit NIK sesuai KTP.';

    return (
        <section
            className={['space-y-4 rounded-2xl border bg-white p-5', className]
                .filter(Boolean)
                .join(' ')}
        >
            <header>
                <h2 className="text-lg font-semibold">Informasi Pajak</h2>
            </header>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Kiri */}
                <div className="space-y-3">
                    <SelectField
                        label="Jenis Identitas Pajak"
                        requiredMark
                        value={value.taxIdType}
                        onChange={handleTaxTypeChange}
                        placeholder="Pilih jenis identitas pajak"
                        options={TAX_ID_TYPE_OPTIONS}
                        error={errors?.taxIdType}
                    />

                    {/* Nomor NPWP/NIK — hanya salah satu yang aktif */}
                    {value.taxIdType === 'NPWP' ? (
                        <TextField
                            label={taxNumberLabel}
                            requiredMark
                            placeholder="Masukkan Nomor NPWP"
                            value={value.npwp}
                            onChange={(e) => onChange({ npwp: e.target.value })}
                            inputMode="numeric"
                            autoComplete="off"
                            hint={taxNumberHint}
                            error={errors?.npwp}
                        />
                    ) : (
                        <TextField
                            label={taxNumberLabel}
                            requiredMark
                            placeholder="Masukkan Nomor NIK"
                            value={value.nik}
                            onChange={(e) =>
                                // batasi 16 digit angka
                                onChange({ nik: e.target.value.replace(/\D/g, '').slice(0, 16) })
                            }
                            inputMode="numeric"
                            autoComplete="off"
                            hint={taxNumberHint}
                            error={errors?.nik}
                        />
                    )}

                    <TextField
                        label="Nama Terdaftar"
                        requiredMark
                        placeholder="Masukkan Nama Terdaftar"
                        value={value.registeredName}
                        onChange={(e) => onChange({ registeredName: e.target.value })}
                        autoComplete="organization"
                        error={errors?.registeredName}
                    />

                    <TextField
                        label="Alamat KTP/NPWP"
                        requiredMark
                        placeholder="Masukkan alamat sesuai KTP/NPWP"
                        value={value.registeredAddress}
                        onChange={(e) => onChange({ registeredAddress: e.target.value })}
                        autoComplete="street-address"
                        error={errors?.registeredAddress}
                    />
                    
                </div>

                {/* Kanan */}
                <div className="space-y-3">
                    <SelectField
                        label="Kewajiban Pajak Perusahaan"
                        requiredMark
                        value={value.hasCorporateTax}
                        onChange={(v) => onChange({ hasCorporateTax: v as 'YES' | 'NO' })}
                        placeholder="Apakah perusahaan kena pajak?"
                        options={YES_NO_OPTIONS}
                        error={errors?.hasCorporateTax}
                    />

                    <TextField
                        label="Nomor Rekening"
                        requiredMark
                        placeholder="Masukkan Nomor Rekening"
                        value={value.bankAccountNo}
                        onChange={(e) =>
                            onChange({
                                bankAccountNo: e.target.value.replace(/\D/g, '').slice(0, 30),
                            })
                        }
                        inputMode="numeric"
                        autoComplete="off"
                        error={errors?.bankAccountNo}
                    />
                </div>
            </div>
        </section>
    );
}
