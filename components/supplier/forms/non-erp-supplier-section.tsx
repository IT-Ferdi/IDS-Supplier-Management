'use client';

import * as React from 'react';
import { useTopData } from '@/hooks/useTopData';
import {
    type Option,
    useProvinceOptions,
    useCityOptions,
} from '@/hooks/useRegionData';
import StarRating from '@/components/ui/star-rating';
import CategoryTree from '@/components/ui/category-tree';

export type NonErpFormState = {
    id?: string;
    nama?: string;

    // Alamat & Region
    alamat_pusat?: string;

    /** NAMA provinsi (human readable) */
    provinsi_pusat?: string;
    /** KODE provinsi (dari API) */
    provinsi_pusat_code?: string;

    /** NAMA kota (human readable; kompatibel dengan field lama) */
    kota_pusat?: string;
    /** KODE kota (dari API) */
    kota_pusat_code?: string;

    // Kontak
    telp_sales?: string;
    email_sales?: string;
    telp_finance?: string;
    email_finance?: string;

    // Identitas/Pajak
    no_npwp?: string;
    nik?: string;
    alamat_pajak?: string;

    // TOP (auto-fill)
    payment_terms_template?: string;
    top_credit_days?: number | null;
    payment_terms_ids?: string[];
    categories?: string[];

    // Lain-lain
    rating?: number | 0;
};

