/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

import { loadEnvFiles } from './load-env';
import { ACHIEVEMENTS, CATEGORIES } from './data/categories';
import { ARTICLES } from './data/articles';
import { PLANTS } from './data/plants';

/* ===========================================================================
 * SEED
 *
 * Popula o banco com o mínimo necessário para o sistema funcionar de verdade:
 * categorias, conquistas, uma conta administrativa, a base botânica inicial e
 * os conteúdos educativos.
 *
 * Todas as espécies entram com dataQuality = SEED_UNREVIEWED. A interface exibe
 * esse estado abertamente até que um administrador revise o registro.
 *
 * Nenhum usuário fictício, nenhuma publicação falsa, nenhum número inventado:
 * o feed começa vazio, com o estado desenhado para isso.
 * =========================================================================== */

loadEnvFiles();

const prisma = new PrismaClient();

function buildSearchText(plant: {
  scientificName: string;
  commonNames: string[];
  family: string;
  genus: string;
}): string {
  return [plant.scientificName, plant.family, plant.genus, ...plant.commonNames]
    .join(' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

async function seedCategories() {
  for (const category of CATEGORIES) {
    await prisma.plantCategory.upsert({
      where: { slug: category.slug },
      create: category,
      update: {
        name: category.name,
        description: category.description,
        position: category.position,
      },
    });
  }
  console.log(`  ✓ ${CATEGORIES.length} categorias`);
}

async function seedAchievements() {
  for (const achievement of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { slug: achievement.slug },
      create: achievement,
      update: achievement,
    });
  }
  console.log(`  ✓ ${ACHIEVEMENTS.length} conquistas`);
}

async function seedAdmin(): Promise<string> {
  const email = (process.env.SEED_ADMIN_EMAIL ?? 'admin@brota.local').toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'brota-admin-2026';
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      role: 'ADMIN',
      emailVerified: new Date(),
      profile: {
        create: {
          username: 'equipe',
          displayName: 'Equipe BROTA',
          bio: 'Conta administrativa do BROTA.',
          isPublic: true,
        },
      },
    },
    update: { role: 'ADMIN' },
  });

  console.log(`  ✓ administrador: ${email}`);
  return user.id;
}

