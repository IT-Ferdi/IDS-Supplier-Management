'use client';

import { useMemo, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import DashboardTable from '@/components/dashboard/dashboard-table';
import { useItems } from '@/hooks/useItemData';
import {
    useMaterialRequestData,
    useMaterialRequestSummary,
    useMaterialRequestDepartmentSummary,
    useFilteredMaterialRequests,
    useMaterialRequestBranchSummary,
    useMaterialRequestProjectList,
    useMaterialRequestTypeSummary,
    useMaterialRequestDateRange,
} from '@/hooks/useMaterialRequestData';
import { useTransactionData } from '@/hooks/useTransactionData';
import type { ItemRow } from '@/types/item';
import type { MaterialRequest, MaterialRequestItem } from '@/types/material-request';
import DashboardSummary from '@/components/dashboard/dashboard-summary';
import ItemNeedPanel from '@/components/ui/item-demand-panel';
import DepartmentChart from '@/components/dashboard/department-chart';
import BranchList from '@/components/dashboard/branch-list';
import DateRangeInputs from '@/components/ui/date-range-inputs';

type Row = {
    id: string;
    name: string;
    total_stock: number;
    asked: number;
    received: number;
    uom?: string | null;
    lastSupplier?: { id?: string; name?: string; date?: string } | null;
};

type MRType = 'Project' | 'Operational' | 'Stock' | 'Lain-lain';

export default function Dashboard() {
    const queryClient = useQueryClient();

    // interactive filters
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [selectedDept, setSelectedDept] = useState<string | null>(null);
    const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
    const [selectedProject, setSelectedProject] = useState<string | null>(null);

    // date range
    const [startDateLocal, setStartDateLocal] = useState<string | null>(null);
    const [endDateLocal, setEndDateLocal] = useState<string | null>(null);

    // supplier filter (single)
    const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

    // type filter
    const [selectedType, setSelectedType] = useState<MRType | null>(null);

    const { data: items = [], isLoading: loadingItems } = useItems();
    const { data: mrs = [], isLoading: loadingMr } = useMaterialRequestData();

    const { minDate: hookMinDate, maxDate: hookMaxDate, isLoading: loadingDateRange } = useMaterialRequestDateRange({
        selectedStatus,
        selectedBranch,
        selectedProject,
        selectedType,
        selectedDepartment: selectedDept,
        date_field: 'required_by',
    });

    useEffect(() => {
        if (startDateLocal !== null || endDateLocal !== null) return;
        if (loadingDateRange) return;
        if (!hookMinDate && !hookMaxDate) return;

        setStartDateLocal(hookMinDate ?? null);
        setEndDateLocal(hookMaxDate ?? null);
    }, [loadingDateRange, hookMinDate, hookMaxDate, startDateLocal, endDateLocal]);

    useEffect(() => {
        setStartDateLocal(null);
        setEndDateLocal(null);
    }, [selectedStatus, selectedBranch, selectedProject, selectedType, selectedDept]);

    const { data: transactions = [] } = useTransactionData();

    // build supplier list from transactions
    const supplierList = useMemo(() => {
        const map = new Map<string, string>();
        (transactions || []).forEach(tx => {
            const id = (tx.supplier ?? '').toString();
            const name = (tx.supplier_name ?? '').toString();
            const key = id || name;
            if (!key) return;
            if (!map.has(key)) map.set(key, name || key);
        });
        return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    }, [transactions]);

    // project list
    const { projects: projectList = [] } = useMaterialRequestProjectList({
        selectedStatus,
        selectedBranch,
        selectedType,
        start_date: startDateLocal,
        end_date: endDateLocal,
    });

    const { data: typeData = [] } = useMaterialRequestTypeSummary({
        selectedStatus,
        selectedBranch,
        selectedProject,
        selectedType,
        start_date: startDateLocal,
        end_date: endDateLocal,
    });

    const { data: branchData = [], total: branchTotal = 0 } =
        useMaterialRequestBranchSummary({ selectedStatus, selectedProject, selectedType, start_date: startDateLocal, end_date: endDateLocal });

    // paging state
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState<number>(10);

    // table filters
    const [searchId, setSearchId] = useState('');
    const [searchName, setSearchName] = useState('');
    const [onlyNeeded, setOnlyNeeded] = useState(true);

    const [openItemId, setOpenItemId] = useState<string | null>(null);
    const selectedItem = openItemId ? (items as ItemRow[]).find((it) => it.id === openItemId) ?? null : null;

    const { data: deptData = [], isLoading: deptLoading } =
        useMaterialRequestDepartmentSummary({ selectedStatus, selectedBranch, selectedProject, selectedType, start_date: startDateLocal, end_date: endDateLocal });

    const chartInput = (deptData || []).map((d) => ({ name: d.name, value: d.count }));

    useEffect(() => setPage(1), [searchId, searchName, onlyNeeded, selectedStatus, selectedDept, selectedBranch, selectedProject, selectedType, startDateLocal, endDateLocal, selectedSupplierId, pageSize]);

    // last purchase per item map
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

    const statusesForAgg = selectedStatus ? selectedStatus : ['draft', 'partially ordered'];

    const { filtered: filteredMRs = [] } = useFilteredMaterialRequests({
        selectedStatus: statusesForAgg,
        selectedDepartment: selectedDept,
        selectedBranch,
        selectedProject,
        selectedType,
        start_date: startDateLocal,
        end_date: endDateLocal,
    });

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

        (filteredMRs as MaterialRequest[]).forEach((mr) => {
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
    }, [filteredMRs]);

    const rows: Row[] = useMemo(() => {
        return (items as ItemRow[]).map((it) => {
            const agg = aggByItem.get(it.id) ?? { asked: 0, ordered: 0, received: 0 };
            const last = lastPurchaseByItem.get(it.id) ?? null;
            return {
                id: it.id,
                name: it.name,
                total_stock: typeof it.total_stock === 'number' ? it.total_stock : 0,
                asked: agg.asked,
                received: agg.received,
                uom: it.uom ?? '-',
                lastSupplier: last ? { id: last.supplier_id, name: last.supplier_name, date: last.date } : null,
            };
        });
    }, [items, aggByItem, lastPurchaseByItem]);

    const filtered = useMemo(() => {
        const idQ = searchId.trim().toLowerCase();
        const nameQ = searchName.trim().toLowerCase();
        let base = rows;
        if (idQ) base = base.filter((r) => r.id.toLowerCase().includes(idQ));
        if (nameQ) base = base.filter((r) => r.name.toLowerCase().includes(nameQ));
        if (onlyNeeded) base = base.filter((r) => (r.asked - r.received) > 0);

        if (selectedSupplierId) {
            base = base.filter((r) => {
                const sid = r.lastSupplier?.id ?? r.lastSupplier?.name ?? '';
                if (!sid) return false;
                return sid.toString() === selectedSupplierId.toString();
            });
        }

        return base;
    }, [rows, searchId, searchName, onlyNeeded, selectedSupplierId]);

    const totalRows = filtered.length;
    const paged = filtered.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);
    const loading = loadingItems || loadingMr;

    const Badge = ({ children, cls }: { children: React.ReactNode; cls: string }) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${cls}`}>{children}</span>
    );

    const { latestDate, nearestRequiredBy, totalMR, draftCount, partiallyOrderedCount, pendingCount } =
        useMaterialRequestSummary({
            selectedStatus,
            selectedDepartment: selectedDept,
            selectedBranch,
            selectedProject,
            selectedType,
            start_date: startDateLocal,
            end_date: endDateLocal,
        });

    const handleResetAll = () => {
        setSelectedStatus(null);
        setSelectedDept(null);
        setSelectedBranch(null);
        setSelectedProject(null);
        setSelectedType(null);
        setSearchId('');
        setSearchName('');
        setOnlyNeeded(true);
        setPage(1);

        setStartDateLocal(null);
        setEndDateLocal(null);
        setSelectedSupplierId(null);

        queryClient.invalidateQueries({ queryKey: ['material-request', 'list'] });
    };

    const tableRightActions = (
        <div className="flex items-center gap-3">
            <label className="text-sm text-slate-600">Rows:</label>
            <select
                value={String(pageSize)}
                onChange={(e) => {
                    const p = Number(e.target.value) || 10;
                    setPageSize(p);
                }}
                className="rounded-md border px-2 py-1 text-sm bg-white"
            >
                <option value="10">10</option>
                <option value="30">30</option>
            </select>
        </div>
    );

    return (
        <div className="p-2 space-y-4">
            <DashboardSummary
                latestDate={latestDate ?? undefined}
                nearestRequiredBy={nearestRequiredBy ?? undefined}
                totalMR={totalMR}
                draftCount={draftCount}
                partiallyOrderedCount={partiallyOrderedCount}
                pendingCount={pendingCount ?? 0}
                selectedStatus={selectedStatus}
                onSelectStatus={(st) => {
                    setSelectedStatus((prev) => (prev === st ? null : st));
                }}
                selectedDepartment={selectedDept}
                onSelectDepartment={(d) => {
                    setSelectedDept((prev) => (prev === d ? null : d));
                }}
                onRefresh={handleResetAll}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="md:col-span-1 space-y-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <label className="text-sm text-slate-600 mb-2 block">Project</label>
                        <select
                            value={selectedProject ?? ''}
                            onChange={(e) => setSelectedProject(e.target.value || null)}
                            className="w-full rounded-md border px-2 py-1 text-sm"
                        >
                            <option value="">All projects</option>
                            {projectList.map((p) => (
                                <option key={p.name} value={p.name}>{p.name} ({p.count})</option>
                            ))}
                        </select>
                    </div>

                    <BranchList
                        data={branchData}
                        total={branchTotal}
                        selectedBranch={selectedBranch}
                        onBranchClick={(b) => setSelectedBranch((prev) => (prev === b ? null : b))}
                        title="Cabang / Kota"
                    />

                    {!loadingDateRange ? (
                        <DateRangeInputs
                            start={startDateLocal}
                            end={endDateLocal}
                            min={hookMinDate}
                            max={hookMaxDate}
                            onChange={(s, e) => {
                                setStartDateLocal(s);
                                setEndDateLocal(e);
                            }}
                        />
                    ) : (
                        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                            Loading date range...
                        </div>
                    )}
                </div>

                {!loading && !deptLoading ? (
                    <div className="md:col-span-2 row-span-1">
                        <DepartmentChart
                            data={typeData.map((t: any) => ({ name: t.type ?? t.name ?? t.name, value: t.count ?? t.value ?? 0 }))}
                            selectedStatus={selectedStatus}
                            selectedDept={selectedDept}
                            onDeptClick={(name) => {
                                setSelectedType((prev) => (prev === name ? null : (name as MRType)));
                            }}
                            title="Tipe MR"
                            height={412}
                        />
                    </div>
                ) : (
                    <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 flex items-center justify-center">
                        Loading data...
                    </div>
                )}
            </div>

            <div className="pt-1">
                <DashboardTable<Row>
                    columns={[
                        { key: 'id', header: 'Code', width: '120px', className: 'font-mono' },
                        { key: 'name', header: 'Name', width: '260px' },
                        { key: 'asked', header: 'Qty Asked', width: '110px', className: 'text-right', render: (r) => <Badge cls="bg-sky-50 text-sky-700 ring-sky-200">{r.asked.toLocaleString('id-ID')}</Badge> },
                        { key: 'received', header: 'Qty Recv', width: '110px', className: 'text-right', render: (r) => <Badge cls="bg-emerald-50 text-emerald-700 ring-emerald-200">{r.received.toLocaleString('id-ID')}</Badge> },
                        { key: 'total_stock', header: 'Stock Total', width: '110px', className: 'text-right', render: (r) => <Badge cls="bg-slate-50 text-slate-700 ring-slate-200">{(r.total_stock || 0).toLocaleString('id-ID')}</Badge> },
                        { key: 'uom', header: 'UOM', width: '80px', className: 'text-center' },
                        {
                            key: 'lastSupplier',
                            header: 'Last Purchase',
                            width: '100px',
                            render: (r) => {
                                const s = r.lastSupplier;
                                if (!s) return <span className="text-slate-500">-</span>;
                                return (
                                    <div className="text-right">
                                        <div className="truncate" title={s.name || ''}>
                                            {s.name || s.id}
                                        </div>
                                        <div className="text-xs text-slate-400 mt-0.5">{s.date ? new Date(s.date).toLocaleDateString('id-ID') : ''}</div>
                                    </div>
                                );
                            },
                        },
                    ]}
                    data={paged}
                    loading={loading}
                    page={page}
                    pageSize={pageSize}
                    total={totalRows}
                    onPageChange={setPage}
                    emptyText="No items"
                    searchId={searchId}
                    searchName={searchName}
                    onSearchIdChange={setSearchId}
                    onSearchNameChange={setSearchName}
                    rightActions={tableRightActions}
                    suppliers={supplierList}
                    selectedSupplierId={selectedSupplierId}
                    onSelectSupplier={(id) => setSelectedSupplierId(id)}
                    onRowClick={(row) => setOpenItemId((row as Row).id)}
                />
            </div>

            {openItemId ? <ItemNeedPanel item={selectedItem} onClose={() => setOpenItemId(null)} /> : null}
        </div>
    );
}

function Badge({ children, cls }: { children: React.ReactNode; cls: string }) {
    return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${cls}`}>{children}</span>;
}
