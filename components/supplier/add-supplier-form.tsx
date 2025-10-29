// components/supplier/forms/add-supplier-form.tsx
'use client';

import { useState } from 'react';
import TemplateToggle, { TemplateMode } from '@/components/ui/template-toggle';
import { Button } from '@/components/ui/button';

// ERP sections…
import SupplierDetailSection, { SupplierDetailValue } from './forms/supplier-detail-section';
import OfficeInfoSection, { type OfficeInfoValue, type OfficeAddress } from './forms/office-info-section';
import ContactInfoSection, { type ContactInfoValue, EMPTY_CONTACT } from './forms/contact-info-section';
import TaxInfoSection, { EMPTY_TAX, type TaxInfoValue } from './forms/tax-info-section';
import PaymentInfoSection, { EMPTY_PAYMENT, type PaymentInfoValue } from './forms/payment-info-section';
import AttachmentsSection, {
    EMPTY_ATTACHMENTS,
    SupplierAttachmentsValue,
    SupplierAttachmentsErrors,
} from './forms/attachment-section';
import NonErpSection, { type NonErpFormState } from '@/components/supplier/forms/non-erp-supplier-section';
import Swal from 'sweetalert2';
import { useTopData } from '@/hooks/useTopData';
import type { TopItem } from '@/hooks/useTopData';

