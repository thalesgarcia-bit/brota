import type { Metadata } from 'next';
import Link from 'next/link';

import { requirePermission } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/feedback';
import { LinkTabs } from '@/components/ui/tabs';
import { POST_TYPE } from '@/lib/labels';
import { formatRelative } from '@/lib/utils/format';
import { ModerationToggle } from '@/components/admin/moderation-toggle';

export const metadata: Metadata = {
  title: 'Publicações',
  robots: { index: false },
};

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>;
}) {
  await requirePermission('moderation:view', '/admin/publicacoes');
  const { aba } = await searchParams;

  const status = aba === 'ocultas' ? 'HIDDEN_BY_MODERATION' : 'PUBLISHED';

  const [posts, counts] = await Promise.all([
    prisma.post.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
      take: 60,
      include: {
        author: { select: { profile: { select: { displayName: true, username: true } } } },
        images: { take: 1, orderBy: { position: 'asc' } },
        _count: { select: { comments: true, reactions: true } },
      },
    }),
    prisma.post.groupBy({ by: ['status'], _count: { status: true } }),
  ]);

  const countOf = (value: string) =>
    counts.find((item) => item.status === value)?._count.status ?? 0;

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <header>
        <h1 className="text-2xl sm:text-3xl">Publicações</h1>
        <p className="mt-1.5 text-ink-600">
          Ocultar uma publicação registra a ação com o seu nome.
        </p>
      </header>

      <div className="mt-6">
        <LinkTabs
          ariaLabel="Situação das publicações"
          items={[
            { key: 'publicadas', label: 'Publicadas', count: countOf('PUBLISHED') },
            {
              key: 'ocultas',
              label: 'Ocultas',
              count: countOf('HIDDEN_BY_MODERATION'),
            },
          ]}
        />
      </div>

      <div className="mt-6">
        {posts.length === 0 ? (
          <EmptyState
            icon="image"
            title="Nenhuma publicação nesta situação"
            description="Assim que a comunidade publicar, o conteúdo aparece aqui."
          />
        ) : (
          <ul className="space-y-3">
            {posts.map((post) => (
              <li
                key={post.id}
                className="flex flex-wrap items-start gap-4 rounded-lg border border-ink-200 bg-white p-4"
              >
                {post.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.images[0].url}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-md object-cover"
                    loading="lazy"
                  />
                ) : null}

                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm">
                    <Link
                      href={
                        post.author.profile?.username
                          ? `/perfil/${post.author.profile.username}`
                          : '#'
                      }
                      className="font-medium text-ink-900 hover:text-brand-700"
                    >
                      {post.author.profile?.displayName ?? 'Membro'}
                    </Link>
                    <Badge tone="neutral">{POST_TYPE[post.type].label}</Badge>
                    <span className="text-xs text-ink-500">
                      {formatRelative(post.createdAt)}
                    </span>
                  </p>
                  <p className="mt-1.5 line-clamp-2-safe text-sm text-ink-700">
                    {post.caption}
                  </p>
                  <p className="mt-1.5 text-xs text-ink-500">
                    {post._count.reactions} curtidas · {post._count.comments}{' '}
                    comentários ·{' '}
                    {post.allowComments
                      ? 'comentários abertos'
                      : 'comentários desativados pelo autor'}
                  </p>
                </div>

                <ModerationToggle
                  targetType="POST"
                  targetId={post.id}
                  hidden={post.status !== 'PUBLISHED'}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
