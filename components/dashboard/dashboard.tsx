// components/dashboard/dashboard.tsx
'use client';

import { useMemo, useState, useEffect } from 'react';
import DashboardTable from '@/components/dashboard/dashboard-table';
import { useItems } from '@/hooks/useItemData';
import { useMaterialRequestData } from '@/hooks/useMaterialRequestData';
import type { ItemRow } from '@/types/item';
import type { MaterialRequest, MaterialRequestItem } from '@/types/material-request';
import ItemNeedPanel from '@/components/ui/item-demand-panel';

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
    const { data: mrs = [], isLoading: loadingMr } = useMaterialRequestData();

    const [page, setPage] = useState(1);
    const pageSize = 10;

    // filter
    const [searchId, setSearchId] = useState('');
    const [searchName, setSearchName] = useState('');
    const [onlyNeeded, setOnlyNeeded] = useState(true);

    // panel
    const [openItemId, setOpenItemId] = useState<string | null>(null);
    const selectedItem = openItemId ? (items as ItemRow[]).find((it) => it.id === openItemId) ?? null : null;

    // reset page jika filter berubah
    useEffect(() => {
        setPage(1);
    }, [searchId, searchName, onlyNeeded]);

    // agregasi MR (Draft + Partially Ordered)
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

    // bentuk baris
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

    // filter + onlyNeeded
    const filtered = useMemo(() => {
        const idQ = searchId.trim().toLowerCase();
        const nameQ = searchName.trim().toLowerCase();

        let base = rows;

        if (idQ) base = base.filter((r) => r.id.toLowerCase().includes(idQ));
        if (nameQ) base = base.filter((r) => r.name.toLowerCase().includes(nameQ));
        if (onlyNeeded) base = base.filter((r) => r.shortage > 0);

        return base;
    }, [rows, searchId, searchName, onlyNeeded]);

    // paging
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
                    <p className="mt-1 text-sm text-slate-500">
                        Kebutuhan item dari Material Request (Draft dan Partially Ordered).
                    </p>
                </div>
            </div>

            <DashboardTable<Row>
                // kolom
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
                            <Badge
                                cls={
                                    r.shortage > 0
                                        ? 'bg-rose-50 text-rose-700 ring-rose-200'
                                        : 'bg-slate-50 text-slate-600 ring-slate-200'
                                }
                            >
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
                // built-in dual search di toolbar table
                searchId={searchId}
                searchName={searchName}
                onSearchIdChange={setSearchId}
                onSearchNameChange={setSearchName}
                searchIdPlaceholder="Cari Item ID…"
                searchNamePlaceholder="Cari Item Name…"
                // toggle onlyNeeded di sisi kanan toolbar
                rightActions={
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                        <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-2 focus:ring-sky-300"
                            checked={onlyNeeded}
                            onChange={(e) => setOnlyNeeded(e.target.checked)}
                        />
                        Only Needed
                    </label>
                }
                // klik baris -> buka panel
                onRowClick={(row) => setOpenItemId((row as Row).id)}
            />

            {/* Panel detail kebutuhan item per-MR */}
            {openItemId ? (
                <ItemNeedPanel
                    item={selectedItem}
                    onClose={() => setOpenItemId(null)}
                />
            ) : null}
        </div>
    );
}
