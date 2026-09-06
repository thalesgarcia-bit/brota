import type { Metadata } from 'next';
import type { IdentificationStatus } from '@/generated/prisma/client';

import { requirePermission } from '@/lib/auth/session';
import { listPendingIdentifications } from '@/server/services/identification';
import { prisma } from '@/lib/db/prisma';
import { EmptyState } from '@/components/ui/feedback';
import { LinkTabs } from '@/components/ui/tabs';
import { IdentificationQueue } from '@/components/admin/identification-queue';

// Consulta o banco a cada requisicao, nunca durante o build (Cloudflare + Prisma).
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Identificações',
  robots: { index: false },
};

const TABS: { key: string; label: string; status?: IdentificationStatus }[] = [
  { key: 'pendentes', label: 'Pendentes' },
  { key: 'analise', label: 'Em análise', status: 'IN_REVIEW' },
  { key: 'info', label: 'Precisa de mais informações', status: 'NEEDS_MORE_INFO' },
  { key: 'identificadas', label: 'Identificadas', status: 'IDENTIFIED' },
  { key: 'encerradas', label: 'Encerradas', status: 'CLOSED' },
];

export default async function AdminIdentificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>;
}) {
  await requirePermission('admin:review_identifications', '/admin/identificacoes');
  const { aba } = await searchParams;

  const tab = TABS.find((item) => item.key === aba) ?? TABS[0]!;
  const requests = await listPendingIdentifications(tab.status);

  const counts = await prisma.identificationRequest.groupBy({
    by: ['status'],
    _count: { status: true },
  });

  const countOf = (status: string) =>
    counts.find((item) => item.status === status)?._count.status ?? 0;

  const plantOptions = await prisma.plant.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { scientificName: 'asc' },
    select: {
      id: true,
      scientificName: true,
      commonNames: { where: { isPrimary: true }, take: 1 },
    },
  });

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <header>
        <h1 className="text-2xl sm:text-3xl">Identificações</h1>
        <p className="mt-1.5 max-w-2xl text-ink-600">
          Fotos que a identificação automática não resolveu com segurança, ou que
          o próprio usuário encaminhou para análise. Resolver uma pendência aqui
          faz a base do BROTA crescer.
        </p>
      </header>

      <div className="mt-6">
        <LinkTabs
          ariaLabel="Situação das identificações"
          items={[
            {
              key: 'pendentes',
              label: 'Pendentes',
              count:
                countOf('AWAITING_REVIEW') +
                countOf('IN_REVIEW') +
                countOf('NEEDS_MORE_INFO'),
            },
            { key: 'analise', label: 'Em análise', count: countOf('IN_REVIEW') },
            {
              key: 'info',
              label: 'Aguardando foto',
              count: countOf('NEEDS_MORE_INFO'),
            },
            {
              key: 'identificadas',
              label: 'Identificadas',
              count: countOf('IDENTIFIED'),
            },
            { key: 'encerradas', label: 'Encerradas', count: countOf('CLOSED') },
          ]}
        />
      </div>

      <div className="mt-6">
        {requests.length === 0 ? (
          <EmptyState
            icon="checkCircle"
            title="Nada pendente por aqui"
            description="Quando alguém enviar uma foto que a identificação automática não resolver, ela aparece nesta fila."
          />
        ) : (
          <IdentificationQueue
            requests={requests.map((request) => ({
              id: request.id,
              imageUrl: request.imageUrl,
              organ: request.organ,
              note: request.note,
              status: request.status,
              topScore: request.topScore,
              createdAt: request.createdAt.toISOString(),
              adminNotes: request.adminNotes,
              author:
                request.user.profile?.displayName ??
                request.user.profile?.username ??
                'Membro',
              candidates: request.candidates.map((candidate) => ({
                scientificName: candidate.scientificName,
                commonNames: candidate.commonNames,
                family: candidate.family,
                score: candidate.score,
                plantId: candidate.plantId,
              })),
            }))}
            plantOptions={plantOptions.map((plant) => ({
              id: plant.id,
              label: `${plant.commonNames[0]?.name ?? plant.scientificName} — ${plant.scientificName}`,
            }))}
          />
        )}
      </div>
    </div>
  );
}
