'use client';

import React, { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Package, ClipboardList, Briefcase, Building2 as Office, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ItemRow } from '@/types/item';
import { useMaterialRequestData } from '@/hooks/useMaterialRequestData';
import type { MaterialRequest, MaterialRequestItem } from '@/types/material-request';

type Props = {
    item: ItemRow | null;
    onClose: () => void;
};

export default function ItemDemandPanel({ item, onClose }: Props) {
    const { data: mrs = [], isLoading, error } = useMaterialRequestData();

    // koleksi baris yang match item + status yang diperbolehkan
    const { mrRows, projects, costCenters, departments, mrIds } = useMemo(() => {
        const ALLOWED = new Set(['draft', 'partially ordered', 'pending']);

        type Row = {
            mrId: string;
            mrDate?: string;
            mrStatus: string;
            project?: string;
            cost_center?: string;
            department?: string;
            qty: number;
            ordered: number; // use qty_total_po (fallback ordered_qty)
        };

        const rows: Row[] = [];

        (mrs as MaterialRequest[]).forEach((mr) => {
            const st = (mr.status ?? '').toLowerCase();
            if (!ALLOWED.has(st)) return;

            (mr.items ?? []).forEach((it: MaterialRequestItem) => {
                if (!item?.id) return;
                if ((it.item_code ?? '').toLowerCase() !== item.id.toLowerCase()) return;

                const qty = Number(it.qty ?? 0);
                // prefer qty_total_po as accumulated PO qty, fallback to ordered_qty
                const ordered = Number(it.qty_total_po ?? it.ordered_qty ?? 0);

                // skip baris yang sudah tuntas (asked <= ordered)
                if (qty <= ordered) return;

                rows.push({
                    mrId: mr.name ?? '',
                    mrDate: mr.required_by,
                    mrStatus: mr.status ?? '-',
                    project: it.project ?? '',
                    cost_center: it.cost_center ?? '',
                    department: it.department ?? '',
                    qty,
                    ordered,
                });
            });
        });

        // agregasi unik + total (hanya dari rows yang belum tuntas)
        const agg = <T extends string>(pick: (r: Row) => T | undefined) => {
            const map = new Map<string, { count: number; asked: number; ordered: number }>();
            rows.forEach((r) => {
                const key = (pick(r) || '').trim();
                if (!key) return;
                const cur = map.get(key) ?? { count: 0, asked: 0, ordered: 0 };
                map.set(key, {
                    count: cur.count + 1,
                    asked: cur.asked + r.qty,
                    ordered: cur.ordered + r.ordered,
                });
            });
            return Array.from(map.entries()).map(([name, v]) => ({ name, ...v }));
        };

        const projects = agg((r) => r.project);
        const costCenters = agg((r) => r.cost_center);
        const departments = agg((r) => r.department);

        // daftar MR unik (hanya MR dengan sisa > 0)
        const mrMap = new Map<string, { date?: string; status: string; asked: number; ordered: number }>();
        rows.forEach((r) => {
            const cur = mrMap.get(r.mrId) ?? { date: r.mrDate, status: r.mrStatus, asked: 0, ordered: 0 };
            mrMap.set(r.mrId, {
                date: cur.date || r.mrDate,
                status: r.mrStatus,
                asked: cur.asked + r.qty,
                ordered: cur.ordered + r.ordered,
            });
        });
        const mrIds = Array.from(mrMap.entries()).map(([id, v]) => ({ id, ...v }));

        return { mrRows: rows, projects, costCenters, departments, mrIds };
    }, [mrs, item]);

    // NEW: collect PO references (po_detail) for MR items that reference this item
    const poByMr = useMemo(() => {
        // result: Array<{ mrName: string, poEntries: Array<{po_name, transaction_date, supplier, qty, uom}> }>
        const out: { mrName: string; poEntries: any[] }[] = [];

        (mrs as MaterialRequest[]).forEach((mr) => {
            // find items matching the item code
            const matchedItems = (mr.items ?? []).filter(it => {
                if (!item?.id) return false;
                return (it.item_code ?? '').toLowerCase() === item.id.toLowerCase();
            });

            if (matchedItems.length === 0) return;

            // collect all po_detail entries from matched items (flatten)
            const entries: any[] = [];
            matchedItems.forEach(it => {
                const arr = Array.isArray((it as any).po_detail) ? (it as any).po_detail : [];
                arr.forEach((p: any) => {
                    // normalize minimal fields
                    entries.push({
                        po_name: p?.po_name ?? p?.name ?? '',
                        transaction_date: p?.transaction_date ?? p?.date ?? '',
                        supplier: p?.supplier ?? '',
                        qty: typeof p?.qty === 'number' ? p.qty : Number(p?.qty ?? 0),
                        uom: p?.uom ?? '',
                    });
                });
            });

            if (entries.length > 0) {
                out.push({ mrName: mr.name ?? '', poEntries: entries });
            }
        });

        return out;
    }, [mrs, item]);

    // Warehouse stock list: ambil dari `item.stock_warehouse` jika tersedia.
    // Filter qty > 0 dan urutkan desc.
    const warehouses = useMemo(() => {
        const raw = (item as any)?.stock_warehouse;
        if (!Array.isArray(raw) || raw.length === 0) return [];
        const list = raw
            .map((r: any) => ({
                warehouse: r?.warehouse ?? r?.name ?? '',
                qty: Number(r?.qty ?? 0),
            }))
            .filter((w: { qty: number }) => w.qty > 0)
            .sort((a: { qty: number }, b: { qty: number }) => b.qty - a.qty);
        return list;
    }, [item]);

    const handleMrClick = (orderName: string) => {
        const encodedName = encodeURIComponent(orderName);
        const url = `https://erpintidaya.jasaweb.co/app/material-request/${encodedName}`;
        window.open(url, '_blank');
    };

    const handlePoClick = (orderName: string) => {
        const encodedName = encodeURIComponent(orderName);
        const url = `https://erpintidaya.jasaweb.co/app/material-request/${encodedName}`;
        window.open(url, '_blank');
    };

    return (
        <AnimatePresence>
            {item && (
                <>
                    {/* backdrop */}
                    <motion.div
                        key="backdrop"
                        className="fixed inset-0 bg-black/40 z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        onClick={onClose}
                    />

                    {/* panel */}
                    <motion.div
                        key="panel"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                        className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white shadow-2xl overflow-y-auto rounded-l-2xl"
                    >
                        {/* header */}
                        <div className="flex items-center justify-between border-b px-6 py-4 bg-gradient-to-r from-sky-500 to-indigo-500 text-white">
                            <div className="min-w-0">
                                <h2 className="text-lg font-semibold leading-tight flex items-center gap-2 truncate">
                                    <Package className="h-5 w-5" />
                                    {item.name}
                                </h2>
                                <p className="text-xs opacity-90">{item.id}</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="rounded-full p-2 text-white hover:bg-white/20 transition"
                                aria-label="Close panel"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* body */}
                        <div className="p-6 space-y-6">
                            {/* Item info */}
                            <section>
                                <h3 className="text-sm font-medium text-slate-600 mb-1">Item Details</h3>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                    <div className="text-slate-500">Code</div>
                                    <div className="text-slate-800">{item.id}</div>

                                    <div className="text-slate-500">Name</div>
                                    <div className="text-slate-800">{item.name}</div>

                                    <div className="text-slate-500">UOM</div>
                                    <div className="text-slate-800">{(item as any).uom ?? '-'}</div>

                                    <div className="text-slate-500">Category</div>
                                    <div className="text-slate-800">{(item as any).category ?? '-'}</div>
                                </div>
                            </section>

                            {/* Warehouse Stock */}
                            <section>
                                <h3 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                                    <Office className="h-4 w-4" /> Warehouse Stock
                                </h3>

                                {warehouses.length === 0 ? (
                                    <p className="text-sm text-slate-500">No stock in warehouses.</p>
                                ) : (
                                    <Card className="p-3">
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {warehouses.map((w) => (
                                                <div
                                                    key={w.warehouse}
                                                    className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 bg-white"
                                                >
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-slate-800 truncate">{w.warehouse}</p>
                                                    </div>
                                                    <div className="text-sm font-semibold text-slate-700">
                                                        {w.qty.toLocaleString('id-ID')}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                )}
                            </section>

                            {/* Material Requests (filtered by asked > ordered) */}
                            <section>
                                <h3 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                                    <ClipboardList className="h-4 w-4" /> Material Requests
                                </h3>

                                {isLoading ? (
                                    <p className="text-sm text-slate-500">Loading…</p>
                                ) : error ? (
                                    <p className="text-sm text-rose-600">Gagal memuat data</p>
                                ) : mrIds.length === 0 ? (
                                    <p className="text-sm text-slate-500">Tidak ada MR terkait yang perlu ditampilkan.</p>
                                ) : (
                                    <Card className="p-3">
                                        <div className="space-y-2 max-h-52 overflow-y-auto">
                                            {mrIds.map((m) => (
                                                <div
                                                    key={m.id}
                                                    onClick={() => handleMrClick(m.id)}
                                                    className="flex items-start justify-between rounded-lg border border-slate-200 px-3 py-2 bg-white cursor-pointer hover:bg-slate-50 hover:border-sky-200 transition-colors duration-150"
                                                >
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-slate-800 truncate">{m.id}</p>

                                                        <div className="flex items-center gap-2 text-xs mt-1">
                                                            <div className="flex items-center gap-1 bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full ring-1 ring-sky-100">
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    className="h-3.5 w-3.5 text-sky-600"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                    strokeWidth={2}
                                                                >
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10m-12 8h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                                </svg>
                                                                <span className="font-medium">
                                                                    {m.date ? new Date(m.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                                                </span>
                                                            </div>

                                                            <Badge
                                                                variant="secondary"
                                                                className={
                                                                    (m.status || '').toLowerCase() === 'draft'
                                                                        ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                                                        : (m.status || '').toLowerCase() === 'pending'
                                                                            ? 'bg-red-100 text-red-700 border border-red-200'
                                                                            : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                                                }
                                                            >
                                                                {m.status}
                                                            </Badge>
                                                        </div>
                                                    </div>

                                                    {/* Kanan: angka Asked, Ordered */}
                                                    <div className="flex flex-col items-end gap-1 text-xs text-slate-700">
                                                        <Badge className="bg-sky-50 text-sky-700 ring-sky-200 text-[11px] px-2 py-0.5">
                                                            Asked {m.asked.toLocaleString('id-ID')}
                                                        </Badge>
                                                        <Badge className="bg-amber-50 text-amber-700 ring-amber-200 text-[11px] px-2 py-0.5">
                                                            Ordered {m.ordered.toLocaleString('id-ID')}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                )}
                            </section>

                            {/* NEW: PO details referencing these MRs */}
                            <section>
                                <h3 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                                    <svg className="h-4 w-4 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 7h18M3 12h18M3 17h18" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    Purchase Orders
                                </h3>

                                {isLoading ? (
                                    <p className="text-sm text-slate-500">Loading…</p>
                                ) : poByMr.length === 0 ? (
                                    <p className="text-sm text-slate-500">Belum ada PO (po_detail) yang terhubung ke MR ini.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {poByMr.map((entry) => (
                                            <Card key={entry.mrName} className="p-3">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-medium text-slate-800 truncate">{entry.mrName}</div>
                                                        <div className="text-xs text-slate-500">POs for this MR</div>
                                                    </div>
                                                </div>

                                                <div className="grid gap-2">
                                                    {entry.poEntries.map((p, i) => (
                                                        <div key={i} className="flex items-center justify-between rounded-md border border-slate-100 p-3 bg-white">
                                                            <div className="min-w-0">
                                                                <div className="text-sm font-medium text-slate-800 truncate">{p.po_name || '-'}</div>
                                                                <div className="text-xs text-slate-500 mt-0.5">
                                                                    {p.supplier ? `${p.supplier}` : 'No supplier'} • {p.transaction_date ? new Date(p.transaction_date).toLocaleDateString('id-ID') : '-'}
                                                                </div>
                                                            </div>

                                                            <div className="text-right">
                                                                <div className="text-sm font-semibold text-slate-700">{Number(p.qty ?? 0).toLocaleString('id-ID')}</div>
                                                                <div className="text-xs text-slate-500">{p.uom ?? ''}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </section>

                            {/* Projects */}
                            <section>
                                <h3 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                                    <Briefcase className="h-4 w-4" /> Projects
                                </h3>
                                {isLoading ? (
                                    <p className="text-sm text-slate-500">Loading…</p>
                                ) : projects.length === 0 ? (
                                    <p className="text-sm text-slate-500">Tidak ada data.</p>
                                ) : (
                                    <Card className="p-3">
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {projects.map((p) => (
                                                <div key={p.name} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 bg-white">
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-slate-800 truncate">{p.name}</p>
                                                        <p className="text-xs text-slate-500">{p.count} baris</p>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1 text-xs text-slate-700">
                                                        <span className="inline-flex items-center rounded-full bg-sky-50 text-sky-700 px-2 py-0.5 text-[11px] font-medium ring-1 ring-sky-200">
                                                            Asked {p.asked.toLocaleString('id-ID')}
                                                        </span>
                                                        <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 px-2 py-0.5 text-[11px] font-medium ring-1 ring-amber-200">
                                                            Ordered {p.ordered.toLocaleString('id-ID')}
                                                        </span>
                                                    </div>

                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                )}
                            </section>

                            {/* Cost Centers */}
                            <section>
                                <h3 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                                    <Office className="h-4 w-4" /> Cost Centers
                                </h3>
                                {isLoading ? (
                                    <p className="text-sm text-slate-500">Loading…</p>
                                ) : costCenters.length === 0 ? (
                                    <p className="text-sm text-slate-500">Tidak ada data.</p>
                                ) : (
                                    <Card className="p-3">
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {costCenters.map((c) => (
                                                <div
                                                    key={c.name}
                                                    className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 bg-white"
                                                >
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-slate-800 truncate">{c.name}</p>
                                                        <p className="text-xs text-slate-500">{c.count} baris</p>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1 text-xs text-slate-700">
                                                        <span className="inline-flex items-center rounded-full bg-sky-50 text-sky-700 px-2 py-0.5 text-[11px] font-medium ring-1 ring-sky-200">
                                                            Asked {c.asked.toLocaleString('id-ID')}
                                                        </span>
                                                        <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 px-2 py-0.5 text-[11px] font-medium ring-1 ring-amber-200">
                                                            Ordered {c.ordered.toLocaleString('id-ID')}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>

                                )}
                            </section>

                            {/* Departments */}
                            <section>
                                <h3 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                                    <Users className="h-4 w-4" /> Departments
                                </h3>
                                {isLoading ? (
                                    <p className="text-sm text-slate-500">Loading…</p>
                                ) : departments.length === 0 ? (
                                    <p className="text-sm text-slate-500">Tidak ada data.</p>
                                ) : (
                                    <Card className="p-3">
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {departments.map((d) => (
                                                <div
                                                    key={d.name}
                                                    className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 bg-white"
                                                >
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-slate-800 truncate">{d.name}</p>
                                                        <p className="text-xs text-slate-500">{d.count} baris</p>
                                                    </div>

                                                    <div className="flex flex-col items-end gap-1 text-xs text-slate-700">
                                                        <span className="inline-flex items-center rounded-full bg-sky-50 text-sky-700 px-2 py-0.5 text-[11px] font-medium ring-1 ring-sky-200">
                                                            Asked {d.asked.toLocaleString('id-ID')}
                                                        </span>
                                                        <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 px-2 py-0.5 text-[11px] font-medium ring-1 ring-amber-200">
                                                            Ordered {d.ordered.toLocaleString('id-ID')}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>

                                )}
                            </section>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
