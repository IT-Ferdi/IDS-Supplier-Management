'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { useCategoryRows, useCategoryTree, type TreeNode } from '@/hooks/useCategoryData';

export type CategoryTreeProps = {
    selectedIds: string[];
    onChange: (ids: string[]) => void;
    items?: { id: string; nama: string; parent?: string | null; status_group?: number | null }[];
    fetchUrl?: string;
    selectableHeaders?: boolean;
    title?: string;
    searchPlaceholder?: string;
    className?: string;
    panelWidth?: number;
    panelMinHeight?: number;
    panelMaxHeight?: number;
};

export default function CategoryTree({
    selectedIds,
    onChange,
    items,
    fetchUrl = '/api/category',
    selectableHeaders = false,
    title = 'Kategori Supplier',
    searchPlaceholder = 'Cari kategori…',
    className,
    panelWidth = 480,
    panelMinHeight = 200,
    panelMaxHeight = 360,
}: CategoryTreeProps) {
    // ----- data -----
    const rowsQ = useCategoryRows({ url: fetchUrl, staleTimeMs: 0, cache: 'no-store' });
    const rows = items ?? rowsQ.data ?? [];
    const { roots, index } = useCategoryTree(rows);

    // snapshot selected -> Set
    const selectedSet = React.useMemo(() => new Set(selectedIds), [selectedIds]);

    // ----- floating panel states -----
    const [open, setOpen] = React.useState(false);
    const btnRef = React.useRef<HTMLButtonElement | null>(null);
    const [pos, setPos] = React.useState({ top: 0, left: 0, width: panelWidth, maxH: panelMaxHeight });

    React.useLayoutEffect(() => {
        if (!open || !btnRef.current) return;
        const compute = () => {
            const r = btnRef.current!.getBoundingClientRect();
            const GAP = 8;
            const width = Math.max(r.width, panelWidth);
            const spaceBelow = window.innerHeight - r.bottom - GAP;
            const spaceAbove = r.top - GAP;

            const showBelow = spaceBelow >= panelMinHeight || spaceBelow >= spaceAbove;
            const maxH = Math.max(panelMinHeight, Math.min(panelMaxHeight, showBelow ? spaceBelow : spaceAbove));
            const top = showBelow ? r.bottom + GAP : r.top - GAP - maxH;
            const left = Math.min(Math.max(GAP, r.left), window.innerWidth - width - GAP);

            setPos({ top, left, width, maxH });
        };
        compute();
        const onScroll = () => compute();
        const onResize = () => compute();
        window.addEventListener('scroll', onScroll, true);
        window.addEventListener('resize', onResize);
        return () => {
            window.removeEventListener('scroll', onScroll, true);
            window.removeEventListener('resize', onResize);
        };
    }, [open, panelWidth, panelMinHeight, panelMaxHeight]);

    // close on outside/esc
    React.useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            const panel = document.getElementById('category-panel');
            if (btnRef.current?.contains(e.target as Node)) return;
            if (panel?.contains(e.target as Node)) return;
            setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
        window.addEventListener('mousedown', onDown);
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('mousedown', onDown);
            window.removeEventListener('keydown', onKey);
        };
    }, [open]);

    // ----- search / expand -----
    const [query, setQuery] = React.useState('');
    const { expandedBySearch, matched } = React.useMemo(() => {
        const expanded = new Set<string>();
        const matched = new Set<string>();
        const q = query.trim().toLowerCase();
        if (!q) return { expandedBySearch: expanded, matched };

        const up = (id: string) => {
            let cur = index.get(id);
            const seen = new Set<string>();
            while (cur?.parentId && !seen.has(cur.parentId)) {
                seen.add(cur.parentId);
                expanded.add(cur.parentId);
                cur = index.get(cur.parentId);
            }
        };
        index.forEach((n: { label: string; id: string }) => {
            if (n.label.toLowerCase().includes(q)) {
                matched.add(n.id);
                up(n.id);
            }
        });
        return { expandedBySearch: expanded, matched };
    }, [query, index]);

    const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
    const isExpanded = (id: string) => expanded.has(id) || expandedBySearch.has(id);
    const toggleExpand = (id: string) => {
        setExpanded((s) => {
            const n = new Set(s);
            if (n.has(id)) {
                n.delete(id);
            } else {
                n.add(id);
            }
            return n;
        });
    };

    // ----- tri-state -----
    const getNodeState = (node: TreeNode): 'checked' | 'indeterminate' | 'unchecked' => {
        if (node.children.length === 0) return selectedSet.has(node.id) ? 'checked' : 'unchecked';
        let anyChecked = selectedSet.has(node.id);
        let anyUnchecked = !selectedSet.has(node.id);
        for (const c of node.children) {
            const st = getNodeState(c);
            if (st !== 'unchecked') anyChecked = true;
            if (st !== 'checked') anyUnchecked = true;
        }
        if (anyChecked && anyUnchecked) return 'indeterminate';
        return anyChecked ? 'checked' : 'unchecked';
    };

    const collectDesc = React.useCallback((n: TreeNode, acc: Set<string>) => {
        n.children.forEach((c: TreeNode) => {
            acc.add(c.id);
            collectDesc(c, acc);
        });
    }, []);

    // NEW: pakai callback dengan dependensi minimal agar selalu pakai snapshot "selectedIds" terbaru
    const applySelection = React.useCallback(
        (node: TreeNode, checked: boolean) => {
            const next = new Set(selectedIds);
            const bucket = new Set<string>([node.id]);
            collectDesc(node, bucket);

            if (checked) {
                bucket.forEach((id) => {
                    const n = index.get(id);
                    if (!n) return;
                    if (!n.isHeader || selectableHeaders) next.add(id);
                });
            } else {
                bucket.forEach((id) => next.delete(id));
            }
            onChange(Array.from(next));
        },
        [selectedIds, index, onChange, selectableHeaders, collectDesc] // ⬅️ tambah collectDesc
    );

    // trigger summary
    const summary =
        selectedIds.length === 0
            ? ''
            : selectedIds.length === 1
                ? (index.get(selectedIds[0])?.label ?? '1 dipilih')
                : `${selectedIds.length} kategori dipilih`;

    return (
        <div className={className}>
            <label className="mb-1 block text-sm font-medium text-slate-700">{title}</label>
            <button
                ref={btnRef}
                type="button"
                className="flex w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-sm outline-none focus:ring-2 focus:ring-sky-300"
                onClick={() => setOpen((s) => !s)}
                aria-haspopup="dialog"
                aria-expanded={open}
            >
                <span className={`truncate ${summary ? 'text-slate-700' : 'text-slate-400'}`}>
                    {summary || 'Pilih kategori…'}
                </span>
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="ml-2">
                    <path d="M7 10l5 5 5-5H7z" fill="currentColor" />
                </svg>
            </button>

            {open ? createPortal(
                <div
                    id="category-panel"
                    role="dialog"
                    aria-label="Pilih kategori"
                    className="z-[1000] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl"
                    style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width }}
                >
                    {/* Action bar */}
                    <div className="mb-3 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            className="text-xs text-slate-600 underline hover:text-slate-800"
                            onClick={() => onChange([])}
                        >
                            Clear
                        </button>
                        <button
                            type="button"
                            className="text-xs text-slate-600 underline hover:text-slate-800"
                            onClick={() => {
                                const all = new Set<string>();
                                const walk = (n: TreeNode) => {
                                    if (!n.isHeader || selectableHeaders) all.add(n.id);
                                    n.children.forEach(walk);
                                };
                                roots.forEach(walk);
                                onChange(Array.from(all));
                            }}
                        >
                            Select All
                        </button>
                    </div>

                    {/* Search */}
                    <div className="mb-3">
                        <input
                            type="text"
                            placeholder={searchPlaceholder ?? 'Cari kategori…'}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-300"
                        />
                    </div>

                    {/* Tree body */}
                    <div className="overflow-auto rounded-lg border border-slate-200 p-1" style={{ maxHeight: pos.maxH }}>
                        {rowsQ.isLoading && !items ? (
                            <div className="p-4 text-sm text-slate-500">Memuat kategori…</div>
                        ) : rowsQ.error && !items ? (
                            <div className="p-4 text-sm text-rose-600">Gagal memuat: {rowsQ.error.message}</div>
                        ) : !roots.length ? (
                            <div className="p-4 text-sm text-slate-500">Tidak ada data.</div>
                        ) : (
                            roots.map((n: TreeNode) => (
                                <TreeRow
                                    key={n.id}
                                    node={n}
                                    depth={0}
                                    isExpanded={(id) => isExpanded(id)}
                                    toggleExpand={toggleExpand}
                                    getNodeState={getNodeState}
                                    onToggle={(checked) => applySelection(n, checked)}
                                    query={query}
                                    matched={matched.has(n.id)}
                                    disableSelect={n.isHeader && !selectableHeaders}
                                    renderChildren={(node) =>
                                        node.children.length > 0 && isExpanded(node.id) ? (
                                            <div className="border-l border-slate-100">
                                                {node.children.map((c: TreeNode) => (
                                                    <TreeRow
                                                        key={c.id}
                                                        node={c}
                                                        depth={1}
                                                        isExpanded={(id) => isExpanded(id)}
                                                        toggleExpand={toggleExpand}
                                                        getNodeState={getNodeState}
                                                        onToggle={(checked) => applySelection(c, checked)}
                                                        query={query}
                                                        matched={matched.has(c.id)}
                                                        disableSelect={c.isHeader && !selectableHeaders}
                                                        renderChildren={() => null}
                                                    />
                                                ))}
                                            </div>
                                        ) : null
                                    }
                                />
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="mt-3 flex items-center justify-between">
                        <div className="text-xs text-slate-500">Dipilih: {selectedIds.length} kategori</div>
                        <button
                            type="button"
                            className="rounded-lg bg-sky-600 px-3 py-1.5 text-sm text-white hover:bg-sky-700"
                            onClick={() => setOpen(false)}
                        >
                            Selesai
                        </button>
                    </div>
                </div>,
                document.body
            ) : null}
        </div>
    );
}

/* ---------- Subcomponents ---------- */
function TreeRow(props: {
    node: TreeNode;
    depth: number;
    isExpanded: (id: string) => boolean;
    toggleExpand: (id: string) => void;
    getNodeState: (n: TreeNode) => 'checked' | 'indeterminate' | 'unchecked';
    onToggle: (checked: boolean) => void;
    query: string;
    matched: boolean;
    disableSelect: boolean;
    renderChildren: (n: TreeNode) => React.ReactNode;
}) {
    const { node, depth, isExpanded, toggleExpand, getNodeState, onToggle, query, matched, disableSelect, renderChildren } =
        props;
    const state = getNodeState(node);

    // NEW: klik label juga toggle (kalau tidak disabled)
    const handleLabelClick = React.useCallback(() => {
        if (disableSelect) return;
        onToggle(!(state === 'checked' || state === 'indeterminate'));
    }, [disableSelect, onToggle, state]);

    return (
        <div className="select-none">
            <div className="flex items-center gap-2 py-1" style={{ paddingLeft: depth * 16 }}>
                {node.children.length > 0 ? (
                    <button
                        type="button"
                        onClick={() => toggleExpand(node.id)}
                        className="inline-flex h-5 w-5 items-center justify-center rounded hover:bg-slate-100"
                        aria-label={isExpanded(node.id) ? 'Collapse' : 'Expand'}
                    >
                        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                            {isExpanded(node.id) ? (
                                <path d="M7 10l5 5 5-5H7z" fill="currentColor" />
                            ) : (
                                <path d="M10 7l5 5-5 5V7z" fill="currentColor" />
                            )}
                        </svg>
                    </button>
                ) : (
                    <span className="inline-block w-5" />
                )}

                <TriStateCheckbox checked={state === 'checked'} indeterminate={state === 'indeterminate'} disabled={disableSelect} onChange={onToggle} />

                <button
                    type="button"
                    className={`text-left text-sm ${disableSelect ? 'text-slate-400' : 'text-slate-700'}`}
                    title={node.label}
                    onClick={handleLabelClick} // NEW
                >
                    <Highlight text={node.label} query={query} matched={matched} />
                    {node.isHeader && <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">Header</span>}
                </button>
            </div>

            {renderChildren(node)}
        </div>
    );
}

function TriStateCheckbox({
    checked,
    indeterminate,
    disabled,
    onChange,
}: {
    checked: boolean;
    indeterminate: boolean;
    disabled?: boolean;
    onChange: (next: boolean) => void;
}) {
    const ref = React.useRef<HTMLInputElement | null>(null);
    React.useEffect(() => {
        if (ref.current) ref.current.indeterminate = indeterminate;
    }, [indeterminate]);

    return (
        <label className="inline-flex items-center">
            <input
                ref={ref}
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-2 focus:ring-sky-300"
                checked={checked}
                disabled={disabled}
                onChange={(e) => onChange(e.target.checked)}
            />
        </label>
    );
}

function Highlight({ text, query, matched }: { text: string; query: string; matched: boolean }) {
    if (!query.trim()) return <>{text}</>;
    const q = query.trim();
    const i = text.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return <>{text}</>;
    return (
        <span>
            {text.slice(0, i)}
            <mark className={`rounded px-0.5 ${matched ? 'bg-yellow-200' : 'bg-transparent'}`}>{text.slice(i, i + q.length)}</mark>
            {text.slice(i + q.length)}
        </span>
    );
}
