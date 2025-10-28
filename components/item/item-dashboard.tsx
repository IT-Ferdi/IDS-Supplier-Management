'use client';

import { useState, useMemo } from 'react';
import ItemTable from '@/components/item/item-table';
import { useItems } from '@/hooks/useItemData'; // hook get API
import type { ItemRow } from '@/types/item';

export default function ItemDashboard() {
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const { data: rows = [], isLoading } = useItems();

    const filtered = useMemo(() => {
        const q = query.toLowerCase();
        return q ? rows.filter((r) => r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)) : rows;
    }, [rows, query]);

    const pageStart = (page - 1) * pageSize;
    const paged = filtered.slice(pageStart, pageStart + pageSize);

    return (
        <div className="p-4 space-y-4">
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
            />
        </div>
    );
}
