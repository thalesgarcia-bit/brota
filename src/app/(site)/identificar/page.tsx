import type { Metadata } from 'next';
import Link from 'next/link';

import { getSessionUser } from '@/lib/auth/session';
import { plantIdentificationStatus, serverEnv } from '@/lib/env';
import { prisma } from '@/lib/db/prisma';
import { Alert } from '@/components/ui/feedback';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { ButtonLink } from '@/components/ui/button';
import { IDENTIFICATION_STATUS } from '@/lib/labels';
import { formatRelative } from '@/lib/utils/format';
import { IdentifyPanel } from './identify-panel';

export const metadata: Metadata = {
  title: 'Que planta é essa?',
  description:
    'Envie uma foto e descubra a espécie mais provável. Quando a identificação não é segura, o BROTA diz isso e encaminha para a análise da equipe.',
  alternates: { canonical: '/identificar' },
};

export default async function IdentifyPage() {
  const user = await getSessionUser();
  const status = plantIdentificationStatus();
  const threshold = serverEnv().PLANT_ID_CONFIDENCE_THRESHOLD;

  const history = user
    ? await prisma.identificationRequest.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: {
          candidates: { orderBy: { rank: 'asc' }, take: 1 },
          resolvedPlant: {
            select: {
              slug: true,
              scientificName: true,
              commonNames: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
      })
    : [];

  return (
    <div className="container-page py-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <header>
          <Badge tone="brand" icon="scan">
            Identificação por imagem
          </Badge>
          <h1 className="mt-3 text-2xl sm:text-3xl">Que planta é essa?</h1>
          <p className="mt-2 leading-relaxed text-ink-600">
            Fotografe a planta e o BROTA compara com uma base científica de
            imagens. O resultado vem sempre como probabilidade — nunca como
            certeza absoluta.
          </p>
        </header>

        {!status.configured ? (
          <Alert
            tone="attention"
            className="mt-6"
            title="Identificação automática temporariamente indisponível"
          >
            {status.reason} Você ainda pode enviar a foto para que a equipe e a
            comunidade ajudem a identificar.
          </Alert>
        ) : null}

        {!user ? (
          <Alert tone="info" className="mt-6" title="Entre para identificar">
            A identificação guarda o histórico na sua conta e permite acompanhar
            a análise da equipe quando o resultado não é conclusivo.
            <div className="mt-3">
              <ButtonLink href="/entrar?proximo=/identificar" size="sm">
                Entrar
              </ButtonLink>
            </div>
          </Alert>
        ) : (
          <div className="mt-7">
            <IdentifyPanel
              providerConfigured={status.configured}
              threshold={threshold}
            />
          </div>
        )}

        {/* Como funciona */}
        <section className="mt-10 rounded-lg border border-ink-200 bg-white p-5">
          <h2 className="text-lg">Como conseguir um bom resultado</h2>
          <ul className="mt-3 space-y-2.5 text-sm text-ink-700">
            {[
              'Enquadre uma parte por vez: uma folha, uma flor, um fruto. Fotos da planta inteira funcionam menos bem.',
              'Use luz natural e evite sombra dura sobre a planta.',
              'Aproxime até a estrutura ocupar boa parte do quadro.',
              'Prefira um fundo simples, sem outras plantas atrás.',
            ].map((tip) => (
              <li key={tip} className="flex gap-2.5">
                <Icon name="checkCircle" size={16} className="mt-0.5 shrink-0 text-brand-500" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Histórico */}
        {history.length > 0 ? (
          <section className="mt-10">
            <h2 className="text-lg">Suas identificações</h2>
            <ul className="mt-4 space-y-2.5">
              {history.map((item) => {
                const label = IDENTIFICATION_STATUS[item.status];
                const guess =
                  item.resolvedPlant?.commonNames[0]?.name ??
                  item.resolvedPlant?.scientificName ??
                  item.candidates[0]?.scientificName ??
                  'Sem resultado';

                return (
                  <li
                    key={item.id}
                    className="flex items-center gap-3.5 rounded-lg border border-ink-200 bg-white p-3"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-md object-cover"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-900">
                        {item.resolvedPlant ? (
                          <Link
                            href={`/plantas/${item.resolvedPlant.slug}`}
                            className="hover:text-brand-700 hover:underline"
                          >
                            {guess}
                          </Link>
                        ) : (
                          guess
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-500">
                        {formatRelative(item.createdAt)}
                        {item.topScore !== null
                          ? ` · confiança de ${Math.round(item.topScore * 100)}%`
                          : ''}
                      </p>
                    </div>
                    <Badge tone={label.tone === 'neutral' ? 'neutral' : label.tone}>
                      {label.label}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
