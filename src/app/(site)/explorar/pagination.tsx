'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils/cn';

export function Pagination({
  page,
  totalPages,
  total,
}: {
  page: number;
  totalPages: number;
  total: number;
}) {
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function hrefFor(target: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (target <= 1) params.delete('pagina');
    else params.set('pagina', String(target));
    return `/explorar${params.toString() ? `?${params}` : ''}`;
  }

  const linkClass =
    'inline-flex h-10 items-center gap-1.5 rounded-md border border-ink-200 px-3.5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';

  return (
    <nav
      aria-label="Paginação dos resultados"
      className="mt-8 flex items-center justify-between gap-3 border-t border-ink-100 pt-6"
    >
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={linkClass} rel="prev">
          <Icon name="chevronLeft" size={16} />
          Anterior
        </Link>
      ) : (
        <span className={cn(linkClass, 'pointer-events-none opacity-40')}>
          <Icon name="chevronLeft" size={16} />
          Anterior
        </span>
      )}

      <p className="text-sm text-ink-600" aria-live="polite">
        Página {page} de {totalPages}
        <span className="sr-only"> — {total} espécies no total</span>
      </p>

      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className={linkClass} rel="next">
          Próxima
          <Icon name="chevronRight" size={16} />
        </Link>
      ) : (
        <span className={cn(linkClass, 'pointer-events-none opacity-40')}>
          Próxima
          <Icon name="chevronRight" size={16} />
        </span>
      )}
    </nav>
  );
}
