import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { prisma } from '@/lib/db/prisma';
import { getSessionUser } from '@/lib/auth/session';
import { can } from '@/lib/auth/rbac';
import { getFeed, getPostComments } from '@/server/services/posts';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/feedback';
import { PostCard, type CommentData } from '@/components/feed/post-card';
import { PlantThumb } from '@/components/plants/plant-thumb';
import { EXPERIENCE } from '@/lib/labels';
import { formatMonthYear } from '@/lib/utils/format';

// Consulta o banco a cada requisicao, nunca durante o build (Cloudflare + Prisma).
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const profile = await prisma.profile.findUnique({
    where: { username },
    select: { displayName: true, bio: true, isPublic: true },
  });

  if (!profile || !profile.isPublic) {
    return { title: 'Perfil', robots: { index: false } };
  }

  return {
    title: profile.displayName,
    description: profile.bio ?? `Perfil de ${profile.displayName} no BROTA.`,
    alternates: { canonical: `/perfil/${username}` },
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const viewer = await getSessionUser();

  const profile = await prisma.profile.findUnique({
    where: { username },
    include: {
      user: {
        select: {
          id: true,
          createdAt: true,
          deletedAt: true,
          achievements: { include: { achievement: true } },
          _count: { select: { posts: true, userPlants: true } },
        },
      },
    },
  });

  if (!profile || profile.user.deletedAt) notFound();

  const isOwner = viewer?.id === profile.userId;

  if (!profile.isPublic && !isOwner) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon="lock"
          title="Este perfil é privado"
          description="A pessoa escolheu não exibir seu perfil publicamente."
        />
      </div>
    );
  }

  const [{ posts }, gardenPlants] = await Promise.all([
    getFeed({ viewerId: viewer?.id ?? null, authorId: profile.userId }),
    prisma.userPlant.findMany({
      where: { userId: profile.userId, isActive: true },
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        plant: {
          select: {
            slug: true,
            scientificName: true,
            commonNames: { where: { isPrimary: true }, take: 1 },
          },
        },
      },
    }),
  ]);

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
            authorId: comment.author.id,
            author: {
              username: comment.author.profile?.username ?? null,
              displayName: comment.author.profile?.displayName ?? 'Membro',
              avatarUrl: comment.author.profile?.avatarUrl ?? null,
            },
            replies: comment.replies.map((reply) => ({
              id: reply.id,
              body: reply.body,
              createdAt: reply.createdAt.toISOString(),
              authorId: reply.author.id,
              author: {
                username: reply.author.profile?.username ?? null,
                displayName: reply.author.profile?.displayName ?? 'Membro',
                avatarUrl: reply.author.profile?.avatarUrl ?? null,
              },
            })),
          })),
        );
      }),
  );

  return (
    <div className="container-page py-6 sm:py-10">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <Avatar
          name={profile.displayName}
          src={profile.avatarUrl}
          size="xl"
          className="shrink-0"
        />

        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl">{profile.displayName}</h1>
          <p className="text-ink-500">@{profile.username}</p>

          {profile.bio ? (
            <p className="mt-3 max-w-xl leading-relaxed text-ink-700">
              {profile.bio}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-1.5">
            <Badge tone="brand" icon="sprout">
              {EXPERIENCE[profile.experienceLevel]}
            </Badge>
            {profile.showLocation && profile.city ? (
              <Badge tone="neutral" icon="mapPin">
                {profile.city}
                {profile.state ? `, ${profile.state}` : ''}
              </Badge>
            ) : null}
            <Badge tone="neutral" icon="calendar">
              No BROTA desde {formatMonthYear(profile.user.createdAt)}
            </Badge>
          </div>

          <dl className="mt-4 flex gap-6">
            <div>
              <dt className="text-xs tracking-wide text-ink-500 uppercase">
                Publicações
              </dt>
              <dd className="font-display text-xl font-semibold text-ink-900">
                {profile.user._count.posts}
              </dd>
            </div>
            <div>
              <dt className="text-xs tracking-wide text-ink-500 uppercase">
                Plantas
              </dt>
              <dd className="font-display text-xl font-semibold text-ink-900">
                {profile.user._count.userPlants}
              </dd>
            </div>
            <div>
              <dt className="text-xs tracking-wide text-ink-500 uppercase">
                Conquistas
              </dt>
              <dd className="font-display text-xl font-semibold text-ink-900">
                {profile.user.achievements.length}
              </dd>
            </div>
          </dl>
        </div>

        {isOwner ? (
          <ButtonLink
            href="/configuracoes"
            variant="outline"
            iconLeft="settings"
            size="sm"
          >
            Editar perfil
          </ButtonLink>
        ) : null}
      </header>

      {/* Conquistas */}
      {profile.user.achievements.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-lg">Conquistas</h2>
          <ul className="mt-3 flex flex-wrap gap-2.5">
            {profile.user.achievements.map((item) => (
              <li
                key={item.achievementId}
                title={item.achievement.description}
                className="inline-flex items-center gap-2 rounded-lg border border-sand-200 bg-sand-50 px-3 py-2"
              >
                <Icon name="star" size={16} className="text-clay-500" />
                <span className="text-sm font-medium text-clay-700">
                  {item.achievement.name}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Jardim */}
      {gardenPlants.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-lg">
            {isOwner
              ? 'Meu Jardim'
              : `O jardim de ${profile.displayName.split(' ')[0]}`}
          </h2>
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {gardenPlants.map((item) => (
              <li key={item.id}>
                <div className="relative aspect-square overflow-hidden rounded-lg bg-ink-50">
                  {item.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.photoUrl}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <PlantThumb
                      slug={item.plant?.slug ?? item.id}
                      name={item.nickname}
                      rounded="none"
                    />
                  )}
                </div>
                <p className="mt-1.5 truncate text-sm font-medium text-ink-800">
                  {item.nickname}
                </p>
                {item.plant ? (
                  <Link
                    href={`/plantas/${item.plant.slug}`}
                    className="truncate text-xs text-ink-500 hover:text-brand-700"
                  >
                    {item.plant.commonNames[0]?.name ?? item.plant.scientificName}
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Publicações */}
      <section className="mt-10">
        <h2 className="text-lg">Publicações</h2>

        {posts.length === 0 ? (
          <EmptyState
            className="mt-4"
            icon="image"
            title={
              isOwner ? 'Você ainda não publicou nada' : 'Nenhuma publicação ainda'
            }
            description={
              isOwner
                ? 'Mostre uma planta do seu jardim, compartilhe uma dica ou peça ajuda com uma dúvida.'
                : 'Quando esta pessoa publicar algo, aparece aqui.'
            }
            action={
              isOwner ? (
                <ButtonLink href="/publicar" iconLeft="plus">
                  Publicar
                </ButtonLink>
              ) : null
            }
          />
        ) : (
          <div className="mt-4 space-y-5">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                viewerId={viewer?.id ?? null}
                isAuthenticated={Boolean(viewer)}
                canModerate={can(viewer?.role, 'moderation:hide_content')}
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
      </section>
    </div>
  );
}
