'use client';

import { useState, useMemo } from 'react';
import ItemTable from '@/components/item/item-table';
import ItemDetailPanel from '@/components/ui/item-detail-panel';
import { useItems } from '@/hooks/useItemData';
import type { Item } from '@/types/item';

export default function ItemDashboard() {
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const pageSize = 10;

    const { data: rows = [], isLoading } = useItems();

    const filtered = useMemo(() => {
        const q = query.toLowerCase();
        return q
            ? rows.filter(
                (r) =>
                    r.name.toLowerCase().includes(q) ||
                    r.id.toLowerCase().includes(q) ||
                    (r.brand?.toLowerCase().includes(q) ?? false)
            )
            : rows;
    }, [rows, query]);

    const pageStart = (page - 1) * pageSize;
    const paged = filtered.slice(pageStart, pageStart + pageSize);

    return (
        <div className="p-4 space-y-4 relative">
            <ItemTable
                data={paged}
                loading={isLoading}
                query={query}
                onQueryChange={(q) => {
                    setQuery(q);
                    setPage(1);
                }}
                page={page}
                pageSize={pageSize}
                total={filtered.length}
                onPageChange={setPage}
                onAdd={() => (window.location.href = '/item/new')}
                // 👉 Callback kalau user klik item
                onRowClick={(item) => setSelectedItem(item)}
            />

            {/* DETAIL PANEL */}
            <ItemDetailPanel
                item={selectedItem}
                onClose={() => setSelectedItem(null)}
            />
        </div>
    );
}
