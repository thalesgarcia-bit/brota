import type { Metadata } from 'next';
import Link from 'next/link';

import { getSessionUser } from '@/lib/auth/session';
import { can } from '@/lib/auth/rbac';
import { getFeed, getPostComments, getTrendingTags } from '@/server/services/posts';
import { prisma } from '@/lib/db/prisma';
import { PostCard, type CommentData } from '@/components/feed/post-card';
import { EmptyState } from '@/components/ui/feedback';
import { ButtonLink } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { POST_TYPES } from '@/lib/validation/post';
import { cn } from '@/lib/utils/cn';

// Consulta o banco a cada requisicao, nunca durante o build (Cloudflare + Prisma).
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Comunidade',
  description:
    'Publicações recentes, dicas, dúvidas e descobertas de quem cultiva plantas no BROTA.',
  alternates: { canonical: '/comunidade' },
};

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; tipo?: string }>;
}) {
  const viewer = await getSessionUser();
  const { tag, tipo } = await searchParams;

  const [{ posts }, tags, members] = await Promise.all([
    getFeed({
      viewerId: viewer?.id ?? null,
      ...(tag ? { tag } : {}),
      ...(tipo ? { type: tipo } : {}),
    }),
    getTrendingTags(14),
    prisma.profile.findMany({
      where: { isPublic: true, user: { deletedAt: null } },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        username: true,
        displayName: true,
        avatarUrl: true,
        user: { select: { _count: { select: { posts: true } } } },
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
      <header className="max-w-2xl">
        <Badge tone="brand" icon="users">
          Comunidade
        </Badge>
        <h1 className="mt-3 text-2xl sm:text-3xl">O que está acontecendo</h1>
        <p className="mt-2 text-ink-600">
          Descobertas, dúvidas e conquistas de quem cultiva.
        </p>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_18rem] lg:gap-8">
        <div className="min-w-0">
          {/* Filtros por tipo */}
          <div className="scroll-x -mx-4 flex gap-2 px-4 pb-1 sm:mx-0 sm:px-0">
            <Link
              href="/comunidade"
              className={cn(
                'inline-flex shrink-0 items-center rounded-full border px-3 py-1.5 text-sm transition-colors',
                !tipo && !tag
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-ink-200 bg-white text-ink-700 hover:bg-ink-50',
              )}
            >
              Tudo
            </Link>
            {POST_TYPES.map((option) => (
              <Link
                key={option.value}
                href={`/comunidade?tipo=${option.value}`}
                className={cn(
                  'inline-flex shrink-0 items-center rounded-full border px-3 py-1.5 text-sm transition-colors',
                  tipo === option.value
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-ink-200 bg-white text-ink-700 hover:bg-ink-50',
                )}
              >
                {option.label}
              </Link>
            ))}
          </div>

          {tag ? (
            <p className="mt-4 flex items-center gap-2 text-sm text-ink-600">
              Filtrando por <strong className="text-brand-700">#{tag}</strong>
              <Link href="/comunidade" className="text-brand-700 underline">
                limpar
              </Link>
            </p>
          ) : null}

          {posts.length === 0 ? (
            <EmptyState
              className="mt-6"
              icon="users"
              title="Nada por aqui ainda"
              description={
                tag || tipo
                  ? 'Nenhuma publicação corresponde a este filtro. Tente outro assunto.'
                  : 'A comunidade está começando. Que tal ser a primeira pessoa a publicar?'
              }
              action={
                viewer ? (
                  <ButtonLink href="/publicar" iconLeft="plus">
                    Publicar
                  </ButtonLink>
                ) : (
                  <ButtonLink href="/cadastro">Criar conta</ButtonLink>
                )
              }
            />
          ) : (
            <div className="mt-6 space-y-5">
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
                    tags: post.tags.map((item) => item.tag),
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          {tags.length > 0 ? (
            <section className="rounded-lg border border-ink-200 bg-white p-4">
              <h2 className="text-sm font-semibold tracking-wide text-ink-500 uppercase">
                Assuntos
              </h2>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {tags.map((item) => (
                  <li key={item.tag}>
                    <Link
                      href={`/comunidade?tag=${item.tag}`}
                      className={cn(
                        'inline-flex items-center rounded-full border px-2.5 py-1 text-sm transition-colors',
                        tag === item.tag
                          ? 'border-brand-600 bg-brand-50 text-brand-800'
                          : 'border-ink-200 text-ink-700 hover:border-brand-300 hover:bg-brand-50',
                      )}
                    >
                      #{item.tag}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {members.length > 0 ? (
            <section className="rounded-lg border border-ink-200 bg-white p-4">
              <h2 className="text-sm font-semibold tracking-wide text-ink-500 uppercase">
                Membros
              </h2>
              <ul className="mt-3 space-y-2.5">
                {members.map((member) => (
                  <li key={member.username}>
                    <Link
                      href={`/perfil/${member.username}`}
                      className="flex items-center gap-2.5 rounded-md p-1 transition-colors hover:bg-ink-50"
                    >
                      <Avatar
                        name={member.displayName}
                        src={member.avatarUrl}
                        size="sm"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-ink-900">
                          {member.displayName}
                        </span>
                        <span className="block text-xs text-ink-500">
                          {member.user._count.posts}{' '}
                          {member.user._count.posts === 1
                            ? 'publicação'
                            : 'publicações'}
                        </span>
                      </span>
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
