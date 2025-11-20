// components/ui/item-demand-panel.tsx
'use client';

import React, { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Package, ClipboardList, Briefcase, Building2 as Office, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ItemRow } from '@/types/item';
import { useFilteredMaterialRequests } from '@/hooks/useMaterialRequestData';
import type { MaterialRequest, MaterialRequestItem } from '@/types/material-request';

type Props = {
    item: ItemRow | null;
    onClose: () => void;
    filters?: {
        selectedStatus?: string | null;
        selectedDept?: string | null;
        selectedBranch?: string | null;
        selectedProject?: string | null;
        selectedType?: string | null;
        mrStart?: string | null;
        mrEnd?: string | null;
        reqStart?: string | null;
        reqEnd?: string | null;
    };
};

export default function ItemDemandPanel({ item, onClose, filters }: Props) {
    // default statuses same as dashboard behavior
    const defaultStatuses = ['draft', 'partially ordered', 'pending'];
    const selectedStatusParam = (filters && filters.selectedStatus) ? filters.selectedStatus : defaultStatuses;

    const { filtered: filteredMRs = [], isLoading, error } = useFilteredMaterialRequests({
        selectedStatus: selectedStatusParam,
        selectedDepartment: filters?.selectedDept ?? null,
        selectedBranch: filters?.selectedBranch ?? null,
        selectedProject: filters?.selectedProject ?? null,
        selectedType: (filters?.selectedType as any) ?? null,
        start_date: filters?.mrStart ?? null,
        end_date: filters?.mrEnd ?? null,
        required_start: filters?.reqStart ?? null,
        required_end: filters?.reqEnd ?? null,
    });

    // Build rows: only MR items that match the selected item.id and outstanding (qty > qty_total_po)
    const { mrRows, projects, costCenters, departments, mrIds } = useMemo(() => {
        type Row = {
            mrId: string;
            mrDate?: string;
            mrStatus: string;
            project?: string;
            cost_center?: string;
            department?: string;
            qty: number;
            ordered: number; // qty_total_po (fallback ordered_qty)
        };

        const rows: Row[] = [];

        (filteredMRs as MaterialRequest[]).forEach((mr) => {
            (mr.items ?? []).forEach((it: MaterialRequestItem) => {
                if (!item?.id) return;
                if ((it.item_code ?? '').toLowerCase() !== item.id.toLowerCase()) return;

                const qty = Number(it.qty ?? 0);
                const totPo = Number(it.qty_total_po ?? it.ordered_qty ?? 0);

                // skip if already satisfied
                if (qty <= totPo) return;

                rows.push({
                    mrId: mr.name ?? '',
                    mrDate: mr.required_by,
                    mrStatus: mr.status ?? '-',
                    project: it.project ?? '',
                    cost_center: it.cost_center ?? '',
                    department: it.department ?? '',
                    qty,
                    ordered: totPo,
                });
            });
        });

        // aggregations
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

        const projects = agg(r => r.project);
        const costCenters = agg(r => r.cost_center);
        const departments = agg(r => r.department);

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
    }, [filteredMRs, item]);

    // Build PO entries referencing this MR/item (for PO section)
    const poEntries = useMemo(() => {
        const list: {
            mr_name: string;
            item_code: string;
            po_details: Array<{ po_name?: string; transaction_date?: string; supplier?: string; qty?: number; uom?: string }>;
        }[] = [];

        (filteredMRs as MaterialRequest[]).forEach((mr) => {
            (mr.items ?? []).forEach((it: MaterialRequestItem) => {
                if (!item?.id) return;
                if ((it.item_code ?? '').toLowerCase() !== item.id.toLowerCase()) return;

                // normalize po_detail to array
                const arr = Array.isArray(it.po_detail) ? it.po_detail : (it.po_detail ? [it.po_detail] : []);
                // only include if there is at least one po_detail entry
                if (arr.length === 0) return;

                list.push({
                    mr_name: mr.name ?? '',
                    item_code: it.item_code ?? '',
                    po_details: arr.map(pd => ({
                        po_name: pd?.po_name,
                        transaction_date: pd?.transaction_date,
                        supplier: pd?.supplier,
                        qty: typeof pd?.qty === 'number' ? pd.qty : Number(pd?.qty ?? 0),
                        uom: pd?.uom,
                    })),
                });
            });
        });

        return list;
    }, [filteredMRs, item]);

    // Warehouse stock (unchanged)
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
        const url = `https://erpintidaya.jasaweb.co/app/purchase-order/${encodedName}`;
        window.open(url, '_blank');
    };

    return (
        <AnimatePresence>
            {item && (
                <>
                    <motion.div
                        key="backdrop"
                        className="fixed inset-0 bg-black/40 z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        onClick={onClose}
                    />

                    <motion.div
                        key="panel"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                        className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white shadow-2xl overflow-y-auto rounded-l-2xl"
                    >
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

                            {/* Material Requests */}
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
                                                    className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 bg-white cursor-pointer 
             hover:bg-slate-50 hover:border-sky-200 transition-colors duration-150"
                                                >
                                                    <div className="flex items-start justify-between w-full">
                                                        <div className="min-w-0">
                                                            <p className="font-medium text-slate-800 truncate">{m.id}</p>
                                                            <div className="flex items-center gap-2 text-xs mt-1">
                                                                <div className="flex items-center gap-1 bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full ring-1 ring-sky-100">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10m-12 8h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                                    </svg>
                                                                    <span className="font-medium">{m.date ? new Date(m.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</span>
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

                                                        <div className="flex flex-col items-end gap-1 text-xs text-slate-700">
                                                            <Badge className="bg-sky-50 text-sky-700 ring-sky-200 text-[11px] px-2 py-0.5">Asked {m.asked.toLocaleString('id-ID')}</Badge>
                                                            <Badge className="bg-amber-50 text-amber-700 ring-amber-200 text-[11px] px-2 py-0.5">Ordered {m.ordered.toLocaleString('id-ID')}</Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                )}
                            </section>

                            {/* PO Section: show po_details referencing this MR/item */}
                            <section>
                                <h3 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 7h18M3 12h18M3 17h18" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    Purchase Orders
                                </h3>

                                {poEntries.length === 0 ? (
                                    <p className="text-sm text-slate-500">No PO recorded for this item within the current filters.</p>
                                ) : (
                                    <Card className="p-3">
                                        <div className="space-y-3 max-h-56 overflow-auto">
                                            {poEntries.map((pe, idx) => (
                                                <div key={`${pe.mr_name}-${pe.item_code}-${idx}`} className="rounded-md border p-3 bg-white">
                                                    <div className="flex items-center justify-between">
                                                        <div className="min-w-0">
                                                            <div className="font-medium text-slate-800 truncate">{pe.mr_name}</div>
                                                            <div className="text-xs text-slate-500 mt-0.5">{pe.item_code}</div>
                                                        </div>
                                                        <div className="text-xs text-slate-500">{pe.po_details.length} PO(s)</div>
                                                    </div>

                                                    <div className="mt-3 grid gap-2">
                                                        {pe.po_details.map((pd, i) => (
                                                            <div key={i} 
                                                            className="flex items-center justify-between gap-4 p-3 rounded-md border bg-slate-50 cursor-pointer hover:brightness-95 hover:border-sky-200 transition-all duration-150"
                                                                onClick={() => handlePoClick(pd.po_name ?? '')}>
                                                                <div className="min-w-0">
                                                                    <div className="text-sm font-medium text-slate-800 truncate">{pd.po_name ?? '-'}</div>
                                                                    <div className="text-xs text-slate-500 mt-0.5">
                                                                        {pd.supplier ? `${pd.supplier} • ` : ''}{pd.transaction_date ? new Date(pd.transaction_date).toLocaleDateString('id-ID') : '-'}
                                                                    </div>
                                                                </div>

                                                                <div className="text-right">
                                                                    <div className="text-sm font-semibold text-slate-800">{(pd.qty ?? 0).toLocaleString('id-ID')}</div>
                                                                    <div className="text-xs text-slate-500 mt-0.5">{pd.uom ?? ''}</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                )}
                            </section>

                            {/* Projects, Cost Centers, Departments (unchanged) */}
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

                            <section>
                                <h3 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                                    <Office className="h-4 w-4" /> Cost Centers
                                </h3>
                                {isLoading ? <p className="text-sm text-slate-500">Loading…</p> : costCenters.length === 0 ? <p className="text-sm text-slate-500">Tidak ada data.</p> :
                                    <Card className="p-3"><div className="space-y-2 max-h-40 overflow-y-auto">{costCenters.map((c) => (
                                        <div key={c.name} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 bg-white">
                                            <div className="min-w-0"><p className="font-medium text-slate-800 truncate">{c.name}</p><p className="text-xs text-slate-500">{c.count} baris</p></div>
                                            <div className="flex flex-col items-end gap-1 text-xs text-slate-700">
                                                <span className="inline-flex items-center rounded-full bg-sky-50 text-sky-700 px-2 py-0.5 text-[11px] font-medium ring-1 ring-sky-200">Asked {c.asked.toLocaleString('id-ID')}</span>
                                                <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 px-2 py-0.5 text-[11px] font-medium ring-1 ring-amber-200">Ordered {c.ordered.toLocaleString('id-ID')}</span>
                                            </div>
                                        </div>
                                    ))}</div></Card>}
                            </section>

                            <section>
                                <h3 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                                    <Users className="h-4 w-4" /> Departments
                                </h3>
                                {isLoading ? <p className="text-sm text-slate-500">Loading…</p> : departments.length === 0 ? <p className="text-sm text-slate-500">Tidak ada data.</p> :
                                    <Card className="p-3"><div className="space-y-2 max-h-40 overflow-y-auto">{departments.map((d) => (
                                        <div key={d.name} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 bg-white">
                                            <div className="min-w-0"><p className="font-medium text-slate-800 truncate">{d.name}</p><p className="text-xs text-slate-500">{d.count} baris</p></div>
                                            <div className="flex flex-col items-end gap-1 text-xs text-slate-700">
                                                <span className="inline-flex items-center rounded-full bg-sky-50 text-sky-700 px-2 py-0.5 text-[11px] font-medium ring-1 ring-sky-200">Asked {d.asked.toLocaleString('id-ID')}</span>
                                                <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 px-2 py-0.5 text-[11px] font-medium ring-1 ring-amber-200">Ordered {d.ordered.toLocaleString('id-ID')}</span>
                                            </div>
                                        </div>
                                    ))}</div></Card>}
                            </section>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
