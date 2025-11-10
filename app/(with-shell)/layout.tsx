'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-context';
import Sidebar from '@/components/layout/sidebar';

export default function WithShellLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    // gunakan constant supaya mudah disesuaikan
    const SIDEBAR_W = 256; // px when expanded (same as w-64)
    const SIDEBAR_COLLAPSED_W = 64; // px when collapsed (same as w-16)

    // baca preferensi collapse dari localStorage (fallback false)
    const [collapsed, setCollapsed] = useState<boolean>(() => {
        try {
            const v = typeof window !== 'undefined' ? localStorage.getItem('layout.collapsed') : null;
            return v === '1';
        } catch {
            return false;
        }
    });

    // Redirect to /login if not authenticated
    useEffect(() => {
        if (!isLoading && !user) {
            const next = encodeURIComponent(pathname || '/supplier');
            router.replace(`/login?next=${next}`);
        }
    }, [isLoading, user, pathname, router]);

    // persist collapse state
    useEffect(() => {
        try {
            localStorage.setItem('layout.collapsed', collapsed ? '1' : '0');
        } catch { }
    }, [collapsed]);

    if (isLoading) {
        return (
            <div className="min-h-[100dvh] grid place-items-center">
                <div
                    className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-transparent"
                    role="status"
                    aria-label="Loading"
                />
            </div>
        );
    }

    if (!user) return null; // sedang redirect

    return (
        <div className="min-h-[100dvh] bg-slate-50" style={{ paddingLeft: 0 }}>
            {/* fixed sidebar container: kita tetap render Sidebar di dalam aside
          gunakan inline style width supaya main margin selalu sinkron */}
            <aside
                aria-label="Primary sidebar"
                className="fixed inset-y-0 left-0 z-40 border-r border-slate-200 bg-white transition-[width] ease-out"
                style={{ width: collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_W }}
            >
                <Sidebar isCollapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
            </aside>

            {/* main content */}
            <main
                className="min-h-[100dvh] transition-[margin-left] ease-out"
                style={{
                    marginLeft: collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_W,
                    // padding lebih compact: horizontal kecil, vertical kecil
                }}
            >
                {/* container supaya konten tidak melebar gila; gunakan safe-area inset */}
                <div
                    className="mx-auto w-full"
                >
                    {children}
                </div>
            </main>
        </div>
    );
}
