import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { requireUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { PLANT_CARD_SELECT } from '@/server/services/plants';
import { compatibilityLabel } from '@/domain/recommendation/engine';
import { PlantCard } from '@/components/plants/plant-card';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Alert, EmptyState } from '@/components/ui/feedback';
import { Button, ButtonLink } from '@/components/ui/button';
import { BrotaMark } from '@/components/ui/logo';
import { CARE_TIME, EXPERIENCE, LIGHT, SPACE } from '@/lib/labels';
import { regenerateMyRecommendationsAction } from '@/server/actions/onboarding';
import { cn } from '@/lib/utils/cn';

export const metadata: Metadata = {
  title: 'Minhas recomendações',
  robots: { index: false },
};

type StoredReasons = string[];
type StoredWarning = { severity: 'info' | 'attention' | 'danger'; message: string };

export default async function RecommendationsPage({
  searchParams,
}: {
  searchParams: Promise<{ novo?: string }>;
}) {
  const user = await requireUser('/recomendacoes');
  const { novo } = await searchParams;

  const profile = await prisma.greenProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) redirect('/onboarding');

  const recommendations = await prisma.recommendation.findMany({
    where: { userId: user.id },
    orderBy: { score: 'desc' },
    include: { plant: { select: PLANT_CARD_SELECT } },
  });

  return (
    <div className="container-page py-6 sm:py-10">
      {novo ? (
        <Alert tone="success" className="mb-6" title="Perfil Verde criado">
          A partir de agora o BROTA considera o seu espaço em tudo que mostra.
          Você pode refazer o questionário quando quiser.
        </Alert>
      ) : null}

      {/* Perfil Verde */}
      <section className="rounded-xl border border-brand-200 bg-linear-to-br from-brand-50 to-white p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-brand-700 uppercase">
              <BrotaMark size={18} />
              Seu Perfil Verde
            </div>
            <h1 className="mt-2.5 text-2xl sm:text-3xl">{profile.profileLabel}</h1>
            <p className="mt-2 max-w-2xl leading-relaxed text-ink-700">
              {profile.profileSummary}
            </p>
          </div>

          <form action={regenerateMyRecommendationsAction}>
            <Button type="submit" variant="outline" iconLeft="refresh" size="sm">
              Recalcular
            </Button>
          </form>
        </div>

        <dl className="mt-5 flex flex-wrap gap-2">
          <Badge tone="brand" icon={profile.lightUnsure || !profile.light ? 'info' : LIGHT[profile.light].icon}>
            {profile.lightUnsure || !profile.light
              ? 'Luz a descobrir'
              : LIGHT[profile.light].short}
          </Badge>
          <Badge tone="neutral" icon="grid">
            Espaço {SPACE[profile.space].toLowerCase()}
          </Badge>
          <Badge tone="neutral" icon="clock">
            {CARE_TIME[profile.careTime]}
          </Badge>
          <Badge tone="neutral" icon="sprout">
            {EXPERIENCE[profile.experience]}
          </Badge>
          {profile.hasCats ? (
            <Badge tone="warning" icon="alert">
              Casa com gatos
            </Badge>
          ) : null}
          {profile.hasDogs ? (
            <Badge tone="warning" icon="alert">
              Casa com cães
            </Badge>
          ) : null}
          {profile.hasSmallKids ? (
            <Badge tone="warning" icon="alert">
              Crianças pequenas
            </Badge>
          ) : null}
        </dl>

        <p className="mt-4 text-sm text-ink-600">
          <Link
            href="/onboarding?refazer=1"
            className="font-medium text-brand-700 underline-offset-2 hover:underline"
          >
            Refazer o questionário
          </Link>{' '}
          se algo mudou no seu espaço.
        </p>
      </section>

      {/* Lista */}
      <section className="mt-8">
        <h2 className="text-xl sm:text-2xl">Espécies que combinam com você</h2>
        <p className="mt-1.5 text-ink-600">
          A ordem vem de oito critérios ponderados. Cada indicação explica de
          onde veio o percentual.
        </p>

        {recommendations.length === 0 ? (
          <EmptyState
            className="mt-6"
            icon="sprout"
            title="Ainda não há recomendações"
            description="O catálogo precisa de espécies publicadas para gerar indicações. Assim que houver, elas aparecem aqui."
            action={
              <ButtonLink href="/explorar" variant="outline">
                Explorar o catálogo
              </ButtonLink>
            }
          />
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {recommendations.map((item, index) => {
              const reasons = (item.reasons as StoredReasons) ?? [];
              const warnings = (item.warnings as StoredWarning[]) ?? [];
              const compatibility = compatibilityLabel(item.score);

              return (
                <PlantCard
                  key={item.id}
                  plant={item.plant}
                  priority={index < 3}
                  badge={
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-xs font-semibold shadow-xs',
                        compatibility.tone === 'excellent' && 'bg-brand-600 text-white',
                        compatibility.tone === 'good' && 'bg-brand-500 text-white',
                        compatibility.tone === 'fair' && 'bg-white text-ink-700',
                        compatibility.tone === 'low' && 'bg-white text-ink-500',
                      )}
                    >
                      {item.score}% compatível
                    </span>
                  }
                  footer={
                    <div className="border-t border-ink-100 pt-3">
                      <p className="text-xs font-medium tracking-wide text-ink-500 uppercase">
                        {compatibility.label}
                      </p>

                      <ul className="mt-2 space-y-1.5">
                        {reasons.slice(0, 2).map((reason) => (
                          <li
                            key={reason}
                            className="flex gap-1.5 text-xs leading-relaxed text-ink-600"
                          >
                            <Icon
                              name="checkCircle"
                              size={13}
                              className="mt-0.5 shrink-0 text-brand-500"
                            />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>

                      {warnings.length > 0 ? (
                        <ul className="mt-2 space-y-1">
                          {warnings.map((warning) => (
                            <li
                              key={warning.message}
                              className={cn(
                                'flex gap-1.5 text-xs leading-relaxed',
                                warning.severity === 'danger'
                                  ? 'text-danger-700'
                                  : warning.severity === 'attention'
                                    ? 'text-warning-700'
                                    : 'text-ink-500',
                              )}
                            >
                              <Icon
                                name={warning.severity === 'info' ? 'info' : 'alert'}
                                size={13}
                                className="mt-0.5 shrink-0"
                              />
                              <span>{warning.message}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  }
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
