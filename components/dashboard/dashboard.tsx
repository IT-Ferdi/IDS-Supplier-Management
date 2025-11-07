// components/dashboard/dashboard.tsx
'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import DashboardTable from '@/components/dashboard/dashboard-table';
import { useItems } from '@/hooks/useItemData';
import { useMaterialRequestData } from '@/hooks/useMaterialRequestData';
import type { ItemRow } from '@/types/item';
import type { MaterialRequest, MaterialRequestItem } from '@/types/material-request';

type Row = {
    id: string;
    name: string;
    category: string;
    asked: number;
    ordered: number;
    received: number;
    shortage: number;
};

export default function Dashboard() {
    const { data: items = [], isLoading: loadingItems } = useItems();
    const [onlyNeeded, setOnlyNeeded] = useState(true);
    const { data: mrs = [], isLoading: loadingMr } = useMaterialRequestData();

    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 4;

    const aggByItem = useMemo(() => {
        const ALLOWED = new Set(['draft', 'partially ordered']);
        const map = new Map<string, { asked: number; ordered: number; received: number }>();

        const add = (code: string, d: { asked?: number; ordered?: number; received?: number }) => {
            if (!code) return;
            const cur = map.get(code) ?? { asked: 0, ordered: 0, received: 0 };
            map.set(code, {
                asked: cur.asked + (d.asked ?? 0),
                ordered: cur.ordered + (d.ordered ?? 0),
                received: cur.received + (d.received ?? 0),
            });
        };

        (mrs as MaterialRequest[]).forEach((mr) => {
            const st = (mr.status ?? '').toLowerCase();
            if (!ALLOWED.has(st)) return;

            (mr.items ?? []).forEach((it: MaterialRequestItem) => {
                const code = it.item_code ?? '';
                const qty = Number(it.qty ?? 0);
                const ordered = Number(it.ordered_qty ?? 0);
                const received = Number(it.received_qty ?? 0);

                if (st === 'draft') add(code, { asked: qty });
                else add(code, { asked: qty, ordered, received });
            });
        });

        return map;
    }, [mrs]);

    const rows: Row[] = useMemo(() => {
        return (items as ItemRow[]).map((it) => {
            const agg = aggByItem.get(it.id) ?? { asked: 0, ordered: 0, received: 0 };
            const shortage =
                agg.ordered === 0 && agg.received === 0
                    ? Math.max(0, agg.asked)
                    : Math.max(0, agg.ordered - agg.received);

            return {
                id: it.id,
                name: it.name,
                category: it.category ?? '-',
                asked: agg.asked,
                ordered: agg.ordered,
                received: agg.received,
                shortage,
            };
        });
    }, [items, aggByItem]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        let base = rows;
        if (q) {
            base = base.filter(r => r.id.toLowerCase().includes(q) || r.name.toLowerCase().includes(q));
        }
        // tampilkan hanya yang shortage > 0 bila onlyNeeded true
        return onlyNeeded ? base.filter(r => r.shortage > 0) : base;
    }, [rows, query, onlyNeeded]);

    const total = filtered.length;
    const paged = filtered.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

    const loading = loadingItems || loadingMr;

    const Badge = ({ children, cls }: { children: React.ReactNode; cls: string }) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${cls}`}>
            {children}
        </span>
    );

    return (
        <div className="p-4 space-y-5">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                    <p className="mt-1 text-sm text-slate-500">Kebutuhan item dari Material Request (Draft dan Partially Ordered).</p>
                </div>

                <label className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                        placeholder="Cari ID atau Nama Item…"
                        className="w-[22rem] max-w-[92vw] rounded-2xl border border-slate-300 bg-white px-10 py-2 text-sm shadow-sm outline-none transition focus:ring-2 focus:ring-sky-300"
                    />
                </label>
            </div>

            <DashboardTable<Row>
                columns={[
                    { key: 'id', header: 'Code', className: 'font-mono' },
                    { key: 'name', header: 'Name' },
                    { key: 'category', header: 'Category' },
                    {
                        key: 'asked',
                        header: 'Qty Asked',
                        className: 'text-right',
                        render: (r) => (
                            <Badge cls="bg-sky-50 text-sky-700 ring-sky-200">
                                {r.asked.toLocaleString('id-ID')}
                            </Badge>
                        ),
                    },
                    {
                        key: 'ordered',
                        header: 'Qty Ordered',
                        className: 'text-right',
                        render: (r) => (
                            <Badge cls="bg-amber-50 text-amber-700 ring-amber-200">
                                {r.ordered.toLocaleString('id-ID')}
                            </Badge>
                        ),
                    },
                    {
                        key: 'received',
                        header: 'Qty Received',
                        className: 'text-right',
                        render: (r) => (
                            <Badge cls="bg-emerald-50 text-emerald-700 ring-emerald-200">
                                {r.received.toLocaleString('id-ID')}
                            </Badge>
                        ),
                    },
                    {
                        key: 'shortage',
                        header: 'Needed',
                        className: 'text-right',
                        render: (r) => (
                            <Badge cls={r.shortage > 0 ? 'bg-rose-50 text-rose-700 ring-rose-200' : 'bg-slate-50 text-slate-600 ring-slate-200'}>
                                {r.shortage.toLocaleString('id-ID')}
                            </Badge>
                        ),
                    },
                ]}
                data={paged}
                loading={loading}
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={setPage}
            />
        </div>
    );
}
