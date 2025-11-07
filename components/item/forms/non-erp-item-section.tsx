// components/item/non-erp-item-section.tsx
'use client';

import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import TextField from '@/components/ui/text-field';
import TextareaField from '@/components/ui/textarea-field';
import SelectField from '@/components/ui/select-field';

import { useUomData } from '@/hooks/useUomData';
import CategoryTree from '@/components/ui/category-tree';
import { useCategoryRows, useCategoryTree, type CategoryRow } from '@/hooks/useCategoryData';
import Swal from 'sweetalert2';
import type { UomRow } from '@/types/uom';

type NonErpItemForm = {
    brand: string;
    name: string;
    description: string;
    uom: string;
    categoryId: string | null; // disimpan lokal untuk UI tree
};

type Props = {
    api?: string;
    onSaved?: (payload: any) => void;
    onCancel?: () => void;
    uomOptions?: string[];
    categoryUrl?: string;
    defaultValue?: Partial<NonErpItemForm>;
};

const DEFAULT_UOMS = ['Pcs', 'Unit', 'Box', 'Roll', 'Set', 'Kg', 'Ltr', 'Meter', 'Pack', 'Sheet'];

export default function NonErpItemSection({
    api = '/api/item',
    onSaved,
    onCancel,
    uomOptions = DEFAULT_UOMS,
    categoryUrl = '/api/category',
    defaultValue,
}: Props) {
    const { data: uoms = [], isLoading: loadingUom } = useUomData();
    const catRowsQ = useCategoryRows({ url: categoryUrl, staleTimeMs: 0, cache: 'no-store' });
    const rows = catRowsQ.data ?? [];
    const { index } = useCategoryTree(rows);

    const [form, setForm] = useState<NonErpItemForm>({
        brand: defaultValue?.brand ?? '',
        name: defaultValue?.name ?? '',
        description: defaultValue?.description ?? '',
        uom: defaultValue?.uom ?? '',
        categoryId: defaultValue?.categoryId ?? null,
    });

    const [errors, setErrors] = useState<Partial<Record<keyof NonErpItemForm | 'category', string>>>({});
    const [submitting, setSubmitting] = useState(false);

    const selectedIds = useMemo(() => (form.categoryId ? [form.categoryId] : []), [form.categoryId]);

    const canSubmit = useMemo(() => {
        return !!form.name.trim() && !!form.uom.trim() && !!form.categoryId;
    }, [form]);

    function set<K extends keyof NonErpItemForm>(key: K, value: NonErpItemForm[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
        setErrors((e) => ({ ...e, [key]: undefined }));
    }

    const isLeaf = (id?: string | null) => {
        if (!id) return false;
        const n = index.get(id);
        return !!n && (!n.children || n.children.length === 0);
        // hanya izinkan leaf
    };

    const handleCategoryChange = (ids: string[]) => {
        setErrors((e) => ({ ...e, category: undefined }));
        const leafIds = ids.filter((id) => isLeaf(id));
        setForm((f) => ({ ...f, categoryId: leafIds[0] ?? null }));
    };

    const { parentById, nameById } = useMemo(() => {
        const parent = new Map<string, string | null>();
        const name = new Map<string, string>();
        rows.forEach((r: CategoryRow) => {
            parent.set(r.id, r.parent ?? null);
            name.set(r.id, r.nama);
        });
        return { parentById: parent, nameById: name };
    }, [rows]);

    const breadcrumb = useMemo(() => {
        if (!form.categoryId) return '';
        const path: string[] = [];
        let cur: string | null = form.categoryId;
        while (cur) {
            path.push(nameById.get(cur) ?? cur);
            cur = parentById.get(cur) ?? null;
        }
        return path.reverse().join(' > ');
    }, [form.categoryId, parentById, nameById]);

    function validate(): boolean {
        const e: Partial<Record<keyof NonErpItemForm | 'category', string>> = {};
        if (!form.name.trim()) e.name = 'Nama wajib diisi';
        if (!form.uom.trim()) e.uom = 'UOM wajib dipilih';
        if (!form.categoryId || !isLeaf(form.categoryId)) e.category = 'Pilih kategori sampai leaf';
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    async function handleSubmit(e?: React.FormEvent) {
        e?.preventDefault();
        if (!validate()) return;

        const confirm = await Swal.fire({
            title: 'Simpan Item?',
            text: 'Pastikan data sudah benar sebelum disimpan.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya, simpan',
            cancelButtonText: 'Batal',
            reverseButtons: true,
        });

        if (!confirm.isConfirmed) return;

        try {
            setSubmitting(true);

            const categoryName = form.categoryId ? (nameById.get(form.categoryId) ?? null) : null;

            const payload = {
                brand: form.brand || null,
                name: form.name,
                description: form.description || '-',
                uom: form.uom,
                category: categoryName,
            };

            const res = await fetch(api, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const json = await res.json().catch(() => null);
            if (!res.ok) throw new Error(json?.error || 'Gagal menyimpan item');

            // success alert
            await Swal.fire({
                title: 'Berhasil',
                text: `Item berhasil disimpan.`,
                icon: 'success',
                confirmButtonColor: '#0ea5e9', // sky-500
            });

            onSaved?.(json?.data ?? json);

            // reset form
            setForm({
                brand: '',
                name: '',
                description: '',
                uom: '',
                categoryId: null,
            });
        } catch (err: any) {
            await Swal.fire({
                title: 'Gagal',
                text: err?.message || 'Terjadi kesalahan saat menyimpan.',
                icon: 'error',
                confirmButtonColor: '#ef4444', // red-500
            });
        } finally {
            setSubmitting(false);
        }
    }

    const uomSelectOptions =
        (uoms as UomRow[]).length
            ? (uoms as UomRow[]).map((u) => ({ label: u.name, value: u.id }))
            : (DEFAULT_UOMS as string[]).map((u) => ({ label: u, value: u }));

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <Card className="p-5 space-y-5">
                <div>
                    <h2 className="text-lg font-semibold">Tambah Item (Non-ERP)</h2>
                    <p className="text-sm text-slate-500">Isi data item internal (MID) untuk pemasok Non-ERP.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField
                        label="Brand"
                        placeholder="Contoh: SKF"
                        value={form.brand}
                        onChange={(e) => set('brand', e.target.value)}
                    />

                    {/* Tidak ada input Code (MID). API akan membuat otomatis. */}

                    <TextField
                        label="Nama"
                        requiredMark
                        placeholder="Contoh: BEARING SKF 23130"
                        value={form.name}
                        error={errors.name}
                        onChange={(e) => set('name', e.target.value)}
                    />

                    <SelectField
                        label="UOM"
                        requiredMark
                        value={form.uom}
                        error={errors.uom}
                        onChange={(val: string) => set('uom', val)}
                        options={uomSelectOptions}
                        placeholder={loadingUom ? 'Memuat…' : 'Pilih UOM'}
                    />
                </div>

                <div className="space-y-1">
                    <CategoryTree
                        selectedIds={selectedIds}
                        onChange={handleCategoryChange}
                        fetchUrl={categoryUrl}
                        selectableHeaders={false}
                        title="Kategori"
                        searchPlaceholder="Cari kategori…"
                    />
                    <div className="text-xs text-slate-500">
                        {form.categoryId ? `Kategori: ${breadcrumb || form.categoryId}` : 'Pilih kategori sampai leaf'}
                    </div>
                    {errors.category && <p className="text-xs text-rose-600">{errors.category}</p>}
                </div>

                <TextareaField
                    label="Deskripsi"
                    placeholder="Deskripsi singkat item…"
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                    rows={4}
                />

                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
                        Batal
                    </Button>
                    <Button type="submit" disabled={!canSubmit || submitting}>
                        {submitting ? 'Menyimpan…' : 'Simpan Item'}
                    </Button>
                </div>
            </Card>
        </form>
    );
}
