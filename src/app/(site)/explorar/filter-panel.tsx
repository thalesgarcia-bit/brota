'use client';

import { useState } from 'react';
import Link from 'next/link';

import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { DIFFICULTY, ENVIRONMENT, LIGHT, SIZE, WATER } from '@/lib/labels';
import type { PlantSearchInput } from '@/lib/validation/plant';
import { buildQuery } from './filters';

type Category = { slug: string; name: string; count: number };

type Group = {
  key: keyof PlantSearchInput;
  title: string;
  options: { value: string; label: string }[];
};

/**
 * Filtros do catálogo.
 *
 * Todo filtro é um link: o estado vive na URL. Isso mantém o resultado
 * compartilhável, preserva o histórico do navegador e funciona mesmo se o
 * JavaScript falhar.
 */
export function FilterPanel({
  filters,
  categories,
  resultCount,
}: {
  filters: PlantSearchInput;
  categories: Category[];
  resultCount: number;
}) {
  const [openOnMobile, setOpenOnMobile] = useState(false);

  const groups: Group[] = [
    {
      key: 'ambiente',
      title: 'Ambiente',
      options: Object.entries(ENVIRONMENT).map(([value, info]) => ({
        value,
        label: info.label,
      })),
    },
    {
      key: 'luz',
      title: 'Luminosidade',
      options: Object.entries(LIGHT).map(([value, info]) => ({
        value,
        label: info.short,
      })),
    },
    {
      key: 'agua',
      title: 'Rega',
      options: Object.entries(WATER).map(([value, info]) => ({
        value,
        label: info.short,
      })),
    },
    {
      key: 'porte',
      title: 'Porte',
      options: Object.entries(SIZE).map(([value, info]) => ({
        value,
        label: info.label,
      })),
    },
    {
      key: 'dificuldade',
      title: 'Nível de cuidado',
      options: Object.entries(DIFFICULTY).map(([value, info]) => ({
        value,
        label: info.label,
      })),
    },
    {
      key: 'categoria',
      title: 'Tipo',
      options: categories.map((category) => ({
        value: category.slug,
        label: category.name,
      })),
    },
  ];

  const activeCount =
    filters.ambiente.length +
    filters.luz.length +
    filters.agua.length +
    filters.porte.length +
    filters.dificuldade.length +
    filters.categoria.length +
    (filters.petFriendly ? 1 : 0) +
    (filters.criancas ? 1 : 0) +
    (filters.nativas ? 1 : 0);

  function toggleHref(key: Group['key'], value: string): string {
    const current = filters[key] as string[];
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    return `/explorar${buildQuery(filters, { [key]: next, pagina: null })}`;
  }

  function toggleFlagHref(key: 'pets' | 'criancas' | 'nativas', active: boolean) {
    return `/explorar${buildQuery(filters, { [key]: !active, pagina: null })}`;
  }

  return (
    <div>
      {/* Botão que abre os filtros no mobile */}
      <div className="lg:hidden">
        <Button
          variant="outline"
          iconLeft="filter"
          fullWidth
          onClick={() => setOpenOnMobile((value) => !value)}
          aria-expanded={openOnMobile}
          aria-controls="painel-filtros"
        >
          Filtros
          {activeCount > 0 ? (
            <span className="ml-1 rounded-full bg-brand-600 px-1.5 py-0.5 text-2xs font-semibold text-white">
              {activeCount}
            </span>
          ) : null}
        </Button>
      </div>

      <aside
        id="painel-filtros"
        aria-label="Filtros do catálogo"
        className={cn(
          'mt-4 space-y-6 lg:mt-0 lg:block',
          openOnMobile ? 'block' : 'hidden',
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-ink-600" aria-live="polite">
            {resultCount} {resultCount === 1 ? 'resultado' : 'resultados'}
          </p>
          {activeCount > 0 ? (
            <Link
              href="/explorar"
              className="text-sm font-medium text-brand-700 underline-offset-2 hover:underline"
            >
              Limpar
            </Link>
          ) : null}
        </div>

        <fieldset>
          <legend className="text-sm font-semibold text-ink-800">
            Segurança e origem
          </legend>
          <ul className="mt-2.5 space-y-1.5">
            {(
              [
                {
                  key: 'pets' as const,
                  label: 'Seguras para cães e gatos',
                  active: filters.petFriendly,
                  hint: 'Mostra apenas espécies confirmadas como não tóxicas.',
                },
                {
                  key: 'criancas' as const,
                  label: 'Seguras para crianças',
                  active: filters.criancas,
                  hint: 'Mostra apenas espécies confirmadas como não tóxicas.',
                },
                {
                  key: 'nativas' as const,
                  label: 'Nativas do Brasil',
                  active: filters.nativas,
                  hint: 'Espécies que ocorrem naturalmente no país.',
                },
              ]
            ).map((item) => (
              <li key={item.key}>
                <Link
                  href={toggleFlagHref(item.key, item.active)}
                  aria-pressed={item.active}
                  title={item.hint}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors',
                    'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-600',
                    item.active
                      ? 'bg-brand-50 font-medium text-brand-800'
                      : 'text-ink-700 hover:bg-ink-50',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'flex h-4 w-4 items-center justify-center rounded-xs border',
                      item.active
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : 'border-ink-300',
                    )}
                  >
                    {item.active ? <Icon name="check" size={11} strokeWidth={3} /> : null}
                  </span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-2 px-2.5 text-xs text-ink-500">
            Espécies sem informação confirmada ficam de fora desses filtros. Na
            dúvida, o BROTA não afirma que é seguro.
          </p>
        </fieldset>

        {groups.map((group) => {
          const selected = filters[group.key] as string[];
          return (
            <fieldset key={String(group.key)}>
              <legend className="text-sm font-semibold text-ink-800">
                {group.title}
              </legend>
              <ul className="mt-2.5 space-y-1">
                {group.options.map((option) => {
                  const active = selected.includes(option.value);
                  return (
                    <li key={option.value}>
                      <Link
                        href={toggleHref(group.key, option.value)}
                        aria-pressed={active}
                        className={cn(
                          'flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors',
                          'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-600',
                          active
                            ? 'bg-brand-50 font-medium text-brand-800'
                            : 'text-ink-700 hover:bg-ink-50',
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            'flex h-4 w-4 items-center justify-center rounded-xs border',
                            active
                              ? 'border-brand-600 bg-brand-600 text-white'
                              : 'border-ink-300',
                          )}
                        >
                          {active ? <Icon name="check" size={11} strokeWidth={3} /> : null}
                        </span>
                        {option.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          );
        })}
      </aside>
    </div>
  );
}
