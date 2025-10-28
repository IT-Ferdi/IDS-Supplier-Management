'use client';

import * as React from 'react';
import SelectField, { type Option } from '@/components/ui/select-field';
import TextField from '@/components/ui/text-field';

const BANK_NAMES = [
    'Bank Mandiri',
    'Bank Rakyat Indonesia (BRI)',
    'Bank Negara Indonesia (BNI)',
    'Bank Central Asia (BCA)',
    'Bank Tabungan Negara (BTN)',
    'Bank Danamon',
    'Bank CIMB Niaga',
    'Bank Permata',
    'Bank Mega',
    'Bank Panin',
    'Bank Maybank Indonesia',
    'Bank OCBC NISP',
    'Bank Sinarmas',
    'Bank UOB Indonesia',
    'Bank Bukopin',
    'Bank BTPN',
    'Bank Commonwealth',
    'Bank HSBC Indonesia',
    'Bank Jago',
    'Bank Syariah Indonesia (BSI)',
] satisfies string[];

export type PaymentTermUnit = 'DAY' | 'MONTH';

export interface PaymentInfoValue {
    bankName: string;
    accountName: string;
    accountNumber: string;
    termValue: string;          // angka (string supaya mudah kontrol)
    termUnit: PaymentTermUnit;  // DAY / MONTH
}

export type PaymentInfoErrors = Partial<{
    bankName: string;
    accountName: string;
    accountNumber: string;
    termValue: string;
    termUnit: string;
}>;

export interface PaymentInfoSectionProps {
    value: PaymentInfoValue;
    onChange: (patch: Partial<PaymentInfoValue>) => void;
    errors?: PaymentInfoErrors;
    className?: string;
}

/** Initial value yang bisa dipakai di parent */
export const EMPTY_PAYMENT: PaymentInfoValue = {
    bankName: '',
    accountName: '',
    accountNumber: '',
    termValue: '0',
    termUnit: 'DAY',
};

const BANK_OPTIONS: Option[] = BANK_NAMES.map((b) => ({ label: b, value: b }));
const TERM_UNIT_OPTIONS: Option[] = [
    { label: 'Hari', value: 'DAY' },
    { label: 'Bulan', value: 'MONTH' },
];

export default function PaymentInfoSection({
    value,
    onChange,
    errors,
    className,
}: PaymentInfoSectionProps) {
    return (
        <section
            className={['space-y-4 rounded-2xl border bg-white p-5', className]
                .filter(Boolean)
                .join(' ')}
        >
            <header>
                <h2 className="text-lg font-semibold">Transaksi Pembayaran</h2>
            </header>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* KIRI */}
                <div className="space-y-3">
                    <SelectField
                        label="Nama Bank"
                        requiredMark
                        placeholder="Pilih Nama Bank"
                        value={value.bankName}
                        onChange={(v) => onChange({ bankName: v })}
                        options={BANK_OPTIONS}
                        error={errors?.bankName}
                    />

                    <TextField
                        label="Nama Pemilik Rekening"
                        requiredMark
                        placeholder="Masukkan Nama Pemilik Rekening"
                        value={value.accountName}
                        onChange={(e) => onChange({ accountName: e.target.value })}
                        autoComplete="name"
                        error={errors?.accountName}
                    />
                </div>

                {/* KANAN */}
                <div className="space-y-3">
                    <TextField
                        label="Nomor Rekening"
                        requiredMark
                        placeholder="Masukkan Nomor Rekening"
                        value={value.accountNumber}
                        onChange={(e) =>
                            onChange({
                                accountNumber: e.target.value.replace(/\D/g, '').slice(0, 30),
                            })
                        }
                        inputMode="numeric"
                        autoComplete="off"
                        error={errors?.accountNumber}
                    />

                    {/* Tempo Pembayaran (angka + satuan) */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Tempo Pembayaran <span className="text-rose-500">*</span>
                        </label>
                        <div className="flex gap-2">
                            <TextField
                                placeholder="0"
                                value={value.termValue}
                                onChange={(e) =>
                                    onChange({
                                        termValue: e.target.value.replace(/\D/g, '').slice(0, 3),
                                    })
                                }
                                inputMode="numeric"
                                autoComplete="off"
                                className="flex-1"
                                error={errors?.termValue}
                            />
                            <div className="w-32">
                                <SelectField
                                    value={value.termUnit}
                                    onChange={(v) => onChange({ termUnit: v as PaymentTermUnit })}
                                    options={TERM_UNIT_OPTIONS}
                                    placeholder="Satuan"
                                    error={errors?.termUnit}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
