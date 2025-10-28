'use client';

import * as React from 'react';
import TextField from '@/components/ui/text-field';

/** Bentuk contact per role */
export type Contact = {
    name: string;
    phone: string;
    email: string;
};

/** Nilai untuk seluruh section */
export interface ContactInfoValue {
    sales: Contact;
    finance: Contact;
}

/** Error map opsional (pakai dot-path agar granular) */
export type ContactInfoErrors = Partial<{
    'sales.name': string;
    'sales.phone': string;
    'sales.email': string;
    'finance.name': string;
    'finance.phone': string;
    'finance.email': string;
}>;

export interface ContactInfoSectionProps {
    value: ContactInfoValue;
    onChange: (patch: Partial<ContactInfoValue>) => void;
    errors?: ContactInfoErrors;
    className?: string;
}

export const EMPTY_CONTACT: Contact = { name: '', phone: '', email: '' };

export default function ContactInfoSection({
    value,
    onChange,
    errors,
    className,
}: ContactInfoSectionProps) {
    const sales = value?.sales ?? EMPTY_CONTACT;
    const finance = value?.finance ?? EMPTY_CONTACT;

    const setSales = (patch: Partial<Contact>) =>
        onChange({ sales: { ...sales, ...patch } });

    const setFinance = (patch: Partial<Contact>) =>
        onChange({ finance: { ...finance, ...patch } });

    return (
        <section
            className={[
                'space-y-4 rounded-2xl border bg-white p-5',
                className,
            ]
                .filter(Boolean)
                .join(' ')}
        >
            <header>
                <h2 className="text-lg font-semibold">Informasi Kontak</h2>
                <p className="text-sm text-slate-500">
                    Kontak utama untuk keperluan <span className="font-medium">Sales</span> dan{' '}
                    <span className="font-medium">Finance</span>.
                </p>
            </header>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* ====== SALES ====== */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-800">Sales</h3>

                    <TextField
                        label="Nama Sales"
                        requiredMark
                        placeholder="Masukkan Nama Sales"
                        value={sales.name}
                        onChange={(e) => setSales({ name: e.target.value })}
                        error={errors?.['sales.name']}
                        autoComplete="name"
                    />

                    <TextField
                        label="Nomor Telp Sales"
                        requiredMark
                        placeholder="Masukkan Nomor Telp Sales"
                        value={sales.phone}
                        onChange={(e) => setSales({ phone: e.target.value })}
                        error={errors?.['sales.phone']}
                        inputMode="tel"
                        autoComplete="tel"
                    />

                    <TextField
                        label="Email Sales"
                        requiredMark
                        placeholder="Masukkan Email Sales"
                        value={sales.email}
                        onChange={(e) => setSales({ email: e.target.value })}
                        error={errors?.['sales.email']}
                        inputMode="email"
                        autoComplete="email"
                    />
                </div>

                {/* ====== FINANCE ====== */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-800">Finance</h3>

                    <TextField
                        label="Nama Finance"
                        requiredMark
                        placeholder="Masukkan Nama Finance"
                        value={finance.name}
                        onChange={(e) => setFinance({ name: e.target.value })}
                        error={errors?.['finance.name']}
                        autoComplete="name"
                    />

                    <TextField
                        label="Nomor Telp Finance"
                        requiredMark
                        placeholder="Masukkan Nomor Telp Finance"
                        value={finance.phone}
                        onChange={(e) => setFinance({ phone: e.target.value })}
                        error={errors?.['finance.phone']}
                        inputMode="tel"
                        autoComplete="tel"
                    />

                    <TextField
                        label="Email Finance"
                        requiredMark
                        placeholder="Masukkan Email Finance"
                        value={finance.email}
                        onChange={(e) => setFinance({ email: e.target.value })}
                        error={errors?.['finance.email']}
                        inputMode="email"
                        autoComplete="email"
                    />
                </div>
            </div>
        </section>
    );
}
