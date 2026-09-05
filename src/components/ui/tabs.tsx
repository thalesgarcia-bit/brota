'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import { cn } from '@/lib/utils/cn';

export type TabItem = {
  key: string;
  label: string;
  count?: number;
};

/**
 * Abas navegáveis por URL (?aba=...). Manter o estado na URL preserva a aba
 * ao recarregar, ao compartilhar o link e ao voltar pelo histórico.
 */
export function LinkTabs({
  items,
  paramName = 'aba',
  className,
  ariaLabel,
}: {
  items: TabItem[];
  paramName?: string;
  className?: string;
  ariaLabel: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get(paramName) ?? items[0]?.key;

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'scroll-x -mx-4 flex gap-1 border-b border-ink-200 px-4 sm:mx-0 sm:px-0',
        className,
      )}
    >
      {items.map((item) => {
        const params = new URLSearchParams(searchParams.toString());
        if (item.key === items[0]?.key) params.delete(paramName);
        else params.set(paramName, item.key);
        const query = params.toString();
        const isActive = active === item.key;

        return (
          <Link
            key={item.key}
            href={query ? `${pathname}?${query}` : pathname}
            role="tab"
            aria-selected={isActive}
            scroll={false}
            className={cn(
              '-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
              'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-600',
              isActive
                ? 'border-brand-600 text-brand-800'
                : 'border-transparent text-ink-500 hover:border-ink-300 hover:text-ink-800',
            )}
          >
            {item.label}
            {item.count !== undefined ? (
              <span
                className={cn(
                  'ml-1.5 rounded-full px-1.5 py-0.5 text-2xs',
                  isActive ? 'bg-brand-100 text-brand-800' : 'bg-ink-100 text-ink-600',
                )}
              >
                {item.count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
