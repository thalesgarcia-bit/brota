import type { Metadata } from 'next';
import Link from 'next/link';

import { requirePermission } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { EmptyState } from '@/components/ui/feedback';
import { LinkTabs } from '@/components/ui/tabs';
import { SuggestionReview } from '@/components/admin/suggestion-review';

export const metadata: Metadata = {
  title: 'Sugestões',
  robots: { index: false },
};

export default async function AdminSuggestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>;
}) {
  await requirePermission('admin:review_suggestions', '/admin/sugestoes');
  const { aba } = await searchParams;

  const status =
    aba === 'aprovadas' ? 'APPROVED' : aba === 'recusadas' ? 'REJECTED' : 'PENDING';

  const [suggestions, counts] = await Promise.all([
    prisma.plantSuggestion.findMany({
      where: { status },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { profile: { select: { displayName: true, username: true } } } },
        plant: {
          select: {
            slug: true,
            scientificName: true,
            commonNames: { where: { isPrimary: true }, take: 1 },
          },
        },
        reviewedBy: { select: { profile: { select: { displayName: true } } } },
      },
    }),
    prisma.plantSuggestion.groupBy({
      by: ['status'],
      _count: { status: true },
    }),
  ]);

  const countOf = (value: string) =>
    counts.find((item) => item.status === value)?._count.status ?? 0;

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <header>
        <h1 className="text-2xl sm:text-3xl">Sugestões da comunidade</h1>
        <p className="mt-1.5 max-w-2xl text-ink-600">
          Nada entra direto na base oficial. Toda contribuição passa por aqui, e o
          histórico guarda quem sugeriu, o valor anterior, o valor novo e quem
          aprovou.
        </p>
      </header>

      <div className="mt-6">
        <LinkTabs
          ariaLabel="Situação das sugestões"
          items={[
            { key: 'pendentes', label: 'Pendentes', count: countOf('PENDING') },
            { key: 'aprovadas', label: 'Aprovadas', count: countOf('APPROVED') },
            { key: 'recusadas', label: 'Recusadas', count: countOf('REJECTED') },
          ]}
        />
      </div>

      <div className="mt-6">
        {suggestions.length === 0 ? (
          <EmptyState
            icon="edit"
            title="Nenhuma sugestão nesta situação"
            description="Quando alguém sugerir uma correção em uma ficha de espécie, ela aparece aqui para revisão."
          />
        ) : (
          <ul className="space-y-4">
            {suggestions.map((suggestion) => (
              <li key={suggestion.id}>
                <SuggestionReview
                  suggestion={{
                    id: suggestion.id,
                    field: suggestion.field,
                    currentValue: suggestion.currentValue,
                    suggestedValue: suggestion.suggestedValue,
                    justification: suggestion.justification,
                    sourceUrl: suggestion.sourceUrl,
                    status: suggestion.status,
                    createdAt: suggestion.createdAt.toISOString(),
                    reviewNote: suggestion.reviewNote,
                    author:
                      suggestion.user.profile?.displayName ??
                      suggestion.user.profile?.username ??
                      'Membro',
                    reviewer: suggestion.reviewedBy?.profile?.displayName ?? null,
                    plant: suggestion.plant
                      ? {
                          slug: suggestion.plant.slug,
                          label:
                            suggestion.plant.commonNames[0]?.name ??
                            suggestion.plant.scientificName,
                        }
                      : null,
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-8 text-sm text-ink-500">
        Todas as decisões ficam registradas em{' '}
        <Link href="/admin/logs" className="text-brand-700 underline">
          Registros
        </Link>
        .
      </p>
    </div>
  );
}