async function seedPlants(authorId: string) {
  const categories = await prisma.plantCategory.findMany();
  const categoryBySlug = new Map(categories.map((item) => [item.slug, item.id]));

  for (const plant of PLANTS) {
    const data = {
      scientificName: plant.scientificName,
      family: plant.family,
      genus: plant.genus,
      origin: plant.origin,
      description: plant.description,
      light: plant.light,
      water: plant.water,
      humidity: plant.humidity,
      tempMinC: plant.tempMinC,
      tempMaxC: plant.tempMaxC,
      substrate: plant.substrate,
      fertilization: plant.fertilization,
      pruning: plant.pruning,
      propagation: plant.propagation,
      flowering: plant.flowering,
      size: plant.size,
      growthRate: plant.growthRate,
      difficulty: plant.difficulty,
      toxicityHumans: plant.toxicityHumans,
      toxicityDogs: plant.toxicityDogs,
      toxicityCats: plant.toxicityCats,
      toxicityNote: plant.toxicityNote,
      commonProblems: plant.commonProblems,
      commonPests: plant.commonPests,
      commonMistakes: plant.commonMistakes,
      curiosity: plant.curiosity,
      isNative: plant.isNative,
      isAirPurifying: plant.isAirPurifying,
      status: 'PUBLISHED' as const,
      dataQuality: 'SEED_UNREVIEWED' as const,
      publishedAt: new Date(),
      createdById: authorId,
      searchText: buildSearchText(plant),
    };

    const record = await prisma.plant.upsert({
      where: { slug: plant.slug },
      create: { slug: plant.slug, ...data },
      update: data,
    });

    // Relações são reescritas por completo para que o seed seja idempotente.
    await prisma.plantCommonName.deleteMany({ where: { plantId: record.id } });
    await prisma.plantCommonName.createMany({
      data: plant.commonNames.map((name, index) => ({
        plantId: record.id,
        name,
        isPrimary: index === 0,
      })),
    });

    await prisma.plantSource.deleteMany({ where: { plantId: record.id } });
    await prisma.plantSource.createMany({
      data: plant.sources.map((source) => ({
        plantId: record.id,
        title: source.title,
        url: source.url ?? null,
        publisher: source.publisher ?? null,
        accessedAt: new Date(),
      })),
    });

    await prisma.plantEnvironment.deleteMany({ where: { plantId: record.id } });
    await prisma.plantEnvironment.createMany({
      data: plant.environments.map((kind) => ({ plantId: record.id, kind })),
    });

    await prisma.plantCategoryLink.deleteMany({ where: { plantId: record.id } });
    await prisma.plantCategoryLink.createMany({
      data: plant.categories
        .map((slug) => categoryBySlug.get(slug))
        .filter((id): id is string => Boolean(id))
        .map((categoryId) => ({ plantId: record.id, categoryId })),
    });

    await prisma.plantProblem.deleteMany({ where: { plantId: record.id } });
    await prisma.plantProblem.createMany({
      data: plant.problems.map((problem) => ({
        plantId: record.id,
        symptom: problem.symptom,
        possibleCause: problem.possibleCause,
        suggestion: problem.suggestion,
      })),
    });
  }

  // Espécies semelhantes só podem ser ligadas depois que todas existem.
  const bySlug = new Map(
    (await prisma.plant.findMany({ select: { id: true, slug: true } })).map(
      (plant) => [plant.slug, plant.id],
    ),
  );

  await prisma.plantSimilarity.deleteMany({});
  for (const plant of PLANTS) {
    const fromId = bySlug.get(plant.slug);
    if (!fromId || !plant.similarTo?.length) continue;

    for (const targetSlug of plant.similarTo) {
      const toId = bySlug.get(targetSlug);
      if (!toId || toId === fromId) continue;
      await prisma.plantSimilarity.upsert({
        where: { fromPlantId_toPlantId: { fromPlantId: fromId, toPlantId: toId } },
        create: { fromPlantId: fromId, toPlantId: toId },
        update: {},
      });
    }
  }

  console.log(`  ✓ ${PLANTS.length} espécies (marcadas como não revisadas)`);
}

async function seedArticles(authorId: string) {
  for (const article of ARTICLES) {
    const data = {
      title: article.title,
      excerpt: article.excerpt,
      body: article.body,
      category: article.category,
      readingMinutes: article.readingMinutes,
      status: 'PUBLISHED' as const,
      publishedAt: new Date(),
      authorId,
    };

    await prisma.educationalArticle.upsert({
      where: { slug: article.slug },
      create: { slug: article.slug, ...data },
      update: data,
    });
  }
  console.log(`  ✓ ${ARTICLES.length} conteúdos educativos`);
}

async function seedDailyPlant() {
  const plant = await prisma.plant.findFirst({
    where: { status: 'PUBLISHED', curiosity: { not: null } },
    orderBy: { slug: 'asc' },
  });
  if (!plant) return;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  await prisma.dailyPlant.upsert({
    where: { date: today },
    create: { date: today, plantId: plant.id, curiosity: plant.curiosity },
    update: { plantId: plant.id, curiosity: plant.curiosity },
  });

  console.log('  ✓ planta do dia');
}

async function main() {
  console.log('\nSemeando o BROTA...\n');

  await seedCategories();
  await seedAchievements();
  const adminId = await seedAdmin();
  await seedPlants(adminId);
  await seedArticles(adminId);
  await seedDailyPlant();

  console.log('\nPronto.\n');
  console.log('  Entre em /entrar com:');
  console.log(`    e-mail: ${process.env.SEED_ADMIN_EMAIL ?? 'admin@brota.local'}`);
  console.log(`    senha:  ${process.env.SEED_ADMIN_PASSWORD ?? 'brota-admin-2026'}`);
  console.log('\n  Troque essa senha antes de qualquer uso real.\n');
}

main()
  .catch((error) => {
    console.error('\nFalha ao semear o banco:\n', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
