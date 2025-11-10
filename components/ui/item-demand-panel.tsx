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
        const ALLOWED = new Set(['draft', 'partially ordered']);

        type Row = {
            mrId: string;
            mrDate?: string;
            mrStatus: string;
            project?: string;
            cost_center?: string;
            department?: string;
            qty: number;
            ordered_qty: number;
            received_qty: number;
        };

        const rows: Row[] = [];

        (mrs as MaterialRequest[]).forEach((mr) => {
            const st = (mr.status ?? '').toLowerCase();
            if (!ALLOWED.has(st)) return;

            (mr.items ?? []).forEach((it: MaterialRequestItem) => {
                if (!item?.id) return;
                if ((it.item_code ?? '').toLowerCase() !== item.id.toLowerCase()) return;

                rows.push({
                    mrId: mr.name ?? '',
                    mrDate: mr.transaction_date,
                    mrStatus: mr.status ?? '-',
                    project: it.project ?? '',
                    cost_center: it.cost_center ?? '',
                    department: it.department ?? '',
                    qty: Number(it.qty ?? 0),
                    ordered_qty: Number(it.ordered_qty ?? 0),
                    received_qty: Number(it.received_qty ?? 0),
                });
            });
        });

        // agregasi unik + total
        const agg = <T extends string>(pick: (r: Row) => T | undefined) => {
            const map = new Map<
                string,
                { count: number; asked: number; ordered: number; received: number }
            >();
            rows.forEach((r) => {
                const key = (pick(r) || '').trim();
                if (!key) return;
                const cur = map.get(key) ?? { count: 0, asked: 0, ordered: 0, received: 0 };
                map.set(key, {
                    count: cur.count + 1,
                    asked: cur.asked + r.qty,
                    ordered: cur.ordered + r.ordered_qty,
                    received: cur.received + r.received_qty,
                });
            });
            return Array.from(map.entries()).map(([name, v]) => ({ name, ...v }));
        };

        const projects = agg((r) => r.project);
        const costCenters = agg((r) => r.cost_center);
        const departments = agg((r) => r.department);

        // daftar MR unik
        const mrMap = new Map<string, { date?: string; status: string; asked: number; ordered: number; received: number }>();
        rows.forEach((r) => {
            const cur = mrMap.get(r.mrId) ?? { date: r.mrDate, status: r.mrStatus, asked: 0, ordered: 0, received: 0 };
            mrMap.set(r.mrId, {
                date: cur.date || r.mrDate,
                status: r.mrStatus,
                asked: cur.asked + r.qty,
                ordered: cur.ordered + r.ordered_qty,
                received: cur.received + r.received_qty,
            });
        });
        const mrIds = Array.from(mrMap.entries()).map(([id, v]) => ({ id, ...v }));

        return { mrRows: rows, projects, costCenters, departments, mrIds };
    }, [mrs, item]);

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
                                    <div className="text-slate-800">{item.uom ?? '-'}</div>

                                    <div className="text-slate-500">Category</div>
                                    <div className="text-slate-800">{item.category ?? '-'}</div>
                                </div>
                            </section>

                            {/* MR IDs */}
                            <section>
                                <h3 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                                    <ClipboardList className="h-4 w-4" /> Material Requests
                                </h3>

                                {isLoading ? (
                                    <p className="text-sm text-slate-500">Loading…</p>
                                ) : error ? (
                                    <p className="text-sm text-rose-600">Gagal memuat data</p>
                                ) : mrIds.length === 0 ? (
                                    <p className="text-sm text-slate-500">Tidak ada MR terkait.</p>
                                ) : (
                                    <Card className="p-3">
                                        <div className="space-y-2 max-h-52 overflow-y-auto">
                                            {mrIds.map((m) => (
                                                <div key={m.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 bg-white">
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-slate-800 truncate">{m.id}</p>
                                                        <p className="text-xs text-slate-500">
                                                            {m.date ? new Date(m.date).toLocaleDateString('id-ID') : '-'}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <Badge
                                                            variant="secondary"
                                                            className={
                                                                (m.status || '').toLowerCase() === 'draft'
                                                                    ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                                                    : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                                            }
                                                        >
                                                            {m.status}
                                                        </Badge>
                                                        <div className="mt-1 text-[11px] text-slate-600">
                                                            Asked {m.asked.toLocaleString('id-ID')} • Ordered {m.ordered.toLocaleString('id-ID')} • Recv {m.received.toLocaleString('id-ID')}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
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
                                                    <div className="text-right text-xs text-slate-700">
                                                        <div>Asked {p.asked.toLocaleString('id-ID')}</div>
                                                        <div>Ordered {p.ordered.toLocaleString('id-ID')}</div>
                                                        <div>Recv {p.received.toLocaleString('id-ID')}</div>
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
                                                <div key={c.name} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 bg-white">
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-slate-800 truncate">{c.name}</p>
                                                        <p className="text-xs text-slate-500">{c.count} baris</p>
                                                    </div>
                                                    <div className="text-right text-xs text-slate-700">
                                                        <div>Asked {c.asked.toLocaleString('id-ID')}</div>
                                                        <div>Ordered {c.ordered.toLocaleString('id-ID')}</div>
                                                        <div>Recv {c.received.toLocaleString('id-ID')}</div>
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
                                                <div key={d.name} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 bg-white">
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-slate-800 truncate">{d.name}</p>
                                                        <p className="text-xs text-slate-500">{d.count} baris</p>
                                                    </div>
                                                    <div className="text-right text-xs text-slate-700">
                                                        <div>Asked {d.asked.toLocaleString('id-ID')}</div>
                                                        <div>Ordered {d.ordered.toLocaleString('id-ID')}</div>
                                                        <div>Recv {d.received.toLocaleString('id-ID')}</div>
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
