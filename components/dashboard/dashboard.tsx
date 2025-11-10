// components/dashboard/dashboard.tsx
'use client';

import { useMemo, useState, useEffect } from 'react';
import DashboardTable from '@/components/dashboard/dashboard-table';
import { useItems } from '@/hooks/useItemData';
import { useMaterialRequestData } from '@/hooks/useMaterialRequestData';
import { useTransactionData } from '@/hooks/useTransactionData';
import type { ItemRow } from '@/types/item';
import type { MaterialRequest, MaterialRequestItem } from '@/types/material-request';
import DashboardSummary from '@/components/dashboard/dashboard-summary';
import ItemNeedPanel from '@/components/ui/item-demand-panel';
import ProjectPie from '@/components/dashboard/project-chart';
import DepartmentChart from '@/components/dashboard/department-chart';
import { useMaterialRequestDepartmentSummary } from '@/hooks/useMaterialRequestData';

type Row = {
    id: string;
    name: string;
    category: string;
    uom?: string;
    asked: number;
    ordered: number;
    received: number;
    shortage: number;
    lastSupplier?: { id?: string; name?: string; date?: string } | null;
};

export default function Dashboard() {
    const { data: items = [], isLoading: loadingItems } = useItems();
    const { data: mrs = [], isLoading: loadingMr } = useMaterialRequestData();
    const { data: deptData, total, isLoading } = useMaterialRequestDepartmentSummary();
    const { data: transactions = [] } = useTransactionData();

    const [page, setPage] = useState(1);
    const pageSize = 4;

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

    // last purchase per item (dari transaksi)
    const lastPurchaseByItem = useMemo(() => {
        const map = new Map<string, { supplier_id?: string; supplier_name?: string; date?: string }>();
        (transactions || []).forEach((tx) => {
            const txDate = tx.transaction_date;
            if (!txDate) return;
            (tx.items || []).forEach((it) => {
                const code = (it.item_code || '').toString();
                if (!code) return;
                const cur = map.get(code);
                const curTime = cur?.date ? new Date(cur.date).getTime() : 0;
                const thisTime = new Date(txDate).getTime();
                if (!cur || thisTime > curTime) {
                    map.set(code, {
                        supplier_id: tx.supplier ?? '',
                        supplier_name: tx.supplier_name ?? '',
                        date: txDate,
                    });
                }
            });
        });
        return map;
    }, [transactions]);

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

    // bentuk baris tabel
    const rows: Row[] = useMemo(() => {
        return (items as ItemRow[]).map((it) => {
            const agg = aggByItem.get(it.id) ?? { asked: 0, ordered: 0, received: 0 };
            const shortage = agg.ordered === 0 && agg.received === 0 ? Math.max(0, agg.asked) : Math.max(0, agg.ordered - agg.received);
            const last = lastPurchaseByItem.get(it.id) ?? null;
            return {
                id: it.id,
                name: it.name,
                category: it.category ?? '-',
                uom: it.uom ?? '-',
                asked: agg.asked,
                ordered: agg.ordered,
                received: agg.received,
                shortage,
                lastSupplier: last ? { id: last.supplier_id, name: last.supplier_name, date: last.date } : null,
            };
        });
    }, [items, aggByItem, lastPurchaseByItem]);

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

    // paging — gunakan nama berbeda supaya tidak bentrok
    const totalRows = filtered.length;
    const paged = filtered.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);
    const loading = loadingItems || loadingMr;

    const Badge = ({ children, cls }: { children: React.ReactNode; cls: string }) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${cls}`}>{children}</span>
    );

    // Summary values: latest MR date, nearest required_by, counts
    const { latestDate, nearestRequiredBy, totalMR, draftCount, partiallyOrderedCount } = useMemo(() => {
        let latest: string | null = null;
        const requiredDates: string[] = [];
        let total = 0;
        let draft = 0;
        let partial = 0;

        (mrs as MaterialRequest[]).forEach((mr) => {
            const txDate = mr.transaction_date;
            if (txDate) {
                if (!latest || new Date(txDate) > new Date(latest)) latest = txDate;
            }
            const req = mr.required_by;
            if (req) requiredDates.push(req);
            const st = (mr.status ?? '').toLowerCase();
            total++;
            if (st === 'draft') draft++;
            if (st === 'partially ordered') partial++;
        });

        // nearest required by: pilih tanggal yang >= hari ini terkecil. kalau tidak ada, ambil earliest.
        const today = new Date();
        const sortedReq = requiredDates
            .map((d) => ({ raw: d, time: new Date(d).getTime() }))
            .sort((a, b) => a.time - b.time);
        const future = sortedReq.find((s) => s.time >= new Date(today.toDateString()).getTime());
        const nearest = future ? future.raw : (sortedReq[0]?.raw ?? null);

        return {
            latestDate: latest,
            nearestRequiredBy: nearest,
            totalMR: total,
            draftCount: draft,
            partiallyOrderedCount: partial,
        };
    }, [mrs]);

    return (
        <div className="p-2 space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-semibold">Dashboard</h1>
                </div>
            </div>

            <DashboardSummary
                latestDate={latestDate ?? undefined}
                nearestRequiredBy={nearestRequiredBy ?? undefined}
                totalMR={totalMR}
                draftCount={draftCount}
                partiallyOrderedCount={partiallyOrderedCount}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {!isLoading && deptData && deptData.length > 0 ? (
                    <DepartmentChart
                        chartData={deptData}
                        height={300}
                    />
                ) : (
                    <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 flex items-center justify-center">
                        Loading department data...
                    </div>
                )}
            </div>

            <div className="pt-1">
                <DashboardTable<Row>
                    columns={[
                        { key: 'id', header: 'Code', width: '120px', className: 'font-mono' },
                        { key: 'name', header: 'Name', width: '260px' },
                        { key: 'category', header: 'Category', width: '160px' },
                        { key: 'uom', header: 'UOM', width: '80px', className: 'text-center' },
                        { key: 'asked', header: 'Qty Asked', width: '100px', className: 'text-right', render: (r) => <Badge cls="bg-sky-50 text-sky-700 ring-sky-200">{r.asked.toLocaleString('id-ID')}</Badge> },
                        { key: 'ordered', header: 'Qty Ordered', width: '100px', className: 'text-right', render: (r) => <Badge cls="bg-amber-50 text-amber-700 ring-amber-200">{r.ordered.toLocaleString('id-ID')}</Badge> },
                        { key: 'received', header: 'Qty Received', width: '100px', className: 'text-right', render: (r) => <Badge cls="bg-emerald-50 text-emerald-700 ring-emerald-200">{r.received.toLocaleString('id-ID')}</Badge> },
                        { key: 'shortage', header: 'Needed', width: '100px', className: 'text-right', render: (r) => <Badge cls={r.shortage > 0 ? 'bg-rose-50 text-rose-700 ring-rose-200' : 'bg-slate-50 text-slate-600 ring-slate-200'}>{r.shortage.toLocaleString('id-ID')}</Badge> },
                        {
                            key: 'lastSupplier', header: 'Last Purchased From', width: '220px', render: (r) => {
                                const s = r.lastSupplier;
                                if (!s) return <span className="text-slate-500">-</span>;
                                return (
                                    <div className="text-right">
                                        <div className="truncate" title={s.name || ''}>{s.name || s.id}</div>
                                        <div className="text-xs text-slate-400 mt-0.5">{s.date ? new Date(s.date).toLocaleDateString('id-ID') : ''}</div>
                                    </div>
                                );
                            }
                        }
                    ]}
                    data={paged}
                    loading={loading}
                    page={page}
                    pageSize={pageSize}
                    total={totalRows}
                    onPageChange={setPage}
                    searchId={searchId}
                    searchName={searchName}
                    onSearchIdChange={setSearchId}
                    onSearchNameChange={setSearchName}
                    rightActions={
                        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-2 focus:ring-sky-300" checked={onlyNeeded} onChange={(e) => setOnlyNeeded(e.target.checked)} />
                            Only Needed
                        </label>
                    }
                    onRowClick={(row) => setOpenItemId((row as Row).id)}
                />
            </div>

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
