import type { MetadataRoute } from 'next';

import { prisma } from '@/lib/db/prisma';
import { clientEnv } from '@/lib/env';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = clientEnv.NEXT_PUBLIC_SITE_URL;

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/explorar`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/aprender`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/identificar`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/onde-comprar`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/sobre`, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${base}/privacidade`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/termos`, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const [plants, articles] = await Promise.all([
    prisma.plant.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 5000,
    }),
    prisma.educationalArticle.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true },
      take: 1000,
    }),
  ]);

  return [
    ...staticRoutes,
    ...plants.map((plant) => ({
      url: `${base}/plantas/${plant.slug}`,
      lastModified: plant.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...articles.map((article) => ({
      url: `${base}/aprender/${article.slug}`,
      lastModified: article.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];
}
