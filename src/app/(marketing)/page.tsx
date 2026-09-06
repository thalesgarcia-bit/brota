import type { Metadata } from 'next';
import Link from 'next/link';

import { ButtonLink } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icon, type IconName } from '@/components/ui/icon';
import { BrotaMark } from '@/components/ui/logo';
import { PlantCard } from '@/components/plants/plant-card';
import { PlantThumb } from '@/components/plants/plant-thumb';
import { prisma } from '@/lib/db/prisma';
import { getDailyPlant, PLANT_CARD_SELECT } from '@/server/services/plants';
import { getSessionUser } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'BROTA — Comunidade Inteligente de Plantas',
  description:
    'Responda algumas perguntas sobre o seu espaço e descubra quais plantas combinam com você. Catálogo botânico com fontes, identificação por foto, diário de cultivo e uma comunidade que cultiva conhecimento.',
  alternates: { canonical: '/' },
};

// Consulta o banco a cada requisicao, nunca durante o build (Cloudflare + Prisma).
export const dynamic = 'force-dynamic';

const STEPS: { icon: IconName; title: string; description: string }[] = [
  {
    icon: 'compass',
    title: 'Conte sobre o seu espaço',
    description:
      'Onde você mora, quanta luz entra, quanto tempo você tem. São perguntas simples — não é preciso entender de botânica.',
  },
  {
    icon: 'sparkle',
    title: 'Receba o seu Perfil Verde',
    description:
      'O BROTA calcula quais espécies combinam com a sua rotina e explica, em uma frase, o motivo de cada indicação.',
  },
  {
    icon: 'sprout',
    title: 'Cultive e acompanhe',
    description:
      'Registre suas plantas no Meu Jardim, anote regas e brotos no Diário Verde e compartilhe com a comunidade.',
  },
];

const FEATURES: {
  icon: IconName;
  title: string;
  description: string;
  href: string;
}[] = [
  {
    icon: 'scan',
    title: 'Que planta é essa?',
    description:
      'Fotografe e descubra a espécie mais provável. Quando a identificação não é segura, o BROTA diz isso — e leva o caso para a comunidade.',
    href: '/identificar',
  },
  {
    icon: 'book',
    title: 'Base botânica com fonte',
    description:
      'Cada espécie traz cuidados estruturados, problemas comuns e as referências consultadas. Opinião de usuário nunca se mistura com informação validada.',
    href: '/explorar',
  },
  {
    icon: 'note',
    title: 'Diário Verde',
    description:
      'Uma linha do tempo de cada planta: regas, podas, trocas de vaso, primeira flor. O histórico que faz a diferença no ano seguinte.',
    href: '/jardim',
  },
  {
    icon: 'mapPin',
    title: 'Onde comprar',
    description:
      'Floriculturas, viveiros e garden centers perto de você, com dados abertos do OpenStreetMap. Sem endereço inventado.',
    href: '/onde-comprar',
  },
  {
    icon: 'users',
    title: 'Conhecimento colaborativo',
    description:
      'Qualquer pessoa pode sugerir correções e acréscimos. Toda sugestão passa por revisão antes de entrar na base.',
    href: '/comunidade',
  },
  {
    icon: 'globe',
    title: 'Educação ambiental',
    description:
      'Conteúdos sobre rega, substrato, propagação, polinizadores, compostagem e espécies nativas do Brasil.',
    href: '/aprender',
  },
];

