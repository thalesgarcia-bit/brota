'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Role } from '@/generated/prisma/client';

import { BrotaLogo } from '@/components/ui/logo';
import { Icon } from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';
import { ADMIN_NAV } from '@/components/layout/navigation';

/** Áreas que só o administrador acessa. Moderador vê apenas moderação. */
const ADMIN_ONLY = new Set([
  '/admin/plantas',
  '/admin/sugestoes',
  '/admin/conteudos',
  '/admin/estabelecimentos',
  '/admin/usuarios',
  '/admin/configuracoes',
  '/admin/logs',
]);

export function AdminNav({
  role,
  badges,
}: {
  role: Role;
  badges: Record<string, number>;
}) {
  const pathname = usePathname();
  const [openOnMobile, setOpenOnMobile] = useState(false);

  const items = ADMIN_NAV.filter(
    (item) => role === 'ADMIN' || !ADMIN_ONLY.has(item.href),
  );

  const list = (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const isActive =
          item.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(item.href);
        const count = badges[item.href] ?? 0;

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={() => setOpenOnMobile(false)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-600',
                isActive
                  ? 'bg-brand-50 text-brand-800'
                  : 'text-ink-700 hover:bg-ink-100',
              )}
            >
              <Icon name={item.icon} size={18} />
              <span className="flex-1">{item.label}</span>
              {count > 0 ? (
                <Badge tone={count > 0 ? 'warning' : 'neutral'}>{count}</Badge>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden w-64 shrink-0 border-r border-ink-200 bg-white lg:block">
        <div className="sticky top-0 flex h-dvh flex-col">
          <div className="flex items-center gap-2.5 px-5 py-5">
            <BrotaLogo size="sm" />
            <Badge tone="neutral">Admin</Badge>
          </div>
          <nav aria-label="Navegação administrativa" className="flex-1 overflow-y-auto px-3 pb-4">
            {list}
          </nav>
        </div>
      </aside>

      {/* Mobile */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-200 bg-white pb-safe lg:hidden">
        <button
          type="button"
          onClick={() => setOpenOnMobile((value) => !value)}
          aria-expanded={openOnMobile}
          aria-controls="admin-nav-mobile"
          className="flex w-full items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium text-ink-700"
        >
          <Icon name={openOnMobile ? 'close' : 'menu'} size={18} />
          {openOnMobile ? 'Fechar menu' : 'Áreas do painel'}
        </button>
      </div>

      {openOnMobile ? (
        <div
          id="admin-nav-mobile"
          className="fixed inset-0 z-20 bg-white pt-16 pb-20 lg:hidden"
        >
          <nav
            aria-label="Navegação administrativa"
            className="h-full overflow-y-auto px-4"
          >
            {list}
          </nav>
        </div>
      ) : null}
    </>
  );
}
