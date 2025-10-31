

/** Bentuk data yang dipakai DI UI (hasil normalisasi dari DB) */
export interface SupplierRow {
    id: string;                 // gunakan ini untuk kode supplier (mis. S-DN-00012)
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
    updated_at?: string | null;

    items?: [string, number][] | null;

    raw?: unknown;
}

// export type Supplier = {
//     code: string;
//     name: string;
//     alamat_pusat: string;
//     kota_pusat: string;
//     telp_sales: string;
//     email_sales: string;
//     telp_finance: string;
//     email_finance: string;
//     no_npwp: string;
//     nik: string;
//     status: 'ACTIVE' | 'INACTIVE';
//     alamat_pajak: string;
//     payment_terms_template: string;
//     payment_terms: string | null;
//     rating: number;
//     categories: string[]; // array kategori
//     items: [string, number][];      // array item
//     created_at: string;
//     updated_at: string;
//     raw: unknown;
// };

export type SupplierStatus = 'ACTIVE' | 'INACTIVE';

export type Supplier = {
    id?: string;
    nama?: string;
    code?: string;
    name?: string;
    status: SupplierStatus;
    city?: string;
    contact?: string;
    email?: string;
    phone?: string;
    paymentTerms?: string;
    categories?: string[];
    rating?: number;
    updatedAt?: string;
    items?: [string, number][];

    /** Data asli dari API (bisa bentuk apa saja) */
    raw?: unknown;
};

export interface SupplierDoc extends SupplierRow {
    _id?: string;
}

export interface SupplierCreateDTO {
    id: string;
    nama: string;
}
export type SupplierUpdateDTO = Partial<SupplierCreateDTO> & { id: string };
