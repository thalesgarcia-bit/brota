import type { Metadata } from 'next';
import Link from 'next/link';

import { requirePermission } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { EmptyState } from '@/components/ui/feedback';
import { LinkTabs } from '@/components/ui/tabs';
import { formatRelative } from '@/lib/utils/format';
import { ModerationToggle } from '@/components/admin/moderation-toggle';

export const metadata: Metadata = {
  title: 'Comentários',
  robots: { index: false },
};

export default async function AdminCommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>;
}) {
  await requirePermission('moderation:view', '/admin/comentarios');
  const { aba } = await searchParams;

  const status = aba === 'ocultos' ? 'HIDDEN_BY_MODERATION' : 'PUBLISHED';

  const [comments, counts] = await Promise.all([
    prisma.comment.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
      take: 80,
      include: {
        author: { select: { profile: { select: { displayName: true, username: true } } } },
        post: { select: { id: true, caption: true } },
      },
    }),
    prisma.comment.groupBy({ by: ['status'], _count: { status: true } }),
  ]);

  const countOf = (value: string) =>
    counts.find((item) => item.status === value)?._count.status ?? 0;

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <header>
        <h1 className="text-2xl sm:text-3xl">Comentários</h1>
      </header>

      <div className="mt-6">
        <LinkTabs
          ariaLabel="Situação dos comentários"
          items={[
            { key: 'publicados', label: 'Publicados', count: countOf('PUBLISHED') },
            {
              key: 'ocultos',
              label: 'Ocultos',
              count: countOf('HIDDEN_BY_MODERATION'),
            },
          ]}
        />
      </div>

      <div className="mt-6">
        {comments.length === 0 ? (
          <EmptyState
            icon="message"
            title="Nenhum comentário nesta situação"
            description="Os comentários da comunidade aparecem aqui."
          />
        ) : (
          <ul className="space-y-3">
            {comments.map((comment) => (
              <li
                key={comment.id}
                className="flex flex-wrap items-start gap-4 rounded-lg border border-ink-200 bg-white p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <Link
                      href={
                        comment.author.profile?.username
                          ? `/perfil/${comment.author.profile.username}`
                          : '#'
                      }
                      className="font-medium text-ink-900 hover:text-brand-700"
                    >
                      {comment.author.profile?.displayName ?? 'Membro'}
                    </Link>
                    <span className="ml-2 text-xs text-ink-500">
                      {formatRelative(comment.createdAt)}
                    </span>
                  </p>
                  <p className="mt-1.5 text-sm text-ink-700">{comment.body}</p>
                  <p className="mt-1.5 line-clamp-2-safe text-xs text-ink-500">
                    Em: {comment.post.caption.slice(0, 90)}…
                  </p>
                </div>

                <ModerationToggle
                  targetType="COMMENT"
                  targetId={comment.id}
                  hidden={comment.status !== 'PUBLISHED'}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
