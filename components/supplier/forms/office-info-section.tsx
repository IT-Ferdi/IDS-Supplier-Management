'use client';

import * as React from 'react';
import SelectField from '@/components/ui/select-field';
import TextField from '@/components/ui/text-field';
import {
  useCountryOptions,
  useProvinceOptions,
  useCityOptions,
} from '@/hooks/useRegionData';

/** Address (nested) */
export type OfficeAddress = {
  country: string;     // ex: 'ID'
  province: string;    // ex: '31'
  city: string;        // ex: '3174'
  addressLine: string;
};

export interface OfficeInfoValue {
  hq: OfficeAddress;
  branch: OfficeAddress;
}

export type OfficeInfoErrors = Partial<{
  'hq.country': string;
  'hq.province': string;
  'hq.city': string;
  'hq.addressLine': string;
  'branch.country': string;
  'branch.province': string;
  'branch.city': string;
  'branch.addressLine': string;
}>;

export interface OfficeInfoSectionProps {
  value: OfficeInfoValue;
  onChange: (patch: Partial<OfficeInfoValue>) => void;
  countriesApi?: string; // (opsional) kalau nanti mau override endpoint
  errors?: OfficeInfoErrors;
  className?: string;
}

export default function OfficeInfoSection({
  value,
  onChange,
  errors,
  className,
}: OfficeInfoSectionProps) {
  const { hq, branch } = value;

  // ====== Master via hooks (Option[]: {label, value}) ======
  // NOTE: saat ini useCountryOptions() memakai endpoint default /api/region/country.
  // Jika kamu ingin dukung override via countriesApi, ubah hook untuk menerima argumen api.
  const {
    data: countryOpts = [],
    isLoading: loadingCountries,
    error: countryErr,
  } = useCountryOptions();

  const {
    data: provinceOpts = [],
    isLoading: loadingProvinces,
    error: provinceErr,
  } = useProvinceOptions();

  const {
    data: hqCityOpts = [],
    isLoading: loadingHqCities,
    error: hqCityErr,
  } = useCityOptions(hq.province);

  const {
    data: branchCityOpts = [],
    isLoading: loadingBranchCities,
    error: branchCityErr,
  } = useCityOptions(branch.province);

  // ====== Handlers (reset child ketika parent berubah) ======
  const handleHqCountry = (v: string) =>
    onChange({ hq: { country: v, province: '', city: '', addressLine: hq.addressLine } });

  const handleHqProvince = (v: string) =>
    onChange({ hq: { ...hq, province: v, city: '' } });

  const handleBranchCountry = (v: string) =>
    onChange({ branch: { country: v, province: '', city: '', addressLine: branch.addressLine } });

  const handleBranchProvince = (v: string) =>
    onChange({ branch: { ...branch, province: v, city: '' } });

  return (
    <section className={['space-y-4 rounded-2xl border bg-white p-5', className].filter(Boolean).join(' ')}>
      <header>
        <h2 className="text-lg font-semibold">Informasi Kantor</h2>
        <p className="text-sm text-slate-500">Isikan informasi kantor perusahaan.</p>
        {(countryErr || provinceErr || hqCityErr || branchCityErr) && (
          <p className="mt-1 text-xs text-rose-600">
            {countryErr && <>Gagal memuat negara. </>}
            {provinceErr && <>Gagal memuat provinsi. </>}
            {hqCityErr && <>Gagal memuat kota (HQ). </>}
            {branchCityErr && <>Gagal memuat kota (Cabang). </>}
          </p>
        )}
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* ====== KANTOR PUSAT ====== */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-800">Kantor Pusat</h3>

          <SelectField
            label="Negara Kantor Pusat"
            requiredMark
            value={hq.country}
            onChange={handleHqCountry}
            placeholder={loadingCountries ? 'Memuat negara…' : 'Pilih Negara'}
            options={countryOpts}
            error={errors?.['hq.country']}
            disabled={true}
          />

          <SelectField
            label="Provinsi Kantor Pusat"
            requiredMark
            value={hq.province}
            onChange={handleHqProvince}
            placeholder={loadingProvinces ? 'Memuat…' : 'Pilih Provinsi Kantor Pusat'}
            options={provinceOpts}
            error={errors?.['hq.province']}
            disabled={!hq.country || loadingProvinces}
          />

          <SelectField
            label="Kota Kantor Pusat"
            requiredMark
            value={hq.city}
            onChange={(v) => onChange({ hq: { ...hq, city: v } })}
            placeholder={hq.province ? (loadingHqCities ? 'Memuat…' : 'Pilih Kota Kantor Pusat') : 'Pilih provinsi dulu'}
            options={hqCityOpts}
            error={errors?.['hq.city']}
            disabled={!hq.province || loadingHqCities}
          />

          <TextField
            label="Alamat Kantor Pusat"
            requiredMark
            placeholder="Masukkan Alamat Kantor Pusat"
            value={hq.addressLine}
            onChange={(e) => onChange({ hq: { ...hq, addressLine: e.target.value } })}
            error={errors?.['hq.addressLine']}
          />
        </div>

        {/* ====== KANTOR CABANG ====== */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-800">Kantor Cabang</h3>

          <SelectField
            label="Negara Kantor Cabang"
            requiredMark
            value={branch.country}
            onChange={handleBranchCountry}
            placeholder={loadingCountries ? 'Memuat negara…' : 'Pilih Negara'}
            options={countryOpts}
            error={errors?.['branch.country']}
            disabled={true}
          />

          <SelectField
            label="Provinsi Kantor Cabang"
            requiredMark
            value={branch.province}
            onChange={handleBranchProvince}
            placeholder={loadingProvinces ? 'Memuat…' : 'Pilih Provinsi Kantor Cabang'}
            options={provinceOpts}
            error={errors?.['branch.province']}
            disabled={!branch.country || loadingProvinces}
          />

          <SelectField
            label="Kota Kantor Cabang"
            requiredMark
            value={branch.city}
            onChange={(v) => onChange({ branch: { ...branch, city: v } })}
            placeholder={branch.province ? (loadingBranchCities ? 'Memuat…' : 'Pilih Kota Kantor Cabang') : 'Pilih provinsi dulu'}
            options={branchCityOpts}
            error={errors?.['branch.city']}
            disabled={!branch.province || loadingBranchCities}
          />

          <TextField
            label="Alamat Kantor Cabang"
            requiredMark
            placeholder="Masukkan Alamat Kantor Cabang"
            value={branch.addressLine}
            onChange={(e) => onChange({ branch: { ...branch, addressLine: e.target.value } })}
            error={errors?.['branch.addressLine']}
          />
        </div>
      </div>
    </section>
  );
}
