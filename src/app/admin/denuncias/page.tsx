import type { Metadata } from 'next';

import { requirePermission } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { EmptyState } from '@/components/ui/feedback';
import { LinkTabs } from '@/components/ui/tabs';
import { ReportReview } from '@/components/admin/report-review';

export const metadata: Metadata = {
  title: 'Denúncias',
  robots: { index: false },
};

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>;
}) {
  await requirePermission('moderation:handle_reports', '/admin/denuncias');
  const { aba } = await searchParams;

  const status =
    aba === 'resolvidas'
      ? (['RESOLVED'] as const)
      : aba === 'descartadas'
        ? (['DISMISSED'] as const)
        : (['OPEN', 'IN_REVIEW'] as const);

  const [reports, counts] = await Promise.all([
    prisma.report.findMany({
      where: { status: { in: [...status] } },
      orderBy: { createdAt: 'asc' },
      include: {
        reporter: { select: { profile: { select: { displayName: true } } } },
        handledBy: { select: { profile: { select: { displayName: true } } } },
      },
    }),
    prisma.report.groupBy({ by: ['status'], _count: { status: true } }),
  ]);

  const countOf = (value: string) =>
    counts.find((item) => item.status === value)?._count.status ?? 0;

  // Carrega o conteúdo denunciado para exibir ao moderador.
  const postIds = reports.filter((r) => r.targetType === 'POST').map((r) => r.targetId);
  const commentIds = reports
    .filter((r) => r.targetType === 'COMMENT')
    .map((r) => r.targetId);

  const [posts, comments] = await Promise.all([
    postIds.length
      ? prisma.post.findMany({
          where: { id: { in: postIds } },
          select: {
            id: true,
            caption: true,
            status: true,
            author: { select: { profile: { select: { displayName: true } } } },
          },
        })
      : Promise.resolve([]),
    commentIds.length
      ? prisma.comment.findMany({
          where: { id: { in: commentIds } },
          select: {
            id: true,
            body: true,
            status: true,
            author: { select: { profile: { select: { displayName: true } } } },
          },
        })
      : Promise.resolve([]),
  ]);

  const contentById = new Map<string, { text: string; author: string; status: string }>();
  for (const post of posts) {
    contentById.set(post.id, {
      text: post.caption,
      author: post.author.profile?.displayName ?? 'Membro',
      status: post.status,
    });
  }
  for (const comment of comments) {
    contentById.set(comment.id, {
      text: comment.body,
      author: comment.author.profile?.displayName ?? 'Membro',
      status: comment.status,
    });
  }

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <header>
        <h1 className="text-2xl sm:text-3xl">Denúncias</h1>
        <p className="mt-1.5 max-w-2xl text-ink-600">
          Conteúdo reportado por membros. Toda ação de moderação fica registrada
          com autor, alvo e motivo.
        </p>
      </header>

      <div className="mt-6">
        <LinkTabs
          ariaLabel="Situação das denúncias"
          items={[
            {
              key: 'abertas',
              label: 'Abertas',
              count: countOf('OPEN') + countOf('IN_REVIEW'),
            },
            { key: 'resolvidas', label: 'Resolvidas', count: countOf('RESOLVED') },
            {
              key: 'descartadas',
              label: 'Descartadas',
              count: countOf('DISMISSED'),
            },
          ]}
        />
      </div>

      <div className="mt-6">
        {reports.length === 0 ? (
          <EmptyState
            icon="checkCircle"
            title="Nenhuma denúncia nesta situação"
            description="Quando alguém reportar uma publicação, um comentário ou um perfil, o caso aparece aqui."
          />
        ) : (
          <ul className="space-y-4">
            {reports.map((report) => (
              <li key={report.id}>
                <ReportReview
                  report={{
                    id: report.id,
                    targetType: report.targetType,
                    targetId: report.targetId,
                    reason: report.reason,
                    details: report.details,
                    status: report.status,
                    createdAt: report.createdAt.toISOString(),
                    resolution: report.resolution,
                    reporter: report.reporter.profile?.displayName ?? 'Membro',
                    handledBy: report.handledBy?.profile?.displayName ?? null,
                    content: contentById.get(report.targetId) ?? null,
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
