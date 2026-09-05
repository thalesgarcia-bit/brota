'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils/cn';
import { BrotaLogo } from '@/components/ui/logo';
import { ButtonLink } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { MAIN_NAV } from './navigation';

/** Navegação lateral do desktop. */
export function Sidebar({
  isAuthenticated,
  isStaff,
}: {
  isAuthenticated: boolean;
  isStaff: boolean;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-ink-200 bg-white lg:block">
      <div className="sticky top-0 flex h-dvh flex-col">
        <div className="px-5 py-5">
          <Link
            href={isAuthenticated ? '/feed' : '/'}
            className="inline-flex rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            <BrotaLogo size="md" />
            <span className="sr-only">BROTA — página inicial</span>
          </Link>
        </div>

        <nav aria-label="Navegação principal" className="flex-1 overflow-y-auto px-3">
          <ul className="space-y-0.5">
            {MAIN_NAV.filter((item) => item.href !== '/publicar').map((item) => {
              const href = item.requiresAuth && !isAuthenticated ? '/entrar' : item.href;
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <li key={item.href}>
                  <Link
                    href={href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                      'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-600',
                      isActive
                        ? 'bg-brand-50 text-brand-800'
                        : 'text-ink-700 hover:bg-ink-100',
                    )}
                  >
                    <Icon name={item.icon} size={19} strokeWidth={isActive ? 2 : 1.75} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {isStaff ? (
            <>
              <hr className="my-3 border-ink-100" />
              <Link
                href="/admin"
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                  pathname.startsWith('/admin')
                    ? 'bg-brand-50 text-brand-800'
                    : 'text-ink-700 hover:bg-ink-100',
                )}
              >
                <Icon name="shield" size={19} />
                Administração
              </Link>
            </>
          ) : null}
        </nav>

        <div className="border-t border-ink-100 p-4">
          {isAuthenticated ? (
            <ButtonLink href="/publicar" iconLeft="plus" fullWidth>
              Publicar
            </ButtonLink>
          ) : (
            <div className="space-y-2">
              <ButtonLink href="/cadastro" fullWidth>
                Criar conta
              </ButtonLink>
              <ButtonLink href="/entrar" variant="outline" fullWidth>
                Entrar
              </ButtonLink>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
