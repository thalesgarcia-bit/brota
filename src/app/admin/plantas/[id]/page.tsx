import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { requirePermission } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { Icon } from '@/components/ui/icon';
import { Alert } from '@/components/ui/feedback';
import { PlantForm } from '@/components/admin/plant-form';
import { PlantActions } from '@/components/admin/plant-actions';

// Consulta o banco a cada requisicao, nunca durante o build (Cloudflare + Prisma).
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Editar espécie',
  robots: { index: false },
};

export default async function EditPlantPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ salvo?: string }>;
}) {
  const { id } = await params;
  const { salvo } = await searchParams;
  await requirePermission('admin:manage_plants', `/admin/plantas/${id}`);

  const [plant, categories] = await Promise.all([
    prisma.plant.findUnique({
      where: { id },
      include: {
        commonNames: { orderBy: { isPrimary: 'desc' } },
        environments: true,
        categories: { include: { category: { select: { slug: true } } } },
        sources: true,
      },
    }),
    prisma.plantCategory.findMany({
      orderBy: { position: 'asc' },
      select: { slug: true, name: true },
    }),
  ]);

  if (!plant) notFound();

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <nav aria-label="Você está em" className="mb-5 text-sm text-ink-500">
        <Link href="/admin/plantas" className="inline-flex items-center gap-1.5 hover:text-brand-700">
          <Icon name="chevronLeft" size={14} />
          Plantas
        </Link>
      </nav>

      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl">
            {plant.commonNames[0]?.name ?? plant.scientificName}
          </h1>
          <p className="mt-1 text-ink-500 italic">{plant.scientificName}</p>
        </div>
        {plant.status === 'PUBLISHED' ? (
          <Link
            href={`/plantas/${plant.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline"
          >
            Ver página pública
            <Icon name="externalLink" size={14} />
          </Link>
        ) : null}
      </header>

      {salvo ? (
        <Alert tone="success" className="mb-5">
          Alterações salvas.
        </Alert>
      ) : null}

      <div className="max-w-3xl">
        <PlantForm
          categories={categories}
          initial={{
            id: plant.id,
            slug: plant.slug,
            scientificName: plant.scientificName,
            commonNames: plant.commonNames.map((item) => item.name).join('\n'),
            family: plant.family,
            genus: plant.genus,
            origin: plant.origin ?? '',
            description: plant.description,
            light: plant.light,
            water: plant.water,
            humidity: plant.humidity,
            tempMinC: plant.tempMinC?.toString() ?? '',
            tempMaxC: plant.tempMaxC?.toString() ?? '',
            substrate: plant.substrate ?? '',
            fertilization: plant.fertilization ?? '',
            pruning: plant.pruning ?? '',
            propagation: plant.propagation ?? '',
            flowering: plant.flowering ?? '',
            size: plant.size,
            growthRate: plant.growthRate,
            difficulty: plant.difficulty,
            toxicityHumans: plant.toxicityHumans,
            toxicityDogs: plant.toxicityDogs,
            toxicityCats: plant.toxicityCats,
            toxicityNote: plant.toxicityNote ?? '',
            commonProblems: plant.commonProblems ?? '',
            commonPests: plant.commonPests ?? '',
            commonMistakes: plant.commonMistakes ?? '',
            curiosity: plant.curiosity ?? '',
            isNative: plant.isNative,
            isAirPurifying: plant.isAirPurifying,
            categorySlugs: plant.categories.map((link) => link.category.slug),
            environments: plant.environments.map((item) => item.kind),
            status: plant.status,
            dataQuality: plant.dataQuality,
            sources: plant.sources.map((source) => ({
              title: source.title,
              url: source.url ?? '',
            })),
          }}
        />

        <PlantActions
          plantId={plant.id}
          nome={plant.commonNames[0]?.name ?? plant.scientificName}
          archived={plant.status === 'ARCHIVED'}
        />
      </div>
    </div>
  );
}
