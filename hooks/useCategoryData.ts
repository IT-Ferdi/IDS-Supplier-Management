'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

/** Bentuk row dari API /api/category */
export type CategoryRow = {
  id: string;
  nama: string;
  parent?: string | null;
  status_group?: number | null; // 1 = header
};

/** Node untuk tree */
export type TreeNode = {
  id: string;
  label: string;
  parentId?: string | null;
  isHeader: boolean;
  children: TreeNode[];
};

/** GET data kategori (flat) */
export function useCategoryRows(opts?: {
  url?: string;
  /** default: 0 (biar selalu fresh saat dev). Set 1 hari untuk prod. */
  staleTimeMs?: number;
  /** default: 'no-store' agar tidak nyangkut cache fetch */
  cache?: RequestCache;
}) {
  const url = opts?.url ?? '/api/category';
  const staleTime = opts?.staleTimeMs ?? 0;
  const cache = opts?.cache ?? 'no-store';

  return useQuery<CategoryRow[], Error>({
    queryKey: ['category', 'rows', url],
    queryFn: async () => {
      const r = await fetch(url, { cache });
      if (!r.ok) throw new Error('Gagal memuat kategori');
      const data = (await r.json()) as CategoryRow[];

      // dedup by id (kalau ada duplikasi)
      const seen = new Set<string>();
      const dedup = data.filter((d) => {
        if (seen.has(d.id)) return false;
        seen.add(d.id);
        return true;
      });
      return dedup;
    },
    staleTime,
  });
}

/** Bangun tree dari flat rows */
export function useCategoryTree(rows?: CategoryRow[]) {
  const roots = useMemo<TreeNode[]>(() => {
    if (!rows?.length) return [];
    const map = new Map<string, TreeNode>();
    const rootList: TreeNode[] = [];

    for (const r of rows) {
      map.set(r.id, {
        id: r.id,
        label: r.nama,
        parentId: r.parent ?? null,
        isHeader: (r.status_group ?? 0) === 1,
        children: [],
      });
    }
    for (const node of map.values()) {
      const parent = node.parentId ? map.get(node.parentId) : undefined;
      if (parent) parent.children.push(node);
      else rootList.push(node);
    }
    const sortRec = (arr: TreeNode[]) => {
      arr.sort((a, b) => a.label.localeCompare(b.label, 'id'));
      arr.forEach((n) => sortRec(n.children));
    };
    sortRec(rootList);
    return rootList;
  }, [rows]);

  const index = useMemo(() => {
    const m = new Map<string, TreeNode>();
    const walk = (n: TreeNode) => {
      m.set(n.id, n);
      n.children.forEach(walk);
    };
    roots.forEach(walk);
    return m;
  }, [roots]);

  return { roots, index };
}