export default function AddSupplierForm() {
    const { data: topData } = useTopData();
    const [mode, setMode] = useState<TemplateMode>('NON_ERP');

    // ====== ERP state
    const [detail, setDetail] = useState<SupplierDetailValue>({
        companyName: '',
        companyType: undefined,
        groupAffiliation: '',
        industry: '',
    });
    const emptyAddr: OfficeAddress = { country: 'ID', province: '', city: '', addressLine: '' };
    const [office, setOffice] = useState<OfficeInfoValue>({ hq: { ...emptyAddr }, branch: { ...emptyAddr } });
    const [contact, setContact] = useState<ContactInfoValue>({ sales: { ...EMPTY_CONTACT }, finance: { ...EMPTY_CONTACT } });
    const [payment, setPayment] = useState<PaymentInfoValue>(EMPTY_PAYMENT);
    const [tax, setTax] = useState<TaxInfoValue>(EMPTY_TAX);
    const [attachments, setAttachments] = useState<SupplierAttachmentsValue>(EMPTY_ATTACHMENTS);
    const [attachmentErrors, setAttachmentErrors] = useState<SupplierAttachmentsErrors>({});

    type UnknownRecord = Record<string, unknown>;

    function isEmptyValue(v: unknown): boolean {
        if (v == null) return true;                 // null/undefined
        if (typeof v === 'string') return v.trim() === '';
        if (Array.isArray(v)) return v.length === 0;
        return false;
    }

    /** Ubah '' -> null, sisanya biarkan apa adanya. */
    function emptyToNull<T extends UnknownRecord>(obj: T): T {
        const out: UnknownRecord = {};
        for (const [k, v] of Object.entries(obj)) {
            if (Array.isArray(v)) out[k] = v as unknown[];
            else out[k] = v === '' ? null : v;
        }
        return out as T;
    }

    /** Response bentuk OK/ERR dari /api/supplier */
    type ApiOk<T = unknown> = { ok?: boolean; data?: T; insertedId?: string };
    type ApiErr = { error?: string };

    // Payload ERP yang kamu kirim sekarang (tanpa file upload)
    type ErpPayload = {
        source: 'ERP';
        detail: SupplierDetailValue;
        office: OfficeInfoValue;
        contact: ContactInfoValue;
        tax: TaxInfoValue;
        payment: PaymentInfoValue;
        attachmentsMeta: {
            has_npwp: boolean; has_ktp: boolean; has_nib: boolean;
            has_companyProfile: boolean; has_catalogue: boolean; has_agencyLetter: boolean;
        };
    };

    // Payload NON_ERP sesuai API /api/supplier
    type NonErpPayload = {
        source: 'NON_ERP';
        nama: string | null;
        alamat_pusat: string | null;
        kota_pusat: string | null;
        telp_sales: string | null;
        email_sales: string | null;
        telp_finance: string | null;
        email_finance: string | null;
        no_npwp: string | null;
        nik: string | null;
        alamat_pajak: string | null;
        payment_terms_template: string | null;
        rating: number | null;
        payment_terms: Array<{ description: string | null; value: number | null }> | null;
        categories: string[] | null;
    };

    // ====== Non-ERP state
    const [nonErp, setNonErp] = useState<NonErpFormState>({});

    // helpers
    const patchAttachments = (p: Partial<SupplierAttachmentsValue>) =>
        setAttachments((v) => ({ ...v, ...p }));

    const REQUIRED_NON_ERP: Array<keyof NonErpFormState> = [
        'nama', 'alamat_pusat', 'kota_pusat',
        'telp_sales', 'email_sales', 'telp_finance', 'email_finance',
        'no_npwp', 'nik', 'alamat_pajak',
        'payment_terms_template', 'categories',
    ];

    const buildErpPayload = (): ErpPayload =>
        emptyToNull<ErpPayload>({
            source: 'ERP',
            detail,
            office,
            contact,
            tax,
            payment,
            attachmentsMeta: {
                has_npwp: !!attachments.npwp,
                has_ktp: !!attachments.ktp,
                has_nib: !!attachments.nib,
                has_companyProfile: !!attachments.companyProfile,
                has_catalogue: !!attachments.catalogue,
                has_agencyLetter: !!attachments.agencyLetter,
            },
        });

    const buildNonErpPayload = (topData: TopItem[]): NonErpPayload => {
        const selectedTemplates = Array.isArray(nonErp.payment_terms_template)
            ? nonErp.payment_terms_template
            : nonErp.payment_terms_template
                ? [nonErp.payment_terms_template]
                : [];

        const payment_terms =
            typeof nonErp.payment_terms_template === 'string'
                ? nonErp.payment_terms_template
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean)
                    .map((t) => {
                        const found = topData.find(
                            (top) =>
                                top.nama.trim().toLowerCase() === t.toLowerCase() ||
                                top.id.trim().toLowerCase() === t.toLowerCase()
                        );

                        const creditDays = found?.credit_days ?? 0;

                        console.log('🔍 Matching TOP:', {
                            template: t,
                            foundNama: found?.nama,
                            foundCreditDays: found?.credit_days,
                            usedValue: creditDays,
                        });

                        return {
                            description: t,
                            value: creditDays,
                        };
                    })
                : null;



        const ratingNormalized =
            typeof nonErp.rating === 'number'
                ? nonErp.rating
                : nonErp.rating != null
                    ? Number(nonErp.rating)
                    : null;

        return emptyToNull<NonErpPayload>({
            source: 'NON_ERP',
            nama: nonErp.nama ?? null,
            alamat_pusat: nonErp.alamat_pusat ?? null,
            kota_pusat: nonErp.kota_pusat ?? null,
            telp_sales: nonErp.telp_sales ?? null,
            email_sales: nonErp.email_sales ?? null,
            telp_finance: nonErp.telp_finance ?? null,
            email_finance: nonErp.email_finance ?? null,
            no_npwp: nonErp.no_npwp ?? null,
            nik: nonErp.nik ?? null,
            alamat_pajak: nonErp.alamat_pajak ?? null,
            payment_terms_template: selectedTemplates.join(', '),
            payment_terms,
            rating: ratingNormalized,
            categories: nonErp.categories ?? null,
        });
    };

    const handleSubmit = async () => {
        try {
            let payload: ErpPayload | NonErpPayload;

            if (mode === "NON_ERP") {
                const hasBlank = REQUIRED_NON_ERP.some((k) =>
                    isEmptyValue((nonErp as UnknownRecord)[k])
                );

                if (hasBlank) {
                    await Swal.fire({
                        icon: "warning",
                        title: "Data belum lengkap",
                        text: "Silakan lengkapi semua field wajib dengan format yang benar.",
                        confirmButtonText: "OK",
                    });
                    return;
                }

                payload = buildNonErpPayload(topData);
            } else {
                if (!detail.companyName?.trim()) {
                    await Swal.fire({
                        icon: "warning",
                        title: "Data belum lengkap",
                        text: "Nama Perusahaan (ERP) wajib diisi.",
                        confirmButtonText: "OK",
                    });
                    return;
                }
                payload = buildErpPayload();
            }

            const { isConfirmed } = await Swal.fire({
                title: "Simpan supplier?",
                text: "Data akan disimpan ke database.",
                icon: "question",
                showCancelButton: true,
                confirmButtonText: "Simpan",
                cancelButtonText: "Batal",
            });

            if (!isConfirmed) return;

            try {
                const res = await fetch("/api/supplier", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                const rawText = await res.text(); // tangkap raw dulu
                let data: any = null;
                try {
                    data = JSON.parse(rawText);
                } catch {
                    console.warn("Response bukan JSON valid:", rawText);
                }

                if (!res.ok) {
                    const msg =
                        (data && data.error) || "Gagal menyimpan supplier (server error)";
                    throw new Error(msg);
                }

                Swal.close();

                await Swal.fire({
                    icon: "success",
                    title: "Berhasil",
                    text: "Supplier berhasil disimpan.",
                    timer: 1500,
                    showConfirmButton: false,
                });

                if (mode === "NON_ERP") {
                    setNonErp({});
                } else {
                    setDetail({
                        companyName: "",
                        companyType: undefined,
                        groupAffiliation: "",
                        industry: "",
                    });
                    setOffice({ hq: { ...emptyAddr }, branch: { ...emptyAddr } });
                    setContact({
                        sales: { ...EMPTY_CONTACT },
                        finance: { ...EMPTY_CONTACT },
                    });
                    setPayment(EMPTY_PAYMENT);
                    setTax(EMPTY_TAX);
                    setAttachments(EMPTY_ATTACHMENTS);
                    setAttachmentErrors({});
                }

            } catch (err: unknown) {
                // ✅ Pastikan loading Swal ditutup walau error
                Swal.close();

                const msg =
                    err instanceof Error
                        ? err.message
                        : "Terjadi kesalahan saat menyimpan.";
                await Swal.fire({
                    icon: "error",
                    title: "Gagal",
                    text: msg,
                    confirmButtonText: "OK",
                });
            }
        } catch (e: unknown) {
            Swal.close();
            const msg =
                e instanceof Error ? e.message : "Terjadi kesalahan saat menyimpan.";
            await Swal.fire({
                icon: "error",
                title: "Gagal",
                text: msg,
                confirmButtonText: "OK",
            });
        }
    };

    const handleReset = () => {
        if (mode === 'ERP') {
            setDetail({ companyName: '', companyType: undefined, groupAffiliation: '', industry: '' });
            setOffice({ hq: { ...emptyAddr }, branch: { ...emptyAddr } });
            setContact({ sales: { ...EMPTY_CONTACT }, finance: { ...EMPTY_CONTACT } });
            setPayment(EMPTY_PAYMENT);
            setTax(EMPTY_TAX);
            setAttachments(EMPTY_ATTACHMENTS);
            setAttachmentErrors({});
        } else {
            setNonErp({});
        }
    };

    return (
        <main className="space-y-4 p-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Tambah Supplier</h1>
                <TemplateToggle mode={mode} onModeChange={setMode} />
            </div>

            {mode === 'ERP' ? (
                <>
                    <SupplierDetailSection value={detail} onChange={(p) => setDetail((v) => ({ ...v, ...p }))} className="shadow-sm" />
                    <OfficeInfoSection value={office} onChange={(p) => setOffice((v) => ({ ...v, ...p }))} className="shadow-sm" />
                    <ContactInfoSection value={contact} onChange={(p) => setContact((v) => ({ ...v, ...p }))} className="shadow-sm" />
                    <TaxInfoSection value={tax} onChange={(p) => setTax((v) => ({ ...v, ...p }))} className="shadow-sm" />
                    <PaymentInfoSection value={payment} onChange={(p) => setPayment((v) => ({ ...v, ...p }))} className="shadow-sm" />
                    <AttachmentsSection value={attachments} onChange={patchAttachments} errors={attachmentErrors} className="shadow-sm" />
                </>
            ) : (
                <NonErpSection value={nonErp} onChange={(p) => setNonErp((v) => ({ ...v, ...p }))} />
            )}

            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleReset}>Reset</Button>
                <Button onClick={handleSubmit}>Simpan</Button>
            </div>
        </main>
    );
}
