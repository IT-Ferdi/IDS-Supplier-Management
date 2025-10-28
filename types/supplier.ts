// types/supplier.ts
export type SupplierId = string;

/** Bentuk data yang dipakai DI UI (hasil normalisasi dari DB) */
export interface SupplierRow {
    id: SupplierId;                 // gunakan ini untuk kode supplier (mis. S-DN-00012)
    nama: string;
    kota_pusat?: string | null;
    alamat_pusat?: string | null;

    telp_sales?: string | null;
    email_sales?: string | null;

    telp_finance?: string | null;
    email_finance?: string | null;

    no_npwp?: string | null;
    nik?: string | null;
    alamat_pajak?: string | null;

    payment_terms_template?: string | null;
    payment_terms?: string | null;

    rating?: number | null;
    categories?: string[] | null;
}

export interface SupplierDoc extends SupplierRow {
    _id?: string; 
}

export interface SupplierCreateDTO {
    id: string;
    nama: string;
}
export type SupplierUpdateDTO = Partial<SupplierCreateDTO> & { id: string };
