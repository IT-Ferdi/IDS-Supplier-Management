'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-context';
import Sidebar from '@/components/layout/sidebar';

export default function WithShellLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    // Redirect to /login if not authenticated
    useEffect(() => {
        if (!isLoading && !user) {
            // preserve where the user wanted to go
            const next = encodeURIComponent(pathname || '/supplier');
            router.replace(`/login?next=${next}`);
        }
    }, [isLoading, user, pathname, router]);

    if (isLoading) {
        return (
            <div className="min-h-dvh grid place-items-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-transparent" />
            </div>
        );
    }

    if (!user) return null; // waiting for redirect

    // Fixed sidebar + content that scrolls
    return (
        <div className="min-h-dvh bg-slate-50">
            {/* fixed sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 border-r border-slate-200 bg-white transition-[width] ${collapsed ? 'w-16' : 'w-64'
                    }`}
            >
                <Sidebar isCollapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
            </aside>

            {/* content */}
            <main
                className={`min-h-dvh transition-[margin-left] ${collapsed ? 'ml-16' : 'ml-64'
                    } p-4`}
            >
                {/* page content scrolls, sidebar does not */}
                <div className="mx-auto max-w-[1600px]">{children}</div>
            </main>
        </div>
    );
}
