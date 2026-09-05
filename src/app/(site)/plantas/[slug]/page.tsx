import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getPlantBySlug } from '@/server/services/plants';
import { getSessionUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { clientEnv } from '@/lib/env';
import {
  DATA_QUALITY,
  DIFFICULTY,
  ENVIRONMENT,
  GROWTH,
  HUMIDITY,
  SIZE,
} from '@/lib/labels';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Alert } from '@/components/ui/feedback';
import { ButtonLink } from '@/components/ui/button';
import { PlantThumb } from '@/components/plants/plant-thumb';
import { PlantCard } from '@/components/plants/plant-card';
import { QuickGuide } from '@/components/plants/quick-guide';
import { SafetyPanel } from '@/components/plants/safety-panel';
import { PlantActions } from '@/components/plants/plant-actions';
import { SuggestionDialog } from '@/components/plants/suggestion-dialog';

export const revalidate = 3600;

export async function generateStaticParams() {
  const plants = await prisma.plant.findMany({
    where: { status: 'PUBLISHED' },
    select: { slug: true },
    take: 200,
  });
  return plants.map((plant) => ({ slug: plant.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const plant = await getPlantBySlug(slug);

  if (!plant) {
    return { title: 'Espécie não encontrada' };
  }

  const commonName = plant.commonNames[0]?.name ?? plant.scientificName;
  const description = plant.description.slice(0, 155).trim();

  return {
    title: `${commonName} (${plant.scientificName})`,
    description: `${description}…`,
    alternates: { canonical: `/plantas/${plant.slug}` },
    openGraph: {
      type: 'article',
      title: `${commonName} · ${plant.scientificName}`,
      description,
      url: `${clientEnv.NEXT_PUBLIC_SITE_URL}/plantas/${plant.slug}`,
      ...(plant.images[0]
        ? { images: [{ url: plant.images[0].url, alt: plant.images[0].alt }] }
        : {}),
    },
  };
}

function CareSection({
  title,
  icon,
  content,
}: {
  title: string;
  icon: Parameters<typeof Icon>[0]['name'];
  content: string | null;
}) {
  if (!content) return null;

  return (
    <div className="border-t border-ink-100 py-4 first:border-t-0 first:pt-0">
      <h3 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-ink-500 uppercase">
        <Icon name={icon} size={15} />
        {title}
      </h3>
      <p className="mt-2 leading-relaxed text-ink-700">{content}</p>
    </div>
  );
}

export default async function PlantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [plant, user] = await Promise.all([getPlantBySlug(slug), getSessionUser()]);

  if (!plant) notFound();

  const commonName = plant.commonNames[0]?.name ?? plant.scientificName;
  const otherNames = plant.commonNames.slice(1);
  const quality = DATA_QUALITY[plant.dataQuality];

  const [saved, inGarden] = user
    ? await Promise.all([
        prisma.savedItem.findFirst({
          where: { userId: user.id, plantId: plant.id },
          select: { id: true },
        }),
        prisma.userPlant.findFirst({
          where: { userId: user.id, plantId: plant.id },
          select: { id: true },
        }),
      ])
    : [null, null];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${commonName} (${plant.scientificName})`,
    description: plant.description.slice(0, 300),
    about: {
      '@type': 'Thing',
      name: plant.scientificName,
      alternateName: plant.commonNames.map((item) => item.name),
    },
    inLanguage: 'pt-BR',
    isPartOf: {
      '@type': 'WebSite',
      name: 'BROTA',
      url: clientEnv.NEXT_PUBLIC_SITE_URL,
    },
    dateModified: plant.updatedAt.toISOString(),
    citation: plant.sources.map((source) => source.title),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // Conteúdo controlado pela aplicação, serializado com JSON.stringify.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container-page py-6 sm:py-10">
        <nav aria-label="Você está em" className="mb-5 text-sm text-ink-500">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/explorar" className="hover:text-brand-700">
                Explorar
              </Link>
            </li>
            <li aria-hidden="true">
              <Icon name="chevronRight" size={13} />
            </li>
            <li className="text-ink-700">{commonName}</li>
          </ol>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:gap-12">
          {/* ------------------------------------------------------------ */}
          {/* Coluna principal                                              */}
          {/* ------------------------------------------------------------ */}
          <div className="min-w-0">
            <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-ink-50 sm:aspect-16/10">
              <PlantThumb
                slug={plant.slug}
                name={commonName}
                src={plant.images[0]?.url}
                alt={plant.images[0]?.alt}
                rounded="none"
                priority
              />
            </div>

            {plant.images.length > 1 ? (
              <ul className="mt-3 flex gap-2 overflow-x-auto">
                {plant.images.slice(1).map((image) => (
                  <li key={image.id} className="relative h-20 w-20 shrink-0">
                    <PlantThumb
                      slug={`${plant.slug}-${image.id}`}
                      name={commonName}
                      src={image.url}
                      alt={image.alt}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 flex items-center gap-2 text-xs text-ink-500">
                <Icon name="image" size={14} />
                Esta espécie ainda não tem fotografia cadastrada. A ilustração
                acima é um marcador visual.
              </p>
            )}

            <header className="mt-7">
              <div className="flex flex-wrap items-center gap-2">
                {plant.categories.map((link) => (
                  <Link key={link.categoryId} href={`/explorar?categoria=${link.category.slug}`}>
                    <Badge tone="neutral">{link.category.name}</Badge>
                  </Link>
                ))}
                {plant.isNative ? (
                  <Badge tone="brand" icon="leaf">
                    Nativa do Brasil
                  </Badge>
                ) : null}
              </div>

              <h1 className="mt-3 text-3xl sm:text-4xl">{commonName}</h1>
              <p className="mt-1 text-lg text-ink-500 italic">
                {plant.scientificName}
              </p>

              {otherNames.length > 0 ? (
                <p className="mt-2 text-sm text-ink-600">
                  Também conhecida como{' '}
                  {otherNames.map((item) => item.name).join(', ')}.
                </p>
              ) : null}
            </header>

            {plant.dataQuality !== 'REVIEWED' ? (
              <Alert tone="info" className="mt-5" title={quality.label}>
                {quality.description}
              </Alert>
            ) : null}

            <div className="mt-6 lg:hidden">
              <PlantActions
                plantId={plant.id}
                plantName={commonName}
                initiallySaved={Boolean(saved)}
                initiallyInGarden={Boolean(inGarden)}
                isAuthenticated={Boolean(user)}
              />
            </div>

            <section className="mt-7">
              <p className="text-lg leading-relaxed text-ink-700">
                {plant.description}
              </p>
            </section>

            <section className="mt-8 lg:hidden">
              <SafetyPanel
                humans={plant.toxicityHumans}
                dogs={plant.toxicityDogs}
                cats={plant.toxicityCats}
                note={plant.toxicityNote}
              />
            </section>

            {/* Ficha de cuidados */}
            <section className="mt-8 rounded-lg border border-ink-200 bg-white p-4 sm:p-6">
              <h2 className="text-xl">Como cuidar</h2>
              <div className="mt-4">
                <CareSection title="Substrato" icon="pot" content={plant.substrate} />
                <CareSection title="Adubação" icon="sparkle" content={plant.fertilization} />
                <CareSection title="Poda" icon="scissors" content={plant.pruning} />
                <CareSection title="Propagação" icon="sprout" content={plant.propagation} />
                <CareSection title="Floração" icon="flower" content={plant.flowering} />
              </div>
            </section>

            {/* Problemas comuns */}
            {plant.problems.length > 0 ||
            plant.commonProblems ||
            plant.commonPests ||
            plant.commonMistakes ? (
              <section className="mt-8 rounded-lg border border-ink-200 bg-white p-4 sm:p-6">
                <h2 className="text-xl">Quando algo dá errado</h2>
                <p className="mt-1.5 text-sm text-ink-600">
                  Estas são possibilidades, não um diagnóstico. Observe a planta
                  por alguns dias antes de mudar tudo de uma vez.
                </p>

                {plant.problems.length > 0 ? (
                  <ul className="mt-4 space-y-3">
                    {plant.problems.map((problem) => (
                      <li
                        key={problem.id}
                        className="rounded-md border border-ink-100 bg-ink-25 p-3.5"
                      >
                        <p className="flex items-center gap-2 font-medium text-ink-900">
                          <Icon name="alert" size={15} className="text-warning-500" />
                          {problem.symptom}
                        </p>
                        <p className="mt-1.5 text-sm text-ink-600">
                          <span className="font-medium text-ink-700">
                            Causa provável:
                          </span>{' '}
                          {problem.possibleCause}
                        </p>
                        <p className="mt-1 text-sm text-ink-600">
                          <span className="font-medium text-ink-700">O que fazer:</span>{' '}
                          {problem.suggestion}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : null}

                <div className="mt-4">
                  <CareSection
                    title="Problemas frequentes"
                    icon="info"
                    content={plant.commonProblems}
                  />
                  <CareSection
                    title="Pragas comuns"
                    icon="alert"
                    content={plant.commonPests}
                  />
                  <CareSection
                    title="Erros frequentes"
                    icon="xCircle"
                    content={plant.commonMistakes}
                  />
                </div>
              </section>
            ) : null}

            {plant.curiosity ? (
              <section className="mt-8 rounded-lg border border-sand-200 bg-sand-50 p-4 sm:p-6">
                <h2 className="flex items-center gap-2 text-lg">
                  <Icon name="sparkle" size={18} className="text-clay-500" />
                  Curiosidade
                </h2>
                <p className="mt-2 leading-relaxed text-ink-700">{plant.curiosity}</p>
              </section>
            ) : null}

            {/* Fontes */}
            <section className="mt-8">
              <h2 className="text-lg">Fontes consultadas</h2>
              {plant.sources.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {plant.sources.map((source) => (
                    <li key={source.id} className="text-sm text-ink-600">
                      {source.url ? (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-1.5 text-brand-700 underline-offset-2 hover:underline"
                        >
                          {source.title}
                          <Icon name="externalLink" size={13} />
                        </a>
                      ) : (
                        <span className="text-ink-800">{source.title}</span>
                      )}
                      {source.publisher ? (
                        <span className="text-ink-500"> — {source.publisher}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-ink-500">
                  Nenhuma fonte registrada para esta espécie ainda.
                </p>
              )}

              <div className="mt-5">
                <SuggestionDialog
                  plantId={plant.id}
                  plantName={commonName}
                  isAuthenticated={Boolean(user)}
                />
              </div>
            </section>

            {/* Espécies semelhantes */}
            {plant.similarTo.length > 0 ? (
              <section className="mt-10">
                <h2 className="text-xl">Espécies semelhantes</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {plant.similarTo.map((relation) => (
                    <PlantCard key={relation.toPlantId} plant={relation.to} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          {/* ------------------------------------------------------------ */}
          {/* Coluna lateral                                                */}
          {/* ------------------------------------------------------------ */}
          <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
            <div className="hidden lg:block">
              <PlantActions
                plantId={plant.id}
                plantName={commonName}
                initiallySaved={Boolean(saved)}
                initiallyInGarden={Boolean(inGarden)}
                isAuthenticated={Boolean(user)}
              />
            </div>

            <QuickGuide
              light={plant.light}
              water={plant.water}
              difficulty={plant.difficulty}
            />

            <div className="hidden lg:block">
              <SafetyPanel
                humans={plant.toxicityHumans}
                dogs={plant.toxicityDogs}
                cats={plant.toxicityCats}
                note={plant.toxicityNote}
              />
            </div>

            <div className="rounded-lg border border-ink-200 bg-white p-4 sm:p-5">
              <h2 className="text-base font-semibold">Ficha técnica</h2>
              <dl className="mt-3 divide-y divide-ink-100 text-sm">
                {[
                  { term: 'Família', value: plant.family },
                  { term: 'Gênero', value: plant.genus },
                  { term: 'Origem', value: plant.origin },
                  { term: 'Porte', value: `${SIZE[plant.size].label} — ${SIZE[plant.size].help}` },
                  { term: 'Crescimento', value: GROWTH[plant.growthRate] },
                  { term: 'Dificuldade', value: DIFFICULTY[plant.difficulty].label },
                  { term: 'Umidade do ar', value: HUMIDITY[plant.humidity] },
                  {
                    term: 'Temperatura',
                    value:
                      plant.tempMinC !== null && plant.tempMaxC !== null
                        ? `Entre ${plant.tempMinC} °C e ${plant.tempMaxC} °C`
                        : null,
                  },
                  {
                    term: 'Ambientes',
                    value: plant.environments
                      .map((item) => ENVIRONMENT[item.kind].label)
                      .join(', '),
                  },
                ]
                  .filter((row) => Boolean(row.value))
                  .map((row) => (
                    <div key={row.term} className="flex gap-3 py-2.5">
                      <dt className="w-28 shrink-0 text-ink-500">{row.term}</dt>
                      <dd className="min-w-0 text-ink-800">{row.value}</dd>
                    </div>
                  ))}
              </dl>
            </div>

            <div className="rounded-lg border border-brand-200 bg-brand-50 p-4 sm:p-5">
              <h2 className="text-base font-semibold text-brand-900">
                Essa espécie combina com você?
              </h2>
              <p className="mt-1.5 text-sm text-brand-800/85">
                Responda o questionário do Perfil Verde e veja o quanto ela se
                encaixa no seu espaço e na sua rotina.
              </p>
              <div className="mt-4">
                <ButtonLink
                  href={user?.hasGreenProfile ? '/recomendacoes' : '/onboarding'}
                  variant="primary"
                  fullWidth
                  iconRight="arrowRight"
                >
                  {user?.hasGreenProfile
                    ? 'Ver minhas recomendações'
                    : 'Descobrir meu Perfil Verde'}
                </ButtonLink>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