export default function NonErpSection({
    value,
    onChange,
}: {
    value: NonErpFormState;
    onChange: (patch: Partial<NonErpFormState>) => void;
}) {
    /* =======================
     * Payment Terms (TOP)
     * ======================= */
    const { data: tops = [], loading: isTopLoading, error: topError } = useTopData();

    /* =======================
     * Region (Provinsi & Kota)
     * ======================= */
    const provinces = useProvinceOptions();
    const cities = useCityOptions(value.provinsi_pusat_code);

    const handleProvinceChange = (provCode: string) => {
        const opt = provinces.data?.find((o: Option) => o.value === provCode);
        onChange({
            provinsi_pusat_code: provCode || undefined,
            provinsi_pusat: opt?.label || '',
            // reset pilihan kota saat provinsi berubah
            kota_pusat_code: undefined,
            kota_pusat: '',
        });
    };

    const handleCityChange = (cityCode: string) => {
        const opt = cities.data?.find((o: Option) => o.value === cityCode);
        onChange({
            kota_pusat_code: cityCode || undefined,
            kota_pusat: opt?.label || '',
        });
    };

    // Bentuk data untuk CategoryTree (semua root)
    const topItems = React.useMemo(
        () =>
            (tops ?? []).map((t) => ({
                id: String(t.id),
                nama: t.nama ?? String(t.id),
                parent: null as null,
                status_group: 0 as number,
            })),
        [tops]
    );

    // Daftar ID terpilih saat ini (fallback [] jika belum ada)
    const selectedTopIds = value.payment_terms_ids ?? [];

    // Handler multi-select
    const handleTopPickMulti = (ids: string[]) => {
        // Ambil item sesuai ids → untuk ditampilkan sebagai ringkasan nama
        const picked = ids
            .map((id) => tops.find((t) => String(t.id) === id))
            .filter(Boolean) as typeof tops;

        const display = picked.map((t) => t.nama ?? String(t.id)).join(', ');

        onChange({
            payment_terms_ids: ids,          // simpan array id
            payment_terms_template: display, // ringkasan nama (untuk tampil)
            top_credit_days: null,           // multi: tidak ada satu angka pasti
        });
    };


    // Kelas untuk field required: border & ring merah ketika invalid
    const reqClass =
        'required aria-required:true invalid:ring-2 invalid:ring-rose-300 invalid:border-rose-400';

    return (
        <section className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
            <header>
                <h2 className="text-lg font-semibold">Data Supplier (Non-ERP)</h2>
                <p className="text-sm text-slate-500">Semua field wajib diisi.</p>
            </header>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Row 1: Nama | Rating */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        Nama <span className="text-rose-500">*</span>
                    </label>
                    <input
                        required
                        aria-required="true"
                        className={`w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-300 ${reqClass}`}
                        value={value.nama ?? ''}
                        onChange={(e) => onChange({ nama: e.target.value })}
                        placeholder="Nama Supplier"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        Rating <span className="text-rose-500">*</span>
                    </label>
                    <StarRating
                        name="supplier_rating"
                        value={typeof value.rating === 'number' ? value.rating : 0}
                        onChange={(next) => onChange({ rating: next })}
                        max={5}
                        step={0.5}
                        size={28}
                    />
                </div>

                {/* Row 2: Alamat Pusat | Kategori Supplier */}
                <div className="md:col-span-2">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {/* Kolom kiri: Alamat */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                Alamat Pusat <span className="text-rose-500">*</span>
                            </label>
                            <input
                                required
                                aria-required="true"
                                className={`w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-300 ${reqClass}`}
                                value={value.alamat_pusat ?? ''}
                                onChange={(e) => onChange({ alamat_pusat: e.target.value })}
                                placeholder="Alamat lengkap"
                            />
                        </div>

                        {/* Kolom kanan: Category (tanpa card besar) */}
                        <div>
                            <CategoryTree
                                selectedIds={value.categories ?? []}
                                onChange={(ids) => onChange({ categories: ids })}
                                selectableHeaders={false}
                                title="Kategori Supplier"
                                className=""
                                panelWidth={520}
                                panelMaxHeight={360}
                            />
                        </div>
                    </div>
                </div>

                {/* Row 3: Provinsi | Kota */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        Provinsi Pusat <span className="text-rose-500">*</span>
                    </label>
                    <select
                        required
                        aria-required="true"
                        className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-300 ${reqClass}`}
                        value={value.provinsi_pusat_code ?? ''}
                        onChange={(e) => handleProvinceChange(e.target.value)}
                        disabled={provinces.isLoading || !!provinces.error}
                    >
                        <option value="">Pilih Provinsi…</option>
                        {provinces.data?.map((p) => (
                            <option key={p.value} value={p.value}>
                                {p.label}
                            </option>
                        ))}
                    </select>
                    <p className="mt-1 text-xs text-slate-500">
                        {provinces.isLoading
                            ? 'Memuat provinsi…'
                            : provinces.error
                                ? 'Gagal memuat provinsi.'
                                : value.provinsi_pusat
                                    ? `Dipilih: ${value.provinsi_pusat}`
                                    : 'Belum memilih provinsi.'}
                    </p>
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        Kota Pusat <span className="text-rose-500">*</span>
                    </label>
                    <select
                        required
                        aria-required="true"
                        className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-300 ${reqClass}`}
                        value={value.kota_pusat_code ?? ''}
                        onChange={(e) => handleCityChange(e.target.value)}
                        disabled={!value.provinsi_pusat_code || cities.isLoading || !!cities.error}
                    >
                        {!value.provinsi_pusat_code ? (
                            <option value="">Pilih provinsi terlebih dahulu…</option>
                        ) : (
                            <>
                                <option value="">Pilih Kota…</option>
                                {cities.data?.map((c) => (
                                    <option key={c.value} value={c.value}>
                                        {c.label}
                                    </option>
                                ))}
                            </>
                        )}
                    </select>
                    <p className="mt-1 text-xs text-slate-500">
                        {!value.provinsi_pusat_code
                            ? 'Pilih provinsi untuk memuat kota.'
                            : cities.isLoading
                                ? 'Memuat kota…'
                                : cities.error
                                    ? 'Gagal memuat kota.'
                                    : value.kota_pusat
                                        ? `Dipilih: ${value.kota_pusat}`
                                        : 'Belum memilih kota.'}
                    </p>
                </div>

                {/* Row 4: Telp Sales | Email Sales */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        Telp Sales <span className="text-rose-500">*</span>
                    </label>
                    <input
                        required
                        aria-required="true"
                        className={`w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-300 ${reqClass}`}
                        value={value.telp_sales ?? ''}
                        onChange={(e) => onChange({ telp_sales: e.target.value })}
                        placeholder="021-xxxxxxx"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        Email Sales <span className="text-rose-500">*</span>
                    </label>
                    <input
                        required
                        aria-required="true"
                        type="email"
                        className={`w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-300 ${reqClass}`}
                        value={value.email_sales ?? ''}
                        onChange={(e) => onChange({ email_sales: e.target.value })}
                        placeholder="sales@email.com"
                    />
                </div>

                {/* Row 5: Telp Finance | Email Finance */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        Telp Finance <span className="text-rose-500">*</span>
                    </label>
                    <input
                        required
                        aria-required="true"
                        className={`w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-300 ${reqClass}`}
                        value={value.telp_finance ?? ''}
                        onChange={(e) => onChange({ telp_finance: e.target.value })}
                        placeholder=""
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        Email Finance <span className="text-rose-500">*</span>
                    </label>
                    <input
                        required
                        aria-required="true"
                        type="email"
                        className={`w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-300 ${reqClass}`}
                        value={value.email_finance ?? ''}
                        onChange={(e) => onChange({ email_finance: e.target.value })}
                        placeholder=""
                    />
                </div>

                {/* Row 6: NPWP | NIK */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        NPWP <span className="text-rose-500">*</span>
                    </label>
                    <input
                        required
                        aria-required="true"
                        className={`w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-300 ${reqClass}`}
                        value={value.no_npwp ?? ''}
                        onChange={(e) => onChange({ no_npwp: e.target.value })}
                        placeholder="93.843.844.7-618.000"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        NIK <span className="text-rose-500">*</span>
                    </label>
                    <input
                        required
                        aria-required="true"
                        className={`w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-300 ${reqClass}`}
                        value={value.nik ?? ''}
                        onChange={(e) => onChange({ nik: e.target.value })}
                        placeholder="3521xxxxxxxxxxxx"
                    />
                </div>

                {/* Row 7: Alamat Pajak (full) */}
                <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        Alamat Pajak <span className="text-rose-500">*</span>
                    </label>
                    <input
                        required
                        aria-required="true"
                        className={`w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-300 ${reqClass}`}
                        value={value.alamat_pajak ?? ''}
                        onChange={(e) => onChange({ alamat_pajak: e.target.value })}
                        placeholder=""
                    />
                </div>

                <div className="md:col-span-2">
                    <CategoryTree
                        title="Payment Terms (Template) *"
                        items={topItems}                    // data dari useTopData
                        selectedIds={selectedTopIds}        // multi
                        onChange={handleTopPickMulti}       // multi
                        selectableHeaders={false}
                        panelWidth={520}
                        panelMaxHeight={360}
                    />
                    <p className="mt-1 text-xs text-slate-500">
                        {isTopLoading
                            ? 'Memuat TOP…'
                            : topError
                                ? 'Gagal memuat TOP.'
                                : selectedTopIds.length > 0
                                    ? `Dipilih: ${value.payment_terms_template}`
                                    : 'Belum memilih TOP.'}
                    </p>
                </div>


                {/* spacer kanan biar grid rapih */}
                <div className="hidden md:block" />
            </div>
        </section>
    );
}
