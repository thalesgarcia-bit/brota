import type { Metadata } from 'next';
import Link from 'next/link';

import { requireUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { getFeed, getPostComments, getTrendingTags } from '@/server/services/posts';
import { getDailyPlant } from '@/server/services/plants';
import { PostCard, type CommentData } from '@/components/feed/post-card';
import { EmptyState } from '@/components/ui/feedback';
import { ButtonLink } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { PlantThumb } from '@/components/plants/plant-thumb';
import { compatibilityLabel } from '@/domain/recommendation/engine';

export const metadata: Metadata = {
  title: 'Início',
  robots: { index: false },
};

export default async function FeedPage() {
  const user = await requireUser('/feed');

  const [{ posts }, tags, daily, topRecommendation, greenProfile] =
    await Promise.all([
      getFeed({ viewerId: user.id }),
      getTrendingTags(8),
      getDailyPlant(),
      prisma.recommendation.findFirst({
        where: { userId: user.id },
        orderBy: { score: 'desc' },
        include: {
          plant: {
            select: {
              slug: true,
              scientificName: true,
              commonNames: { where: { isPrimary: true }, take: 1 },
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
      }),
      prisma.greenProfile.findUnique({
        where: { userId: user.id },
        select: { profileLabel: true },
      }),
    ]);

  // Comentários das publicações que aceitam comentários.
  const commentsByPost = new Map<string, CommentData[]>();
  await Promise.all(
    posts
      .filter((post) => post.allowComments && post._count.comments > 0)
      .map(async (post) => {
        const comments = await getPostComments(post.id);
        commentsByPost.set(
          post.id,
          comments.map((comment) => ({
            id: comment.id,
            body: comment.body,
            createdAt: comment.createdAt.toISOString(),
            author: {
              username: comment.author.profile?.username ?? null,
              displayName: comment.author.profile?.displayName ?? 'Membro',
              avatarUrl: comment.author.profile?.avatarUrl ?? null,
            },
          })),
        );
      }),
  );

  return (
    <div className="container-page py-6 sm:py-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:gap-8">
        {/* Feed */}
        <div className="min-w-0">
          <header className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl">
                Olá, {user.name?.split(' ')[0] ?? 'tudo bem'}
              </h1>
              <p className="mt-1 text-ink-600">
                {greenProfile
                  ? `Seu perfil: ${greenProfile.profileLabel}.`
                  : 'Responda o questionário para receber recomendações.'}
              </p>
            </div>
            <ButtonLink href="/publicar" iconLeft="plus" size="sm">
              Publicar
            </ButtonLink>
          </header>

          {!greenProfile ? (
            <div className="mt-5 rounded-lg border border-brand-200 bg-brand-50 p-4 sm:p-5">
              <h2 className="flex items-center gap-2 text-base font-semibold text-brand-900">
                <Icon name="sparkle" size={18} />
                Vamos descobrir quais plantas combinam com você?
              </h2>
              <p className="mt-1.5 text-sm text-brand-800/85">
                Menos de dois minutos, e o BROTA passa a considerar o seu espaço
                em tudo o que mostra.
              </p>
              <div className="mt-4">
                <ButtonLink href="/onboarding" size="sm" iconRight="arrowRight">
                  Começar o questionário
                </ButtonLink>
              </div>
            </div>
          ) : null}

          {posts.length === 0 ? (
            <EmptyState
              className="mt-6"
              icon="image"
              title="O feed ainda está vazio"
              description="Ninguém publicou nada por aqui. Que tal ser a primeira pessoa a mostrar uma planta, compartilhar uma dica ou pedir ajuda com uma dúvida?"
              action={
                <ButtonLink href="/publicar" iconLeft="plus">
                  Fazer a primeira publicação
                </ButtonLink>
              }
            />
          ) : (
            <div className="mt-6 space-y-5">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  viewerId={user.id}
                  isAuthenticated
                  comments={commentsByPost.get(post.id)}
                  post={{
                    id: post.id,
                    type: post.type,
                    caption: post.caption,
                    city: post.city,
                    state: post.state,
                    stage: post.stage,
                    allowComments: post.allowComments,
                    createdAt: post.createdAt.toISOString(),
                    likedByMe: post.likedByMe,
                    savedByMe: post.savedByMe,
                    likeCount: post._count.reactions,
                    commentCount: post._count.comments,
                    author: {
                      id: post.author.id,
                      username: post.author.profile?.username ?? null,
                      displayName: post.author.profile?.displayName ?? 'Membro',
                      avatarUrl: post.author.profile?.avatarUrl ?? null,
                    },
                    plant: post.plant
                      ? {
                          slug: post.plant.slug,
                          label:
                            post.plant.commonNames[0]?.name ??
                            post.plant.scientificName,
                        }
                      : null,
                    images: post.images.map((image) => ({
                      id: image.id,
                      url: image.url,
                      alt: image.alt,
                    })),
                    tags: post.tags.map((tag) => tag.tag),
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Lateral */}
        <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          {topRecommendation ? (
            <section className="rounded-lg border border-ink-200 bg-white p-4">
              <h2 className="text-sm font-semibold tracking-wide text-ink-500 uppercase">
                Combina com você
              </h2>

              <Link
                href={`/plantas/${topRecommendation.plant.slug}`}
                className="mt-3 flex gap-3 rounded-md p-1 transition-colors hover:bg-ink-50"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md">
                  <PlantThumb
                    slug={topRecommendation.plant.slug}
                    name={
                      topRecommendation.plant.commonNames[0]?.name ??
                      topRecommendation.plant.scientificName
                    }
                    src={topRecommendation.plant.images[0]?.url}
                    alt={topRecommendation.plant.images[0]?.alt}
                    rounded="none"
                  />
                </div>
                <div className="min-w-0">
                  <Badge tone="brand">{topRecommendation.score}% compatível</Badge>
                  <p className="mt-1 truncate text-sm font-medium text-ink-900">
                    {topRecommendation.plant.commonNames[0]?.name ??
                      topRecommendation.plant.scientificName}
                  </p>
                  <p className="text-xs text-ink-500">
                    {compatibilityLabel(topRecommendation.score).label}
                  </p>
                </div>
              </Link>

              <ButtonLink
                href="/recomendacoes"
                variant="ghost"
                size="sm"
                fullWidth
                className="mt-2"
                iconRight="arrowRight"
              >
                Ver todas
              </ButtonLink>
            </section>
          ) : null}

          {daily?.plant ? (
            <section className="rounded-lg border border-ink-200 bg-white p-4">
              <h2 className="text-sm font-semibold tracking-wide text-ink-500 uppercase">
                Planta do dia
              </h2>
              <Link
                href={`/plantas/${daily.plant.slug}`}
                className="mt-3 block rounded-md transition-colors hover:opacity-90"
              >
                <div className="relative aspect-4/3 w-full overflow-hidden rounded-md">
                  <PlantThumb
                    slug={daily.plant.slug}
                    name={
                      daily.plant.commonNames[0]?.name ?? daily.plant.scientificName
                    }
                    src={daily.plant.images[0]?.url}
                    alt={daily.plant.images[0]?.alt}
                    rounded="none"
                  />
                </div>
                <p className="mt-2.5 font-medium text-ink-900">
                  {daily.plant.commonNames[0]?.name ?? daily.plant.scientificName}
                </p>
                {daily.curiosity ? (
                  <p className="mt-1 line-clamp-2-safe text-sm text-ink-600">
                    {daily.curiosity}
                  </p>
                ) : null}
              </Link>
            </section>
          ) : null}

          {tags.length > 0 ? (
            <section className="rounded-lg border border-ink-200 bg-white p-4">
              <h2 className="text-sm font-semibold tracking-wide text-ink-500 uppercase">
                Assuntos da comunidade
              </h2>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {tags.map((item) => (
                  <li key={item.tag}>
                    <Link
                      href={`/comunidade?tag=${item.tag}`}
                      className="inline-flex items-center rounded-full border border-ink-200 px-2.5 py-1 text-sm text-ink-700 transition-colors hover:border-brand-300 hover:bg-brand-50"
                    >
                      #{item.tag}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
