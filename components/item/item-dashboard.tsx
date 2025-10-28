'use client';

import { useEffect, useMemo, useState } from 'react';
import ItemTable, { type Item } from '@/components/item/item-table';

export default function ItemDashboard() {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState<Item[]>([]);
    const [page, setPage] = useState(1);
    const pageSize = 10;

    // mock — ganti dengan fetch API kamu
    useEffect(() => {
        setLoading(true);
        const mock: Item[] = [];
        const t = setTimeout(() => {
            setRows(mock);
            setLoading(false);
        }, 250);
        return () => clearTimeout(t);
    }, []);

    // filter by query
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return rows.filter((r) => {
            if (!q) return true;
            return (
                r.namaMaterial.toLowerCase().includes(q) ||
                (r.merk ?? '').toLowerCase().includes(q)
            );
        });
    }, [rows, query]);

    // paging (client)
    const pageStart = (page - 1) * pageSize;
    const paged = filtered.slice(pageStart, pageStart + pageSize);

    const handleExportCsv = () => {
        const header = [
            'namaMaterial',
            'merk',
            'dimensi',
            'berat',
            'penggunaan',
            'visualQc',
            'dimensiQc',
            'fungsiQc',
            'suhuKelembapan',
            'posisiPeletakan',
            'keamananPerlindungan',
            'shelfLife',
        ];
        const csv =
            [header.join(',')]
                .concat(
                    filtered.map((r) =>
                        [
                            r.namaMaterial,
                            r.merk ?? '',
                            r.dimensi ?? '',
                            r.berat ?? '',
                            r.penggunaan ?? '',
                            r.visualQc ?? '',
                            r.dimensiQc ?? '',
                            r.fungsiQc ?? '',
                            r.suhuKelembapan ?? '',
                            r.posisiPeletakan ?? '',
                            r.keamananPerlindungan ?? '',
                            r.shelfLife ?? '',
                        ]
                            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
                            .join(','),
                    ),
                )
                .join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'items.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <main className="p-4">
            <ItemTable
                data={paged}
                loading={loading}
                query={query}
                onQueryChange={setQuery}
                page={page}
                pageSize={pageSize}
                total={filtered.length}
                onPageChange={setPage}
                onAdd={() => alert('Tambah Item')}
                onExportCsv={handleExportCsv}
                onRowClick={(r) => alert(`Open item ${r.id}`)}
            />
        </main>
    );
}
