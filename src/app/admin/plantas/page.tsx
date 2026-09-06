import type { Metadata } from 'next';
import Link from 'next/link';

import { requirePermission } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { ButtonLink } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/feedback';
import { LinkTabs } from '@/components/ui/tabs';
import { DATA_QUALITY, DIFFICULTY, LIGHT } from '@/lib/labels';
import { PlantQualityControl } from '@/components/admin/plant-quality-control';

export const metadata: Metadata = {
  title: 'Plantas',
  robots: { index: false },
};

export default async function AdminPlantsPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string; q?: string }>;
}) {
  await requirePermission('admin:manage_plants', '/admin/plantas');
  const { aba, q } = await searchParams;

  const quality =
    aba === 'revisadas'
      ? 'REVIEWED'
      : aba === 'comunidade'
        ? 'COMMUNITY'
        : aba === 'rascunhos'
          ? undefined
          : 'SEED_UNREVIEWED';

  const plants = await prisma.plant.findMany({
    where: {
      ...(aba === 'rascunhos' ? { status: 'DRAFT' } : {}),
      ...(quality ? { dataQuality: quality } : {}),
      ...(q
        ? {
            OR: [
              { scientificName: { contains: q, mode: 'insensitive' } },
              { commonNames: { some: { name: { contains: q, mode: 'insensitive' } } } },
            ],
          }
        : {}),
    },
    orderBy: { scientificName: 'asc' },
    take: 100,
    select: {
      id: true,
      slug: true,
      scientificName: true,
      family: true,
      light: true,
      difficulty: true,
      status: true,
      dataQuality: true,
      commonNames: { where: { isPrimary: true }, take: 1 },
      _count: { select: { sources: true, images: true } },
    },
  });

  const counts = await prisma.plant.groupBy({
    by: ['dataQuality'],
    _count: { dataQuality: true },
  });

  const countOf = (value: string) =>
    counts.find((item) => item.dataQuality === value)?._count.dataQuality ?? 0;

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl">Plantas</h1>
          <p className="mt-1.5 text-ink-600">
            A base botânica do BROTA. Só publique com fonte.
          </p>
        </div>
        <ButtonLink href="/admin/plantas/nova" iconLeft="plus">
          Nova espécie
        </ButtonLink>
      </header>

      <form action="/admin/plantas" className="mt-5 flex max-w-md gap-2.5" role="search">
        <label htmlFor="busca-admin" className="sr-only">
          Buscar espécie
        </label>
        <input
          id="busca-admin"
          name="q"
          type="search"
          defaultValue={q ?? ''}
          placeholder="Nome científico ou popular"
          className="h-10 flex-1 rounded-md border border-ink-200 bg-white px-3 text-sm focus:border-brand-500 focus:outline-2 focus:outline-brand-500/40"
        />
        <button
          type="submit"
          className="rounded-md border border-ink-200 bg-white px-4 text-sm font-medium text-ink-700 hover:bg-ink-50"
        >
          Buscar
        </button>
      </form>

      <div className="mt-6">
        <LinkTabs
          ariaLabel="Situação das fichas"
          items={[
            {
              key: 'nao-revisadas',
              label: 'Não revisadas',
              count: countOf('SEED_UNREVIEWED'),
            },
            { key: 'comunidade', label: 'Comunidade', count: countOf('COMMUNITY') },
            { key: 'revisadas', label: 'Revisadas', count: countOf('REVIEWED') },
            { key: 'rascunhos', label: 'Rascunhos' },
          ]}
        />
      </div>

      <div className="mt-6">
        {plants.length === 0 ? (
          <EmptyState
            icon="leaf"
            title="Nenhuma espécie nesta situação"
            description="Cadastre uma nova espécie ou mude o filtro acima."
            action={
              <ButtonLink href="/admin/plantas/nova" variant="outline">
                Cadastrar espécie
              </ButtonLink>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-lg border border-ink-200 bg-white">
            {/* Tabela no desktop */}
            <div className="scroll-x hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-200 bg-ink-25">
                    <th scope="col" className="px-4 py-3 text-left font-semibold">
                      Espécie
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold">
                      Família
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold">
                      Cuidado
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold">
                      Fontes
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold">
                      Situação
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {plants.map((plant) => (
                    <tr key={plant.id} className="border-b border-ink-100 last:border-0">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/plantas/${plant.id}`}
                          className="font-medium text-ink-900 hover:text-brand-700"
                        >
                          {plant.commonNames[0]?.name ?? plant.scientificName}
                        </Link>
                        <p className="text-xs text-ink-500 italic">
                          {plant.scientificName}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-ink-600">{plant.family}</td>
                      <td className="px-4 py-3 text-ink-600">
                        {LIGHT[plant.light].short} · {DIFFICULTY[plant.difficulty].label}
                      </td>
                      <td className="px-4 py-3">
                        {plant._count.sources === 0 ? (
                          <Badge tone="warning">Sem fonte</Badge>
                        ) : (
                          <span className="text-ink-600">{plant._count.sources}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <PlantQualityControl
                          plantId={plant.id}
                          quality={plant.dataQuality}
                          hasSources={plant._count.sources > 0}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cartões no mobile */}
            <ul className="divide-y divide-ink-100 md:hidden">
              {plants.map((plant) => (
                <li key={plant.id} className="p-4">
                  <Link
                    href={`/admin/plantas/${plant.id}`}
                    className="font-medium text-ink-900"
                  >
                    {plant.commonNames[0]?.name ?? plant.scientificName}
                  </Link>
                  <p className="text-xs text-ink-500 italic">{plant.scientificName}</p>
                  <p className="mt-1.5 text-xs text-ink-600">
                    {plant.family} · {LIGHT[plant.light].short}
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <Badge tone={DATA_QUALITY[plant.dataQuality].tone}>
                      {DATA_QUALITY[plant.dataQuality].label}
                    </Badge>
                    {plant._count.sources === 0 ? (
                      <Badge tone="warning">Sem fonte</Badge>
                    ) : null}
                  </div>
                  <div className="mt-3">
                    <PlantQualityControl
                      plantId={plant.id}
                      quality={plant.dataQuality}
                      hasSources={plant._count.sources > 0}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