export default async function HomePage() {
  const [user, daily, featured, counts] = await Promise.all([
    getSessionUser(),
    getDailyPlant(),
    prisma.plant.findMany({
      where: { status: 'PUBLISHED' },
      select: PLANT_CARD_SELECT,
      orderBy: { difficulty: 'asc' },
      take: 4,
    }),
    prisma.$transaction([
      prisma.plant.count({ where: { status: 'PUBLISHED' } }),
      prisma.educationalArticle.count({ where: { status: 'PUBLISHED' } }),
      prisma.plantSource.count(),
    ]),
  ]);

  const [plantCount, articleCount, sourceCount] = counts;
  const startHref = user ? (user.hasGreenProfile ? '/recomendacoes' : '/onboarding') : '/cadastro';

  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/* Hero                                                              */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative overflow-hidden border-b border-ink-100 bg-linear-to-b from-brand-50/70 to-canvas">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-brand-200/30 blur-3xl"
        />
        <div className="container-page relative grid gap-12 py-14 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
          <div>
            <Badge tone="brand" icon="sprout">
              Comunidade Inteligente de Plantas
            </Badge>

            <h1 className="mt-5 text-3xl leading-[1.1] sm:text-4xl lg:text-[3.25rem] lg:leading-[1.08]">
              Qual planta combina com você e com o lugar em que você vive?
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-600 sm:text-lg">
              O BROTA responde essa pergunta. Ele considera a luz que entra na
              sua casa, o espaço que você tem, a sua rotina e quem mora com você
              — inclusive os animais — e traduz o conhecimento botânico em
              orientações simples.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={startHref} size="lg" iconRight="arrowRight">
                Descobrir minha planta
              </ButtonLink>
              <ButtonLink href="/explorar" size="lg" variant="outline">
                Explorar o catálogo
              </ButtonLink>
            </div>

            <dl className="mt-10 flex flex-wrap gap-x-8 gap-y-4">
              <div>
                <dt className="text-xs tracking-wide text-ink-500 uppercase">
                  Espécies no catálogo
                </dt>
                <dd className="font-display text-2xl font-semibold text-brand-800">
                  {plantCount}
                </dd>
              </div>
              <div>
                <dt className="text-xs tracking-wide text-ink-500 uppercase">
                  Fontes citadas
                </dt>
                <dd className="font-display text-2xl font-semibold text-brand-800">
                  {sourceCount}
                </dd>
              </div>
              <div>
                <dt className="text-xs tracking-wide text-ink-500 uppercase">
                  Conteúdos educativos
                </dt>
                <dd className="font-display text-2xl font-semibold text-brand-800">
                  {articleCount}
                </dd>
              </div>
            </dl>
          </div>

          {/* Demonstração da recomendação: dado real do catálogo. */}
          {featured[0] ? (
            <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
              <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-lg sm:p-5">
                <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-ink-500 uppercase">
                  <BrotaMark size={18} />
                  Seu Perfil Verde
                </div>

                <p className="mt-3 font-display text-xl font-semibold text-brand-900">
                  Jardineiro de Apartamento
                </p>
                <p className="mt-1 text-sm text-ink-600">
                  Boa luminosidade indireta, pouco espaço e preferência por
                  espécies de baixa manutenção.
                </p>

                <div className="mt-5 flex gap-3.5 rounded-lg border border-ink-100 bg-ink-25 p-3">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md">
                    <PlantThumb
                      slug={featured[0].slug}
                      name={featured[0].commonNames[0]?.name ?? featured[0].scientificName}
                      src={featured[0].images[0]?.url}
                      alt={featured[0].images[0]?.alt}
                      rounded="none"
                      priority
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-brand-600 px-2 py-0.5 text-xs font-semibold text-white">
                        92% compatível
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm font-semibold text-ink-900">
                      {featured[0].commonNames[0]?.name ?? featured[0].scientificName}
                    </p>
                    <p className="text-xs text-ink-500 italic">
                      {featured[0].scientificName}
                    </p>
                  </div>
                </div>

                <p className="mt-3 flex gap-2 text-sm leading-relaxed text-ink-700">
                  <Icon name="checkCircle" size={16} className="mt-0.5 shrink-0 text-brand-600" />
                  Boa escolha porque você tem bastante claridade indireta e
                  prefere espécies que perdoam esquecimentos.
                </p>

                <p className="mt-4 border-t border-ink-100 pt-3 text-xs text-ink-500">
                  O BROTA nunca mostra um percentual sem explicar de onde ele veio.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Como funciona                                                     */}
      {/* ---------------------------------------------------------------- */}
      <section className="container-page py-14 sm:py-20">
        <div className="max-w-2xl">
          <h2 className="text-2xl sm:text-3xl">Como funciona</h2>
          <p className="mt-3 text-ink-600">
            Três passos. Nenhum deles exige que você saiba a diferença entre uma
            monstera e um filodendro — essa é justamente a nossa parte.
          </p>
        </div>

        <ol className="mt-10 grid gap-5 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="rounded-lg border border-ink-200 bg-white p-5"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <Icon name={step.icon} size={20} />
                </span>
                <span className="font-display text-2xl font-semibold text-ink-200">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="mt-4 text-lg">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Planta do dia                                                     */}
      {/* ---------------------------------------------------------------- */}
      {daily?.plant ? (
        <section className="border-y border-ink-100 bg-ink-25 py-12 sm:py-16">
          <div className="container-page">
            <div className="flex flex-col gap-6 rounded-xl border border-ink-200 bg-white p-5 sm:flex-row sm:items-center sm:gap-8 sm:p-6">
              <div className="relative aspect-4/3 w-full shrink-0 overflow-hidden rounded-lg sm:aspect-square sm:w-48">
                <PlantThumb
                  slug={daily.plant.slug}
                  name={daily.plant.commonNames[0]?.name ?? daily.plant.scientificName}
                  src={daily.plant.images[0]?.url}
                  alt={daily.plant.images[0]?.alt}
                  rounded="none"
                />
              </div>

              <div className="min-w-0">
                <Badge tone="sand" icon="sparkle">
                  Planta do dia
                </Badge>
                <h2 className="mt-3 text-2xl">
                  {daily.plant.commonNames[0]?.name ?? daily.plant.scientificName}
                </h2>
                <p className="text-sm text-ink-500 italic">
                  {daily.plant.scientificName}
                </p>
                {daily.curiosity ? (
                  <p className="mt-3 max-w-2xl leading-relaxed text-ink-700">
                    {daily.curiosity}
                  </p>
                ) : null}
                <div className="mt-5">
                  <ButtonLink
                    href={`/plantas/${daily.plant.slug}`}
                    variant="secondary"
                    iconRight="arrowRight"
                  >
                    Conhecer a espécie
                  </ButtonLink>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* ---------------------------------------------------------------- */}
      {/* Catálogo                                                          */}
      {/* ---------------------------------------------------------------- */}
      {featured.length > 0 ? (
        <section className="container-page py-14 sm:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-xl">
              <h2 className="text-2xl sm:text-3xl">Comece por aqui</h2>
              <p className="mt-3 text-ink-600">
                Espécies fáceis de cuidar, com cuidados detalhados e fontes
                citadas em cada ficha.
              </p>
            </div>
            <ButtonLink href="/explorar" variant="outline" iconRight="arrowRight">
              Ver todas
            </ButtonLink>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((plant) => (
              <PlantCard key={plant.id} plant={plant} />
            ))}
          </div>
        </section>
      ) : null}

      {/* ---------------------------------------------------------------- */}
      {/* Funcionalidades                                                   */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-t border-ink-100 bg-ink-25 py-14 sm:py-20">
        <div className="container-page">
          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-3xl">
              Mais do que uma enciclopédia de plantas
            </h2>
            <p className="mt-3 text-ink-600">
              O BROTA é feito para o dia a dia de quem cultiva — e para crescer
              junto com quem contribui.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <Link
                key={feature.title}
                href={feature.href}
                className="group rounded-lg border border-ink-200 bg-white p-5 transition-all hover:border-brand-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <Icon name={feature.icon} size={20} />
                </span>
                <h3 className="mt-4 text-lg">{feature.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
                  {feature.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-700">
                  Ver
                  <Icon
                    name="arrowRight"
                    size={15}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Origem                                                            */}
      {/* ---------------------------------------------------------------- */}
      <section className="container-page py-14 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <BrotaMark size={56} />
            <blockquote className="mt-6">
              <p className="font-display text-2xl leading-snug text-brand-900 sm:text-3xl">
                “O conhecimento também brota quando é cultivado em comunidade.”
              </p>
            </blockquote>
          </div>

          <div>
            <p className="leading-relaxed text-ink-700">
              O BROTA nasceu de uma atividade da disciplina de Projeto de Vida,
              com estudantes do 9º ano da Escola Criativa de Uberaba. A pergunta
              inicial era simples: como aproximar as pessoas das plantas usando
              tecnologia? A resposta virou uma plataforma real — com base
              botânica referenciada, identificação por imagem, mapa de dados
              abertos e um processo editorial que aceita contribuição sem abrir
              mão do rigor.
            </p>
            <div className="mt-6">
              <ButtonLink href="/sobre" variant="outline" iconRight="arrowRight">
                Conhecer a história do projeto
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Chamada final                                                     */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-t border-ink-100 bg-brand-900 py-14 text-white sm:py-20">
        <div className="container-page text-center">
          <h2 className="mx-auto max-w-2xl text-2xl text-white sm:text-3xl">
            Descubra a planta certa para o seu canto
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-100">
            Leva menos de dois minutos e não é preciso saber nada de botânica.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink
              href={startHref}
              size="lg"
              className="bg-white text-brand-800 hover:bg-brand-50 active:bg-brand-100"
            >
              Começar agora
            </ButtonLink>
            <ButtonLink
              href="/explorar"
              size="lg"
              variant="ghost"
              className="text-white hover:bg-white/10 active:bg-white/15"
            >
              Só olhar o catálogo
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
