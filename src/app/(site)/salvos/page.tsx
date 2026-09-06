import type { Metadata } from 'next';
import Link from 'next/link';

import { requireUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { PLANT_CARD_SELECT } from '@/server/services/plants';
import { PlantCard } from '@/components/plants/plant-card';
import { EmptyState } from '@/components/ui/feedback';
import { ButtonLink } from '@/components/ui/button';
import { LinkTabs } from '@/components/ui/tabs';
import { Icon } from '@/components/ui/icon';
import { formatRelative } from '@/lib/utils/format';

export const metadata: Metadata = {
  title: 'Salvos',
  robots: { index: false },
};

export default async function SavedPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>;
}) {
  const user = await requireUser('/salvos');
  const { aba } = await searchParams;
  const tab = aba ?? 'plantas';

  const [plants, posts, articles, counts] = await Promise.all([
    prisma.savedItem.findMany({
      where: { userId: user.id, kind: 'PLANT' },
      orderBy: { createdAt: 'desc' },
      include: { plant: { select: PLANT_CARD_SELECT } },
    }),
    prisma.savedItem.findMany({
      where: { userId: user.id, kind: 'POST' },
      orderBy: { createdAt: 'desc' },
      include: {
        post: {
          select: {
            id: true,
            caption: true,
            createdAt: true,
            images: { take: 1, orderBy: { position: 'asc' } },
            author: { select: { profile: { select: { displayName: true, username: true } } } },
          },
        },
      },
    }),
    prisma.savedItem.findMany({
      where: { userId: user.id, kind: 'ARTICLE' },
      orderBy: { createdAt: 'desc' },
      include: {
        article: { select: { slug: true, title: true, excerpt: true, category: true } },
      },
    }),
    prisma.savedItem.groupBy({
      by: ['kind'],
      where: { userId: user.id },
      _count: { kind: true },
    }),
  ]);

  const countOf = (kind: string) =>
    counts.find((item) => item.kind === kind)?._count.kind ?? 0;

  return (
    <div className="container-page py-6 sm:py-10">
      <h1 className="text-2xl sm:text-3xl">Salvos</h1>
      <p className="mt-1.5 text-ink-600">
        Tudo o que você guardou para consultar depois.
      </p>

      <div className="mt-6">
        <LinkTabs
          ariaLabel="Tipos de conteúdo salvo"
          items={[
            { key: 'plantas', label: 'Espécies', count: countOf('PLANT') },
            { key: 'publicacoes', label: 'Publicações', count: countOf('POST') },
            { key: 'conteudos', label: 'Conteúdos', count: countOf('ARTICLE') },
          ]}
        />
      </div>

      <div className="mt-6">
        {tab === 'plantas' ? (
          plants.length === 0 ? (
            <EmptyState
              icon="bookmark"
              title="Nenhuma espécie salva"
              description="Ao explorar o catálogo, use o botão Salvar para guardar as espécies que te interessarem."
              action={
                <ButtonLink href="/explorar" variant="outline">
                  Explorar espécies
                </ButtonLink>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {plants
                .filter((item) => item.plant)
                .map((item) => (
                  <PlantCard key={item.id} plant={item.plant!} />
                ))}
            </div>
          )
        ) : null}

        {tab === 'publicacoes' ? (
          posts.length === 0 ? (
            <EmptyState
              icon="bookmark"
              title="Nenhuma publicação salva"
              description="No feed, use o marcador para guardar uma publicação."
              action={
                <ButtonLink href="/feed" variant="outline">
                  Ir para o feed
                </ButtonLink>
              }
            />
          ) : (
            <ul className="space-y-3">
              {posts
                .filter((item) => item.post)
                .map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/feed?publicacao=${item.post!.id}`}
                      className="flex gap-4 rounded-lg border border-ink-200 bg-white p-3.5 transition-colors hover:border-brand-300"
                    >
                      {item.post!.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.post!.images[0].url}
                          alt=""
                          className="h-20 w-20 shrink-0 rounded-md object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md bg-ink-100 text-ink-400">
                          <Icon name="image" size={22} />
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm text-ink-500">
                          {item.post!.author.profile?.displayName ?? 'Membro'} ·{' '}
                          {formatRelative(item.post!.createdAt)}
                        </p>
                        <p className="mt-1 line-clamp-2-safe text-ink-800">
                          {item.post!.caption}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
            </ul>
          )
        ) : null}

        {tab === 'conteudos' ? (
          articles.length === 0 ? (
            <EmptyState
              icon="bookmark"
              title="Nenhum conteúdo salvo"
              description="Na área Aprender você encontra textos sobre rega, substrato, propagação, biodiversidade e mais."
              action={
                <ButtonLink href="/aprender" variant="outline">
                  Ir para Aprender
                </ButtonLink>
              }
            />
          ) : (
            <ul className="space-y-3">
              {articles
                .filter((item) => item.article)
                .map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/aprender/${item.article!.slug}`}
                      className="block rounded-lg border border-ink-200 bg-white p-4 transition-colors hover:border-brand-300"
                    >
                      <p className="text-xs tracking-wide text-ink-500 uppercase">
                        {item.article!.category}
                      </p>
                      <h2 className="mt-1 text-lg">{item.article!.title}</h2>
                      <p className="mt-1 line-clamp-2-safe text-sm text-ink-600">
                        {item.article!.excerpt}
                      </p>
                    </Link>
                  </li>
                ))}
            </ul>
          )
        ) : null}
      </div>
    </div>
  );
}
