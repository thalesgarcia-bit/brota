'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { prisma } from '@/lib/db/prisma';
import { assertPermission, AuthorizationError } from '@/lib/auth/session';
import { plantFormWithRulesSchema } from '@/lib/validation/plant';
import { normalizeSearch, slugify } from '@/lib/utils/slug';

export type PlantFormState = {
  status: 'idle' | 'error' | 'success';
  message?: string;
  fieldErrors?: Record<string, string>;
};

export const INITIAL_PLANT_FORM_STATE: PlantFormState = { status: 'idle' };

function toList(value: FormDataEntryValue | null): string[] {
  if (typeof value !== 'string' || !value.trim()) return [];
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildSearchText(input: {
  scientificName: string;
  family: string;
  genus: string;
  commonNames: string[];
}): string {
  return normalizeSearch(
    [input.scientificName, input.family, input.genus, ...input.commonNames].join(' '),
  );
}

/**
 * Cadastro e edição de espécies.
 *
 * Campos estruturados, nunca uma descrição gigante guardando tudo. A regra de
 * publicação (fonte obrigatória) é aplicada no schema, no servidor.
 */
export async function savePlantAction(
  _previous: PlantFormState,
  formData: FormData,
): Promise<PlantFormState> {
  let staff;
  try {
    staff = await assertPermission('admin:manage_plants');
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { status: 'error', message: error.message };
    }
    throw error;
  }

  const id = String(formData.get('id') ?? '') || null;
  const commonNames = toList(formData.get('commonNames'));
  const scientificName = String(formData.get('scientificName') ?? '').trim();

  const sourceTitles = formData.getAll('sourceTitle').map(String);
  const sourceUrls = formData.getAll('sourceUrl').map(String);

  const sources = sourceTitles
    .map((title, index) => ({
      title: title.trim(),
      url: (sourceUrls[index] ?? '').trim() || null,
      publisher: null,
    }))
    .filter((source) => source.title.length > 1);

  const raw = {
    slug:
      String(formData.get('slug') ?? '').trim() ||
      slugify(commonNames[0] ?? scientificName),
    scientificName,
    family: String(formData.get('family') ?? '').trim(),
    genus:
      String(formData.get('genus') ?? '').trim() ||
      scientificName.split(' ')[0] ||
      '',
    origin: String(formData.get('origin') ?? '').trim() || null,
    description: String(formData.get('description') ?? '').trim(),
    commonNames,
    light: formData.get('light'),
    water: formData.get('water'),
    humidity: formData.get('humidity'),
    tempMinC: formData.get('tempMinC') || null,
    tempMaxC: formData.get('tempMaxC') || null,
    substrate: String(formData.get('substrate') ?? '').trim() || null,
    fertilization: String(formData.get('fertilization') ?? '').trim() || null,
    pruning: String(formData.get('pruning') ?? '').trim() || null,
    propagation: String(formData.get('propagation') ?? '').trim() || null,
    flowering: String(formData.get('flowering') ?? '').trim() || null,
    size: formData.get('size'),
    growthRate: formData.get('growthRate'),
    difficulty: formData.get('difficulty'),
    toxicityHumans: formData.get('toxicityHumans') ?? 'UNKNOWN',
    toxicityDogs: formData.get('toxicityDogs') ?? 'UNKNOWN',
    toxicityCats: formData.get('toxicityCats') ?? 'UNKNOWN',
    toxicityNote: String(formData.get('toxicityNote') ?? '').trim() || null,
    commonProblems: String(formData.get('commonProblems') ?? '').trim() || null,
    commonPests: String(formData.get('commonPests') ?? '').trim() || null,
    commonMistakes: String(formData.get('commonMistakes') ?? '').trim() || null,
    curiosity: String(formData.get('curiosity') ?? '').trim() || null,
    isNative: formData.get('isNative') === 'on',
    isAirPurifying: formData.get('isAirPurifying') === 'on',
    categorySlugs: formData.getAll('categorySlugs').map(String),
    environments: formData.getAll('environments').map(String),
    status: formData.get('status') ?? 'DRAFT',
    dataQuality: formData.get('dataQuality') ?? 'SEED_UNREVIEWED',
    sources,
    images: [],
  };

  const parsed = plantFormWithRulesSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? 'form');
      fieldErrors[key] ??= issue.message;
    }
    return {
      status: 'error',
      message: 'Confira os campos destacados.',
      fieldErrors,
    };
  }

  const data = parsed.data;

  const slugTaken = await prisma.plant.findFirst({
    where: { slug: data.slug, ...(id ? { id: { not: id } } : {}) },
    select: { id: true },
  });

  if (slugTaken) {
    return {
      status: 'error',
      message: 'Já existe uma espécie com esse endereço.',
      fieldErrors: { slug: 'Esse slug já está em uso.' },
    };
  }

  const categories = await prisma.plantCategory.findMany({
    where: { slug: { in: data.categorySlugs } },
    select: { id: true },
  });

  const plantData = {
    slug: data.slug,
    scientificName: data.scientificName,
    family: data.family,
    genus: data.genus,
    origin: data.origin,
    description: data.description,
    light: data.light,
    water: data.water,
    humidity: data.humidity,
    tempMinC: data.tempMinC,
    tempMaxC: data.tempMaxC,
    substrate: data.substrate,
    fertilization: data.fertilization,
    pruning: data.pruning,
    propagation: data.propagation,
    flowering: data.flowering,
    size: data.size,
    growthRate: data.growthRate,
    difficulty: data.difficulty,
    toxicityHumans: data.toxicityHumans,
    toxicityDogs: data.toxicityDogs,
    toxicityCats: data.toxicityCats,
    toxicityNote: data.toxicityNote,
    commonProblems: data.commonProblems,
    commonPests: data.commonPests,
    commonMistakes: data.commonMistakes,
    curiosity: data.curiosity,
    isNative: data.isNative,
    isAirPurifying: data.isAirPurifying,
    status: data.status,
    dataQuality: data.dataQuality,
    publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
    searchText: buildSearchText(data),
  };

  const before = id
    ? await prisma.plant.findUnique({ where: { id }, select: { slug: true, status: true } })
    : null;

  const plant = id
    ? await prisma.plant.update({ where: { id }, data: plantData })
    : await prisma.plant.create({
        data: { ...plantData, createdById: staff.id },
      });

  await prisma.plantCommonName.deleteMany({ where: { plantId: plant.id } });
  await prisma.plantCommonName.createMany({
    data: data.commonNames.map((name, index) => ({
      plantId: plant.id,
      name,
      isPrimary: index === 0,
    })),
  });

  await prisma.plantEnvironment.deleteMany({ where: { plantId: plant.id } });
  await prisma.plantEnvironment.createMany({
    data: data.environments.map((kind) => ({ plantId: plant.id, kind })),
  });

  await prisma.plantCategoryLink.deleteMany({ where: { plantId: plant.id } });
  if (categories.length > 0) {
    await prisma.plantCategoryLink.createMany({
      data: categories.map((category) => ({
        plantId: plant.id,
        categoryId: category.id,
      })),
    });
  }

  await prisma.plantSource.deleteMany({ where: { plantId: plant.id } });
  if (data.sources.length > 0) {
    await prisma.plantSource.createMany({
      data: data.sources.map((source) => ({
        plantId: plant.id,
        title: source.title,
        url: source.url,
        publisher: source.publisher,
        accessedAt: new Date(),
      })),
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: staff.id,
      action: id ? 'plant.update' : 'plant.create',
      entityType: 'Plant',
      entityId: plant.id,
      before: before ?? undefined,
      after: { slug: plant.slug, status: plant.status },
    },
  });

  revalidatePath('/admin/plantas');
  revalidatePath('/explorar');
  revalidatePath(`/plantas/${plant.slug}`);

  redirect(`/admin/plantas/${plant.id}?salvo=1`);
}

export async function deletePlantAction(plantId: string): Promise<void> {
  const staff = await assertPermission('admin:manage_plants');

  const plant = await prisma.plant.findUnique({
    where: { id: plantId },
    select: { slug: true },
  });
  if (!plant) return;

  // Arquivar, nunca apagar: fichas podem estar ligadas a jardins e publicações.
  await prisma.plant.update({
    where: { id: plantId },
    data: { status: 'ARCHIVED' },
  });

  await prisma.auditLog.create({
    data: {
      actorId: staff.id,
      action: 'plant.archive',
      entityType: 'Plant',
      entityId: plantId,
    },
  });

  revalidatePath('/admin/plantas');
  redirect('/admin/plantas');
}
