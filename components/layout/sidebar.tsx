// components/layout/sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Building2,
  Boxes,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  User,
} from 'lucide-react';
import { useAuth } from '@/components/auth/auth-context';
import { Button } from '@/components/ui/button';
import { useEffect, useMemo, useState } from 'react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const baseItem =
    'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md outline-none transition-colors';
  const activeItem = 'text-sky-700 bg-sky-50 ring-1 ring-sky-100';
  const inactiveItem =
    'text-slate-600 hover:text-sky-700 hover:bg-sky-50 focus-visible:ring-2 focus-visible:ring-sky-300';

  const [openSupplier, setOpenSupplier] = useState(false);
  const [openItem, setOpenItem] = useState(false);

  useEffect(() => {
    setOpenSupplier(pathname === '/' || pathname.startsWith('/supplier'));
    setOpenItem(pathname.startsWith('/item'));
  }, [pathname]);

  const onParentClick = (fallbackHref: string, toggle: () => void) => {
    if (isCollapsed) router.push(fallbackHref);
    else toggle();
  };

  const subWrapCls = useMemo(
    () => 'ml-7 space-y-1 overflow-hidden transition-[max-height] duration-200 ease-out',
    []
  );

  return (
    <aside
      className={[
        // sticky + full viewport height makes it stay put (floating)
        'sticky top-0 z-30 h-[100dvh]',
        'flex flex-col border-r border-slate-200 bg-white',
        isCollapsed ? 'w-16' : 'w-64',
      ].join(' ')}
      aria-label="Primary sidebar"
    >
      {/* Brand & Toggle */}
      <div className="border-b p-3">
        <div className="flex items-center justify-between">
          <div className={['flex items-center gap-2', isCollapsed ? 'mx-auto' : ''].join(' ')}>
            <Building2 className="h-6 w-6 text-sky-600" />
            {!isCollapsed && (
              <h1 className="truncate text-sm font-bold tracking-tight">
                IDS Supplier Management
              </h1>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8 p-0 hover:bg-sky-50"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* NAV — only this area scrolls if content is long */}
      <nav className="flex-1 overflow-y-auto p-3">
        {/* Supplier parent */}
        <button
          type="button"
          onClick={() => onParentClick('/supplier', () => setOpenSupplier(v => !v))}
          className={[
            baseItem,
            'w-full justify-between',
            isActive('/supplier') || pathname === '/' ? activeItem : inactiveItem,
            isCollapsed ? 'justify-center' : '',
          ].join(' ')}
          aria-expanded={openSupplier}
          aria-controls="submenu-supplier"
          title={isCollapsed ? 'Supplier' : undefined}
        >
          <span className="flex items-center gap-3">
            <Building2 className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span>Supplier</span>}
          </span>
          {!isCollapsed && (
            <ChevronDown className={['h-4 w-4 transition-transform', openSupplier ? 'rotate-180' : ''].join(' ')} />
          )}
        </button>

        {/* Supplier submenu */}
        {!isCollapsed && (
          <div
            id="submenu-supplier"
            className={subWrapCls}
            style={{ maxHeight: openSupplier ? 120 : 0 }}
          >
            <Link
              href="/supplier"
              aria-current={pathname === '/supplier' || pathname === '/' ? 'page' : undefined}
              className={[baseItem, pathname === '/supplier' || pathname === '/' ? activeItem : inactiveItem].join(' ')}
            >
              List Supplier
            </Link>
            <Link
              href="/supplier/new"
              aria-current={isActive('/supplier/new') ? 'page' : undefined}
              className={[baseItem, isActive('/supplier/new') ? activeItem : inactiveItem].join(' ')}
            >
              Add Supplier
            </Link>
          </div>
        )}

        {/* Item parent */}
        <button
          type="button"
          onClick={() => onParentClick('/item', () => setOpenItem(v => !v))}
          className={[
            baseItem,
            'w-full justify-between',
            isActive('/item') ? activeItem : inactiveItem,
            isCollapsed ? 'justify-center' : '',
          ].join(' ')}
          aria-expanded={openItem}
          aria-controls="submenu-item"
          title={isCollapsed ? 'Item' : undefined}
        >
          <span className="flex items-center gap-3">
            <Boxes className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span>Item</span>}
          </span>
          {!isCollapsed && (
            <ChevronDown className={['h-4 w-4 transition-transform', openItem ? 'rotate-180' : ''].join(' ')} />
          )}
        </button>

        {/* Item submenu */}
        {!isCollapsed && (
          <div
            id="submenu-item"
            className={subWrapCls}
            style={{ maxHeight: openItem ? 120 : 0 }}
          >
            <Link
              href="/item"
              aria-current={pathname === '/item' ? 'page' : undefined}
              className={[baseItem, pathname === '/item' ? activeItem : inactiveItem].join(' ')}
            >
              List Item
            </Link>
            <Link
              href="/item/new"
              aria-current={isActive('/item/new') ? 'page' : undefined}
              className={[baseItem, isActive('/item/new') ? activeItem : inactiveItem].join(' ')}
            >
              Add Item
            </Link>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="mt-auto border-t p-3">
        {!isCollapsed && (
          <div className="mb-2 flex items-center gap-2">
            <User className="h-4 w-4 text-slate-500" />
            <span className="truncate text-sm font-medium">{user?.user_name}</span>
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          className="w-full justify-center gap-2"
          title={isCollapsed ? 'Logout' : undefined}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span>Logout</span>}
        </Button>
      </div>
    </aside>
  );
}
