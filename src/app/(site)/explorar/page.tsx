import type { Metadata } from 'next';

import { plantSearchSchema } from '@/lib/validation/plant';
import { getPlantCategories, searchPlants } from '@/server/services/plants';
import { PlantCard } from '@/components/plants/plant-card';
import { EmptyState } from '@/components/ui/feedback';
import { ButtonLink } from '@/components/ui/button';
import { SearchBar } from './search-bar';
import { FilterPanel } from './filter-panel';
import { Pagination } from './pagination';
import { parseFilters, type SearchParams } from './filters';

export const metadata: Metadata = {
  title: 'Explorar espécies',
  description:
    'Busque plantas por nome popular, nome científico, luminosidade, ambiente, porte e nível de cuidado. Base botânica com fontes citadas.',
  alternates: { canonical: '/explorar' },
};

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const raw = await searchParams;
  const filters = plantSearchSchema.parse(parseFilters(raw));

  const [result, categories] = await Promise.all([
    searchPlants(filters),
    getPlantCategories(),
  ]);

  const hasActiveFilters =
    filters.ambiente.length > 0 ||
    filters.luz.length > 0 ||
    filters.agua.length > 0 ||
    filters.porte.length > 0 ||
    filters.dificuldade.length > 0 ||
    filters.categoria.length > 0 ||
    filters.petFriendly ||
    filters.criancas ||
    filters.nativas;

  return (
    <div className="container-page py-6 sm:py-10">
      <header className="max-w-2xl">
        <h1 className="text-2xl sm:text-3xl">Explorar espécies</h1>
        <p className="mt-2 text-ink-600">
          {result.total > 0
            ? `${result.total} ${result.total === 1 ? 'espécie disponível' : 'espécies disponíveis'} no catálogo.`
            : 'O catálogo ainda está sendo construído.'}
        </p>
      </header>

      <div className="mt-6">
        <SearchBar defaultValue={filters.q} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[16rem_1fr] lg:gap-8">
        <FilterPanel
          filters={filters}
          categories={categories.map((category) => ({
            slug: category.slug,
            name: category.name,
            count: category._count.plants,
          }))}
          resultCount={result.total}
        />

        <div className="min-w-0">
          {result.items.length === 0 ? (
            <EmptyState
              icon="search"
              title="Nenhuma espécie encontrada"
              description={
                hasActiveFilters || filters.q
                  ? 'Tente remover algum filtro ou buscar por outro termo. Se você conhece uma espécie que deveria estar aqui, sugira o cadastro para a equipe.'
                  : 'Ainda não há espécies publicadas no catálogo.'
              }
              action={
                hasActiveFilters || filters.q ? (
                  <ButtonLink href="/explorar" variant="outline">
                    Limpar busca e filtros
                  </ButtonLink>
                ) : null
              }
            />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {result.items.map((plant, index) => (
                  <PlantCard key={plant.id} plant={plant} priority={index < 3} />
                ))}
              </div>

              <Pagination
                page={result.page}
                totalPages={result.totalPages}
                total={result.total}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
