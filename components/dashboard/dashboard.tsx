// components/dashboard/dashboard.tsx
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
    useMakePo,
} from '@/hooks/useMaterialRequestData';
import { useTransactionData } from '@/hooks/useTransactionData';
import type { ItemRow } from '@/types/item';
import type { MaterialRequest, MaterialRequestItem } from '@/types/material-request';
import DashboardSummary from '@/components/dashboard/dashboard-summary';
import ItemNeedPanel from '@/components/ui/item-demand-panel';
import DepartmentChart from '@/components/dashboard/department-chart';
import BranchList from '@/components/dashboard/branch-list';
import ProjectDeliveryTable from '@/components/dashboard/project-delivery-table';
import DateRangeInputs from '@/components/ui/date-range-inputs';

type Row = {
    id: string;
    name: string;
    total_stock: number;
    asked: number;
    ordered: number;       // accumulated PO qty (qty_total_po)
    received: number;
    uom?: string | null;
    lastSupplier?: { id?: string; name?: string; date?: string } | null;
    lastPrice?: number | null;
    lastUom?: string | null;
    isPo?: boolean;
};

type MRType = 'Project' | 'Operational' | 'Stock' | 'Lain-lain';

export default function Dashboard() {
    const queryClient = useQueryClient();
    const makePoMutation = useMakePo();

    // interactive filters
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [selectedDept, setSelectedDept] = useState<string | null>(null);
    const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
    const [selectedProject, setSelectedProject] = useState<string | null>(null);

    // two independent date ranges:
    // MR transaction date range (mrDate)
    const [mrStart, setMrStart] = useState<string | null>(null);
    const [mrEnd, setMrEnd] = useState<string | null>(null);
    const [mrRangeInitialized, setMrRangeInitialized] = useState(false);

    // Required-by date range (reqDate)
    const [reqStart, setReqStart] = useState<string | null>(null);
    const [reqEnd, setReqEnd] = useState<string | null>(null);
    const [reqRangeInitialized, setReqRangeInitialized] = useState(false);

    // supplier filter (single)
    const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

    // type filter
    const [selectedType, setSelectedType] = useState<MRType | null>(null);

    const { data: items = [], isLoading: loadingItems } = useItems();
    const { data: mrs = [], isLoading: loadingMr } = useMaterialRequestData();

    // get default ranges already filtered by other interactive filters
    const { minDate: hookMrMin, maxDate: hookMrMax, isLoading: loadingMrRange } = useMaterialRequestDateRange({
        selectedStatus,
        selectedBranch,
        selectedProject,
        selectedType,
        selectedDepartment: selectedDept,
        date_field: 'transaction_date',
    });

    const { minDate: hookReqMin, maxDate: hookReqMax, isLoading: loadingReqRange } = useMaterialRequestDateRange({
        selectedStatus,
        selectedBranch,
        selectedProject,
        selectedType,
        selectedDepartment: selectedDept,
        date_field: 'required_by',
    });

    // initialize MR date local state once (unless user already changed)
    useEffect(() => {
        if (mrRangeInitialized) return;
        if (loadingMrRange) return;
        if (!hookMrMin && !hookMrMax) return;
        setMrStart((prev) => prev ?? hookMrMin ?? null);
        setMrEnd((prev) => prev ?? hookMrMax ?? null);
        setMrRangeInitialized(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadingMrRange, hookMrMin, hookMrMax, mrRangeInitialized]);

    // initialize Required-by local state once
    useEffect(() => {
        if (reqRangeInitialized) return;
        if (loadingReqRange) return;
        if (!hookReqMin && !hookReqMax) return;
        setReqStart((prev) => prev ?? hookReqMin ?? null);
        setReqEnd((prev) => prev ?? hookReqMax ?? null);
        setReqRangeInitialized(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadingReqRange, hookReqMin, hookReqMax, reqRangeInitialized]);

    // whenever main filters change, clear both local ranges so they re-init from hooks
    useEffect(() => {
        setMrRangeInitialized(false);
        setReqRangeInitialized(false);
        setMrStart(null);
        setMrEnd(null);
        setReqStart(null);
        setReqEnd(null);
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

    // project list - pass both ranges: MR date + required-by (hooks should accept optional params)
    const { projects: projectList = [] } = useMaterialRequestProjectList({
        selectedStatus,
        selectedBranch,
        selectedType,
        start_date: mrStart,
        end_date: mrEnd,
        required_start: reqStart,
        required_end: reqEnd,
    });

    const { data: typeData = [] } = useMaterialRequestTypeSummary({
        selectedStatus,
        selectedBranch,
        selectedProject,
        selectedType,
        start_date: mrStart,
        end_date: mrEnd,
        required_start: reqStart,
        required_end: reqEnd,
    });

    const { data: branchData = [], total: branchTotal = 0 } =
        useMaterialRequestBranchSummary({
            selectedStatus,
            selectedProject,
            selectedType,
            start_date: mrStart,
            end_date: mrEnd,
            required_start: reqStart,
            required_end: reqEnd,
        });

    // paging state
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState<number>(10);

    // table filters
    const [searchId, setSearchId] = useState('');
    const [searchName, setSearchName] = useState('');

    const [openItemId, setOpenItemId] = useState<string | null>(null);
    const selectedItem = openItemId ? (items as ItemRow[]).find((it) => it.id === openItemId) ?? null : null;

    const [makePoSet, setMakePoSet] = useState<Set<string>>(new Set());

    // Show All Items toggle:
    // default false (per your last instruction)
    const [showAllItems, setShowAllItems] = useState<boolean>(false);

    // toggle handler
    const handleToggleMakePo = (id: string) => {
        setMakePoSet((prev) => {
            const s = new Set(prev);
            if (s.has(id)) s.delete(id);
            else s.add(id);
            return s;
        });
    };

    const { data: deptData = [], isLoading: deptLoading } =
        useMaterialRequestDepartmentSummary({
            selectedStatus,
            selectedBranch,
            selectedProject,
            selectedType,
            start_date: mrStart,
            end_date: mrEnd,
            required_start: reqStart,
            required_end: reqEnd,
        });

    const chartInput = (deptData || []).map((d) => ({ name: d.name, value: d.count }));

    useEffect(() => setPage(1), [searchId, searchName, selectedStatus, selectedDept, selectedBranch, selectedProject, selectedType, mrStart, mrEnd, reqStart, reqEnd, selectedSupplierId, pageSize]);

    // last purchase per item map (capture last supplier, date, price and uom)
    const lastPurchaseByItem = useMemo(() => {
        const map = new Map<string, { supplier_id?: string; supplier_name?: string; date?: string; price?: number; uom?: string }>();
        (transactions || []).forEach((tx) => {
            const txDate = tx.transaction_date;
            if (!txDate) return;
            (tx.items || []).forEach((it: any) => {
                const code = (it.item_code || '').toString();
                if (!code) return;
                const cur = map.get(code);
                const curTime = cur?.date ? new Date(cur.date).getTime() : 0;
                const thisTime = new Date(txDate).getTime();
                if (!cur || thisTime > curTime) {
                    // find price using common field names
                    let price: number | undefined = undefined;
                    const priceCandidates = ['unit_price', 'price', 'purchase_price', 'rate', 'amount', 'supplier_price', 'cost', 'unit_rate'];
                    for (const k of priceCandidates) {
                        if (it[k] !== undefined && it[k] !== null) {
                            const n = Number(it[k]);
                            if (!isNaN(n)) { price = n; break; }
                        }
                    }
                    // fallback: maybe transaction-level totals exist
                    if ((price === undefined) && (it.qty && (it.total_amount))) {
                        const total = Number(it.total_amount ?? 0);
                        const q = Number(it.qty ?? 0);
                        if (q > 0 && total > 0) price = total / q;
                    }

                    // find uom using common field names (prefer item-level uom)
                    const uomCandidates = ['uom', 'unit', 'unit_of_measure', 'uom_code'];
                    let uom: string | undefined = undefined;
                    for (const k of uomCandidates) {
                        if (it[k]) {
                            uom = String(it[k]);
                            break;
                        }
                    }

                    map.set(code, {
                        supplier_id: tx.supplier ?? '',
                        supplier_name: tx.supplier_name ?? '',
                        date: txDate,
                        price: price,
                        uom: uom,
                    });
                }
            });
        });
        return map;
    }, [transactions]);



    const statusesForAgg = useMemo(() => {
        if (!selectedStatus) return ['draft', 'partially ordered', 'pending'];
        return Array.isArray(selectedStatus) ? selectedStatus : [selectedStatus];
    }, [selectedStatus]);


    const { filtered: filteredMRs = [] } = useFilteredMaterialRequests({
        selectedStatus: statusesForAgg,
        selectedDepartment: selectedDept,
        selectedBranch,
        selectedProject,
        selectedType,
        start_date: mrStart,
        end_date: mrEnd,
        required_start: reqStart,
        required_end: reqEnd,
    });

    const aggByItem = useMemo(() => {
        const ALLOWED = new Set(['draft', 'partially ordered', 'pending']);
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
                const totPo = Number(it.qty_total_po ?? 0);
                // always accumulate asked and accumulated PO qty (qty_total_po)
                add(code, { asked: qty, ordered: totPo, received: 0 });
            });
        });

        return map;
    }, [filteredMRs]);

    // compute per-item PO status summary from filteredMRs:
    // { anyTrue: boolean, anyFalse: boolean, anyMissing: boolean }
    const poStatsByItem = useMemo(() => {
        const map = new Map<string, { anyTrue: boolean; anyFalse: boolean; anyMissing: boolean }>();
        (filteredMRs as MaterialRequest[]).forEach((mr) => {
            (mr.items ?? []).forEach((it: MaterialRequestItem) => {
                const code = (it.item_code ?? '').toString();
                if (!code) return;
                const cur = map.get(code) ?? { anyTrue: false, anyFalse: false, anyMissing: false };
                const val = (it as any).is_po;
                if (val === true) cur.anyTrue = true;
                else if (val === false) cur.anyFalse = true;
                else cur.anyMissing = true; // undefined / null / not present
                map.set(code, cur);
            });
        });
        return map;
    }, [filteredMRs]);

    const isPoByItem = useMemo(() => {
        const map = new Map<string, boolean>();

        (filteredMRs as MaterialRequest[]).forEach((mr) => {
            (mr.items ?? []).forEach((it: MaterialRequestItem) => {
                const code = it.item_code ?? '';
                if (!code) return;
                if (it.is_po === true) {
                    map.set(code, true);
                }
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
                total_stock: typeof (it as any).total_stock === 'number' ? (it as any).total_stock : 0,
                asked: agg.asked,
                ordered: agg.ordered,
                received: agg.received,
                uom: it.uom ?? '-',
                lastSupplier: last ? { id: last.supplier_id, name: last.supplier_name, date: last.date } : null,
                lastPrice: last?.price ?? null,
                lastUom: last?.uom ?? (it.uom ?? null), // prefer transaction uom, fallback to item master uom
                isPo: isPoByItem.get(it.id) === true,
            };

        });
    }, [items, aggByItem, lastPurchaseByItem, isPoByItem]);

    const filtered = useMemo(() => {
        const idQ = searchId.trim().toLowerCase();
        const nameQ = searchName.trim().toLowerCase();
        let base = rows;
        if (idQ) base = base.filter((r) => r.id.toLowerCase().includes(idQ));
        if (nameQ) base = base.filter((r) => r.name.toLowerCase().includes(nameQ));

        // Always require asked > ordered (only outstanding items)
        base = base.filter((r) => (r.asked ?? 0) > (r.ordered ?? 0));

        // If showAllItems is true: show all outstanding items regardless of is_po
        // If showAllItems is false (default): show only outstanding items that do NOT have any is_po === true
        if (!showAllItems) {
            base = base.filter((r) => {
                const code = (r.id || '').toString();
                const stats = poStatsByItem.get(code);
                // treat missing stats as "no is_po true" (i.e. include)
                const anyTrue = stats?.anyTrue ?? false;
                // include only when not anyTrue (so items with anyTrue will be excluded)
                return !anyTrue;
            });
        }

        if (selectedSupplierId) {
            base = base.filter((r) => {
                const sid = r.lastSupplier?.id ?? r.lastSupplier?.name ?? '';
                if (!sid) return false;
                return sid.toString() === selectedSupplierId.toString();
            });
        }

        return base;
    }, [rows, searchId, searchName, selectedSupplierId, poStatsByItem, showAllItems]);

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
            start_date: mrStart,
            end_date: mrEnd,
            required_start: reqStart,
            required_end: reqEnd,
        });

    const handleResetAll = () => {
        setSelectedStatus(null);
        setSelectedDept(null);
        setSelectedBranch(null);
        setSelectedProject(null);
        setSelectedType(null);
        setSearchId('');
        setSearchName('');
        setPage(1);

        setMrStart(null);
        setMrEnd(null);
        setReqStart(null);
        setReqEnd(null);
        setSelectedSupplierId(null);

        queryClient.invalidateQueries({ queryKey: ['material-request', 'list'] });
    };


    // support both react-query names: isPending (some wrappers) or isLoading (default)
    const mutationPending = (makePoMutation as any)?.isPending || (makePoMutation as any)?.isLoading || false;

    // --- Modal state: setelah berhasil makePO, kita tampilkan PO details di modal ---
    const [poModalOpen, setPoModalOpen] = useState(false);
    const [poModalData, setPoModalData] = useState<
        { mr_name: string; item_code: string; po_detail: any[] }[]
    >([]);

    const tableRightActions = (
        <div className="flex items-center gap-3">
            <div className="flex items-center justify-end gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                        type="checkbox"
                        checked={showAllItems}
                        onChange={(e) => setShowAllItems(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300"
                    />
                    <span>Show All Items</span>
                </label>
            </div>
            <div className="text-sm text-slate-600">Selected: <span className="font-medium ml-1">{makePoSet.size}</span></div>
            <button
                onClick={async () => {
                    const itemCodes = Array.from(makePoSet);
                    if (itemCodes.length === 0) return;

                    // build simple po_meta automatically (you can replace these with real inputs if available)
                    const now = new Date();
                    const poName = `PO-AUTO-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${now.getTime()}`;
                    const poMeta = {
                        po_name: poName,
                        supplier: '', // you can set supplier here or prompt user
                        transaction_date: now.toISOString().slice(0, 10),
                    };

                    try {
                        // call API
                        await makePoMutation.mutateAsync({ item_codes: itemCodes, po_meta: poMeta });

                        // refresh data
                        await queryClient.invalidateQueries({ queryKey: ['material-request', 'list'] });
                        // refetch active queries to be sure
                        await queryClient.refetchQueries({ queryKey: ['material-request', 'list'], type: 'active' });

                        // fetch fresh data from cache (after refetch)
                        const freshMrs = (queryClient.getQueryData(['material-request', 'list']) ?? mrs) as MaterialRequest[];

                        // build modal payload: per MR that has items with item_codes, collect po_detail
                        const modalEntries: { mr_name: string; item_code: string; po_detail: any[] }[] = [];

                        const codesSet = new Set(itemCodes.map(c => (c || '').toString().toLowerCase()));

                        (freshMrs || []).forEach((mr) => {
                            (mr.items || []).forEach((it: MaterialRequestItem) => {
                                const code = (it.item_code ?? '').toString();
                                if (!code) return;
                                if (!codesSet.has(code.toLowerCase())) return;

                                // normalize po_detail to array
                                const poDetailArr = Array.isArray((it as any).po_detail)
                                    ? (it as any).po_detail
                                    : ((it as any).po_detail ? [(it as any).po_detail] : []);

                                modalEntries.push({
                                    mr_name: mr.name ?? '',
                                    item_code: code,
                                    po_detail: poDetailArr,
                                });
                            });
                        });

                        // Set modal data and open
                        setPoModalData(modalEntries);
                        setPoModalOpen(true);

                        // clear selection on success
                        setMakePoSet(new Set());
                        console.log('PO updated:', itemCodes);
                    } catch (err) {
                        console.error('Make PO error:', err);
                        // optionally show toast
                    }
                }}
                disabled={mutationPending}
                className="rounded-md bg-sky-600 text-white px-3 py-1 text-sm hover:bg-sky-700 disabled:opacity-60"
            >
                {mutationPending ? 'Processing...' : 'Get Latest PO'}
            </button>

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
                mrStart={mrStart}
                mrEnd={mrEnd}
                onMrChange={(s, e) => { setMrStart(s); setMrEnd(e); }}
                reqStart={reqStart}
                reqEnd={reqEnd}
                onReqChange={(s, e) => { setReqStart(s); setReqEnd(e); }}
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

            {/* ===== REPLACE THIS ENTIRE BLOCK ===== */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                {/* LEFT: BranchList (1/4 width on md+) */}
                <div className="md:col-span-1">
                    <div className="space-y-3">
                        <BranchList
                            data={branchData}
                            total={branchTotal}
                            selectedBranch={selectedBranch}
                            onBranchClick={(b) => setSelectedBranch((prev) => (prev === b ? null : b))}
                            title="Cabang / Kota"
                        />

                        {!loadingReqRange && !loadingMrRange ? (
                            <div />
                        ) : (
                            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                                Loading date range...
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: Chart (span 2) + Project table (span 1) */}
                {!loading && !deptLoading ? (
                    <>
                        {/* Chart occupying 2 columns */}
                        <div className="md:col-span-2">
                            <DepartmentChart
                                data={typeData.map((t: any) => ({ name: t.type ?? t.name ?? t.name, value: t.count ?? t.value ?? 0 }))}
                                selectedStatus={selectedStatus}
                                selectedDept={selectedDept}
                                onDeptClick={(name) => {
                                    setSelectedType((prev) => (prev === name ? null : (name as MRType)));
                                }}
                                title="Tipe MR"
                                height={402}
                            />
                        </div>

                        {/* ProjectDeliveryTable occupying 1 column (ke kanan) */}
                        <div className="md:col-span-1">
                            <ProjectDeliveryTable
                                filters={{
                                    selectedStatus,
                                    selectedBranch,
                                    selectedType,
                                    start_date: mrStart,
                                    end_date: mrEnd,
                                    required_start: reqStart,
                                    required_end: reqEnd,
                                    selectedDepartment: selectedDept,
                                    selectedProject,
                                }}
                                onSelectProject={(p) => setSelectedProject((prev) => (prev === p ? null : p))}
                                maxRows={20}
                            />
                        </div>
                    </>
                ) : (
                    <div className="md:col-span-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 flex items-center justify-center">
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
                        { key: 'total_stock', header: 'Stock Total', width: '110px', className: 'text-right', render: (r) => <Badge cls="bg-emerald-50 text-emerald-700 ring-emerald-200">{(r.total_stock || 0).toLocaleString('id-ID')}</Badge> },
                        { key: 'uom', header: 'UOM', width: '80px', className: 'text-center' },
                        {
                            key: 'lastSupplier',
                            header: 'Last Purchase',
                            width: '160px',
                            render: (r: Row) => {
                                const s = r.lastSupplier;
                                const price = r.lastPrice;
                                const uom = r.lastUom;
                                if (!s) return <span className="text-slate-500">-</span>;
                                return (
                                    <div className="text-right">
                                        <div className="truncate" title={s.name || ''}>
                                            {s.name || s.id}
                                        </div>
                                        <div className="text-xs text-slate-400 mt-0.5">
                                            {s.date ? new Date(s.date).toLocaleDateString('id-ID') : ''}
                                        </div>

                                        {price !== null && price !== undefined ? (
                                            <div className="text-sm font-semibold text-slate-800 mt-1">
                                                {/* format price and append unit e.g. "Rp 1.000 / pcs" */}
                                                {price.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}
                                                {uom ? ` / ${uom}` : ''}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-slate-400 mt-1">No price</div>
                                        )}
                                    </div>
                                );
                            },
                        },


                        {
                            key: 'make_po',
                            header: 'Make PO',
                            width: '100px',
                            className: 'text-center',
                            render: (r: Row) => {
                                const alreadyPo = (r as any).isPo === true;
                                const checked = alreadyPo ? true : makePoSet.has(r.id);

                                return (
                                    <div
                                        onClick={(e) => e.stopPropagation()}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        className="flex items-center justify-center"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            disabled={alreadyPo}            // lock checkbox if already PO
                                            onClick={(e) => e.stopPropagation()}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                if (alreadyPo) return;       // safety
                                                setMakePoSet(prev => {
                                                    const s = new Set(prev);
                                                    if (s.has(r.id)) s.delete(r.id);
                                                    else s.add(r.id);
                                                    return s;
                                                });
                                            }}
                                            className={`h-5 w-5 rounded border-slate-300 
                        ${alreadyPo ? 'text-green-500 opacity-60 cursor-not-allowed' : 'text-sky-600'}`}
                                            aria-label={`Make PO for ${r.id}`}
                                        />
                                    </div>
                                );
                            },

                        }
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

            {openItemId ? (
                <ItemNeedPanel
                    item={selectedItem}
                    onClose={() => setOpenItemId(null)}
                    filters={{
                        selectedStatus,
                        selectedDept,
                        selectedBranch,
                        selectedProject,
                        selectedType,
                        mrStart,
                        mrEnd,
                        reqStart,
                        reqEnd,
                    }}
                />
            ) : null}

            {/* PO modal */}
            {poModalOpen ? (
                <>
                    <div
                        className="fixed inset-0 z-50 bg-black/40"
                        onClick={() => setPoModalOpen(false)}
                    />
                    <div className="fixed left-1/2 top-12 -translate-x-1/2 z-60 w-[92%] max-w-4xl">
                        <div className="rounded-xl overflow-hidden shadow-2xl bg-white">
                            <div className="flex items-center justify-between px-5 py-4 border-b">
                                <h3 className="text-lg font-semibold">PO details (recent)</h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        className="rounded-md px-3 py-1 bg-slate-100 text-sm"
                                        onClick={() => setPoModalOpen(false)}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 space-y-3 max-h-[60vh] overflow-auto">
                                {poModalData.length === 0 ? (
                                    <div className="p-4 text-sm text-slate-500">No PO details available.</div>
                                ) : (
                                    poModalData.map((entry, idx) => (
                                        <div key={`${entry.mr_name}-${entry.item_code}-${idx}`} className="rounded-lg border p-3 bg-white">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium text-slate-800 truncate">{entry.mr_name}</div>
                                                    <div className="text-xs text-slate-500 mt-0.5">{entry.item_code}</div>
                                                </div>
                                                <div className="text-xs text-slate-500">{entry.po_detail.length} po(s)</div>
                                            </div>

                                            <div className="mt-3 grid gap-2">
                                                {entry.po_detail.length === 0 ? (
                                                    <div className="text-sm text-slate-500">No po_detail recorded yet.</div>
                                                ) : entry.po_detail.map((pd: any, i: number) => (
                                                    <div key={i} className="flex items-center justify-between gap-4 p-3 rounded-md border bg-slate-50">
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-medium text-slate-800 truncate">{pd.po_name ?? pd.po_name}</div>
                                                            <div className="text-xs text-slate-500 mt-0.5">
                                                                {pd.supplier ? `${pd.supplier} • ` : ''}{pd.transaction_date ? new Date(pd.transaction_date).toLocaleDateString('id-ID') : ''}
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
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </>
            ) : null}
        </div>
    );
}
