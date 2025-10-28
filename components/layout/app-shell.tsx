// components/layout/app-shell.tsx
'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/layout/sidebar'; // your sidebar file

export default function AppShell({ children }: { children: React.ReactNode }) {
    // persist collapsed state across reloads
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        const v = localStorage.getItem('sidebar:collapsed');
        if (v) setCollapsed(v === '1');
    }, []);
    useEffect(() => {
        localStorage.setItem('sidebar:collapsed', collapsed ? '1' : '0');
    }, [collapsed]);

    return (
        // Fill the viewport and prevent the page itself from scrolling
        <div className="h-[100dvh] w-[100dvw] overflow-hidden bg-slate-50">
            <div className="flex h-full">
                {/* Sidebar column: fixed height, does NOT scroll with content */}
                <div className="sticky left-0 top-0 h-full z-30">
                    <Sidebar
                        isCollapsed={collapsed}
                        onToggle={() => setCollapsed((v) => !v)}
                    />
                </div>

                {/* Main content: the ONLY scroll area */}
                <main
                    className={[
                        'flex-1 h-full overflow-auto',
                        'px-4 py-4',
                    ].join(' ')}
                    // Optional: pad content more when collapsed to keep visuals balanced
                    style={{ transition: 'padding .2s ease' }}
                >
                    {children}
                </main>
            </div>
        </div>
    );
}
