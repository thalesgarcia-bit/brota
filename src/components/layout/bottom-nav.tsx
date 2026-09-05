'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils/cn';
import { Icon } from '@/components/ui/icon';
import { MAIN_NAV } from './navigation';

/**
 * Barra de navegação inferior do mobile.
 *
 * Aproveita a lógica familiar dos aplicativos sociais sem copiar a aparência
 * de nenhum: o item central é o de publicar, destacado em relevo.
 */
export function BottomNav({ isAuthenticated }: { isAuthenticated: boolean }) {
  const pathname = usePathname();
  const items = MAIN_NAV.filter((item) => item.primary);

  const profileHref = isAuthenticated ? '/perfil' : '/entrar';

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-200 bg-white/95 backdrop-blur-sm pb-safe lg:hidden"
    >
      <ul className="mx-auto flex h-[var(--spacing-tabbar)] max-w-lg items-stretch">
        {items.map((item) => {
          const href = item.requiresAuth && !isAuthenticated ? '/entrar' : item.href;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const isPublish = item.href === '/publicar';

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex h-full flex-col items-center justify-center gap-1 text-2xs font-medium transition-colors',
                  'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-600',
                  isActive ? 'text-brand-700' : 'text-ink-500 hover:text-ink-800',
                )}
              >
                {isPublish ? (
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm">
                    <Icon name="plus" size={20} strokeWidth={2.2} />
                  </span>
                ) : (
                  <Icon name={item.icon} size={22} strokeWidth={isActive ? 2.1 : 1.75} />
                )}
                <span className={cn(isPublish && 'sr-only')}>{item.label}</span>
              </Link>
            </li>
          );
        })}

        <li className="flex-1">
          <Link
            href={profileHref}
            aria-current={pathname.startsWith('/perfil') ? 'page' : undefined}
            className={cn(
              'flex h-full flex-col items-center justify-center gap-1 text-2xs font-medium transition-colors',
              'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-600',
              pathname.startsWith('/perfil')
                ? 'text-brand-700'
                : 'text-ink-500 hover:text-ink-800',
            )}
          >
            <Icon name="user" size={22} />
            <span>Perfil</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
