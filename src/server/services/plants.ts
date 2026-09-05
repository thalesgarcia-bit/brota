import 'server-only';

import type { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import { normalizeSearch } from '@/lib/utils/slug';
import type { PlantSearchInput } from '@/lib/validation/plant';
import type { PlantSnapshot } from '@/domain/recommendation/types';

export const PLANT_CARD_SELECT = {
  id: true,
  slug: true,
  scientificName: true,
  family: true,
  light: true,
  water: true,
  size: true,
  difficulty: true,
  isNative: true,
  toxicityCats: true,
  toxicityDogs: true,
  toxicityHumans: true,
  dataQuality: true,
  commonNames: {
    where: { isPrimary: true },
    select: { name: true },
    take: 1,
  },
  images: {
    where: { isPrimary: true },
    select: { url: true, alt: true },
    take: 1,
  },
} satisfies Prisma.PlantSelect;

export type PlantCardData = Prisma.PlantGetPayload<{
  select: typeof PLANT_CARD_SELECT;
}>;

const PAGE_SIZE = 24;

/** Converte os filtros validados da URL em uma cláusula Prisma. */
function buildWhere(filters: PlantSearchInput): Prisma.PlantWhereInput {
  const where: Prisma.PlantWhereInput = { status: 'PUBLISHED' };
  const and: Prisma.PlantWhereInput[] = [];

  if (filters.q) {
    const term = normalizeSearch(filters.q);
    and.push({
      OR: [
        { searchText: { contains: term } },
        { scientificName: { contains: filters.q, mode: 'insensitive' } },
        {
          commonNames: {
            some: { name: { contains: filters.q, mode: 'insensitive' } },
          },
        },
      ],
    });
  }

  if (filters.luz.length) and.push({ light: { in: filters.luz } });
  if (filters.agua.length) and.push({ water: { in: filters.agua } });
  if (filters.porte.length) and.push({ size: { in: filters.porte } });
  if (filters.dificuldade.length) {
    and.push({ difficulty: { in: filters.dificuldade } });
  }
  if (filters.ambiente.length) {
    and.push({ environments: { some: { kind: { in: filters.ambiente } } } });
  }
  if (filters.categoria.length) {
    and.push({
      categories: { some: { category: { slug: { in: filters.categoria } } } },
    });
  }
  if (filters.nativas) and.push({ isNative: true });

  // "Seguro para pets" exclui o desconhecido: na dúvida, não afirmamos que é seguro.
  if (filters.petFriendly) {
    and.push({ toxicityCats: 'NONE', toxicityDogs: 'NONE' });
  }
  if (filters.criancas) {
    and.push({ toxicityHumans: 'NONE' });
  }

  if (and.length) where.AND = and;
  return where;
}

function buildOrderBy(
  ordenar: PlantSearchInput['ordenar'],
): Prisma.PlantOrderByWithRelationInput[] {
  switch (ordenar) {
    case 'nome':
      return [{ scientificName: 'asc' }];
    case 'facilidade':
      return [{ difficulty: 'asc' }, { scientificName: 'asc' }];
    case 'recentes':
      return [{ publishedAt: 'desc' }];
    default:
      return [{ difficulty: 'asc' }, { scientificName: 'asc' }];
  }
}

export async function searchPlants(filters: PlantSearchInput) {
  const where = buildWhere(filters);
  const skip = (filters.pagina - 1) * PAGE_SIZE;

  const [items, total] = await Promise.all([
    prisma.plant.findMany({
      where,
      select: PLANT_CARD_SELECT,
      orderBy: buildOrderBy(filters.ordenar),
      skip,
      take: PAGE_SIZE,
    }),
    prisma.plant.count({ where }),
  ]);

  return {
    items,
    total,
    page: filters.pagina,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getPlantBySlug(slug: string) {
  return prisma.plant.findFirst({
    where: { slug, status: 'PUBLISHED' },
    include: {
      commonNames: { orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }] },
      images: { orderBy: [{ isPrimary: 'desc' }, { position: 'asc' }] },
      sources: true,
      environments: true,
      problems: true,
      categories: { include: { category: true } },
      similarTo: {
        include: {
          to: { select: PLANT_CARD_SELECT },
        },
      },
    },
  });
}

export type PlantDetail = NonNullable<Awaited<ReturnType<typeof getPlantBySlug>>>;

export async function getPlantCategories() {
  return prisma.plantCategory.findMany({
    orderBy: { position: 'asc' },
    include: { _count: { select: { plants: true } } },
  });
}

/** Sugestões do autocomplete da busca. */
export async function suggestPlants(term: string, limit = 8) {
  if (term.trim().length < 2) return [];

  const normalized = normalizeSearch(term);

  return prisma.plant.findMany({
    where: {
      status: 'PUBLISHED',
      OR: [
        { searchText: { contains: normalized } },
        { scientificName: { contains: term, mode: 'insensitive' } },
      ],
    },
    select: {
      slug: true,
      scientificName: true,
      commonNames: { where: { isPrimary: true }, select: { name: true }, take: 1 },
    },
    take: limit,
    orderBy: { scientificName: 'asc' },
  });
}

/** Carrega o recorte que o motor de recomendação consome. */
export async function loadPlantSnapshots(): Promise<PlantSnapshot[]> {
  const plants = await prisma.plant.findMany({
    where: { status: 'PUBLISHED' },
    select: {
      id: true,
      slug: true,
      scientificName: true,
      light: true,
      water: true,
      humidity: true,
      size: true,
      growthRate: true,
      difficulty: true,
      tempMinC: true,
      tempMaxC: true,
      toxicityHumans: true,
      toxicityDogs: true,
      toxicityCats: true,
      isNative: true,
      flowering: true,
      commonNames: {
        where: { isPrimary: true },
        select: { name: true },
        take: 1,
      },
      environments: { select: { kind: true } },
      categories: { select: { category: { select: { slug: true } } } },
    },
  });

  return plants.map((plant) => ({
    id: plant.id,
    slug: plant.slug,
    scientificName: plant.scientificName,
    primaryCommonName: plant.commonNames[0]?.name ?? plant.scientificName,
    light: plant.light,
    water: plant.water,
    humidity: plant.humidity,
    size: plant.size,
    growthRate: plant.growthRate,
    difficulty: plant.difficulty,
    tempMinC: plant.tempMinC,
    tempMaxC: plant.tempMaxC,
    toxicityHumans: plant.toxicityHumans,
    toxicityDogs: plant.toxicityDogs,
    toxicityCats: plant.toxicityCats,
    isNative: plant.isNative,
    environments: plant.environments.map((item) => item.kind),
    categorySlugs: plant.categories.map((item) => item.category.slug),
    hasFlowering: Boolean(plant.flowering),
  }));
}

/** Encontra uma espécie da base a partir do nome científico devolvido pela IA. */
export async function findPlantByScientificName(scientificName: string) {
  return prisma.plant.findFirst({
    where: {
      scientificName: { equals: scientificName, mode: 'insensitive' },
    },
    select: { id: true, slug: true, scientificName: true },
  });
}

export async function getDailyPlant() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const featured = await prisma.dailyPlant.findUnique({
    where: { date: today },
    include: { plant: { select: PLANT_CARD_SELECT } },
  });

  if (featured) return featured;

  // Sem curadoria para hoje, escolhe de forma determinística pela data.
  const total = await prisma.plant.count({ where: { status: 'PUBLISHED' } });
  if (total === 0) return null;

  const dayNumber = Math.floor(today.getTime() / 86_400_000);
  const plant = await prisma.plant.findFirst({
    where: { status: 'PUBLISHED' },
    select: PLANT_CARD_SELECT,
    orderBy: { slug: 'asc' },
    skip: dayNumber % total,
  });

  return plant ? { date: today, curiosity: null, plant } : null;
}
