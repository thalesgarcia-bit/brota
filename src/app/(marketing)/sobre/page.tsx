import type { Metadata } from 'next';

import { BrotaMark } from '@/components/ui/logo';
import { Icon, type IconName } from '@/components/ui/icon';
import { ButtonLink } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Sobre o BROTA',
  description:
    'O BROTA nasceu de uma atividade da disciplina de Projeto de Vida, com estudantes do 9º ano da Escola Criativa de Uberaba.',
  alternates: { canonical: '/sobre' },
};

const PILLARS: { icon: IconName; title: string; text: string }[] = [
  {
    icon: 'graduation',
    title: 'Protagonismo juvenil',
    text: 'A pergunta que originou o projeto foi feita por estudantes do 9º ano. O produto que você está vendo é a resposta que eles construíram, com rigor de software profissional.',
  },
  {
    icon: 'globe',
    title: 'Educação ambiental',
    text: 'Cada ficha de espécie ensina algo: por que uma planta precisa de sombra, o que a toxicidade significa na prática, por que espécies nativas sustentam a fauna local.',
  },
  {
    icon: 'users',
    title: 'Colaboração com curadoria',
    text: 'Qualquer pessoa pode sugerir correções. Nenhuma sugestão entra direto na base: passa por revisão, fica registrada com autor, valor anterior e valor novo.',
  },
  {
    icon: 'shield',
    title: 'Responsabilidade',
    text: 'Informação botânica sem fonte confirmada aparece como não confirmada. Identificação incerta é declarada incerta. O BROTA prefere dizer que não sabe.',
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="border-b border-ink-100 bg-linear-to-b from-brand-50/60 to-canvas">
        <div className="container-page py-14 sm:py-20">
          <div className="max-w-3xl">
            <BrotaMark size={56} />
            <h1 className="mt-6 text-3xl sm:text-4xl lg:text-5xl">
              Sobre o BROTA
            </h1>
            <p className="mt-5 font-display text-xl leading-snug text-brand-900 sm:text-2xl">
              “O conhecimento também brota quando é cultivado em comunidade.”
            </p>
            <p className="mt-5 text-lg leading-relaxed text-ink-700">
              O BROTA é uma comunidade inteligente de plantas: um lugar onde a
              pergunta “qual planta combina comigo?” encontra uma resposta
              construída com ciência, tecnologia e colaboração — e onde cada
              pessoa que contribui faz a base crescer para todo mundo.
            </p>
          </div>
        </div>
      </section>

      <section className="container-page py-14 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div>
            <h2 className="text-2xl sm:text-3xl">Como o projeto nasceu</h2>
            <div className="mt-5 space-y-4 leading-relaxed text-ink-700">
              <p>
                Tudo começou em uma atividade da disciplina de{' '}
                <strong>Projeto de Vida</strong>, com estudantes do 9º ano da{' '}
                <strong>Escola Criativa de Uberaba</strong>. A proposta era
                simples e ambiciosa ao mesmo tempo: escolher um problema real e
                imaginar uma solução que unisse tecnologia e propósito.
              </p>
              <p>
                A turma percebeu que muita gente quer ter plantas, compra por
                impulso e vê a planta morrer em poucas semanas. Não por falta de
                cuidado, mas por falta de encontro: a espécie errada, no lugar
                errado, para a rotina errada.
              </p>
              <p>
                Dessa constatação nasceu o BROTA — não como um trabalho de
                escola, mas como um produto de verdade: com base botânica
                referenciada, motor de recomendação explicável, identificação por
                imagem, mapa de dados abertos e um processo editorial que aceita
                contribuição sem abrir mão do rigor.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-ink-200 bg-white p-6 sm:p-8">
            <Badge tone="brand" icon="graduation">
              Créditos
            </Badge>

            <dl className="mt-5 space-y-5">
              <div>
                <dt className="text-xs tracking-wide text-ink-500 uppercase">
                  Idealização e orientação
                </dt>
                <dd className="mt-1 text-lg font-medium text-ink-900">
                  Prof. Thales Garcia
                </dd>
              </div>

              <div>
                <dt className="text-xs tracking-wide text-ink-500 uppercase">
                  Desenvolvimento
                </dt>
                <dd className="mt-1 text-lg font-medium text-ink-900">
                  Alunos do 9º ano da Escola Criativa de Uberaba
                </dd>
              </div>

              <div>
                <dt className="text-xs tracking-wide text-ink-500 uppercase">
                  Parceria
                </dt>
                <dd className="mt-1 space-y-0.5 text-lg font-medium text-ink-900">
                  <p>Profª Mikaella de Sousa</p>
                  <p>Profª Carol Manhezzo</p>
                </dd>
              </div>

              <div>
                <dt className="text-xs tracking-wide text-ink-500 uppercase">
                  Disciplina
                </dt>
                <dd className="mt-1 text-lg font-medium text-ink-900">
                  Projeto de Vida
                </dd>
              </div>
            </dl>

            <p className="mt-6 border-t border-ink-100 pt-5 text-sm leading-relaxed text-ink-600">
              O BROTA foi desenvolvido pelo Prof. Thales Garcia e pelos alunos do
              9º ano da Escola Criativa de Uberaba, em parceria com as Profas.
              Mikaella de Sousa e Carol Manhezzo, a partir de uma atividade
              desenvolvida na disciplina de Projeto de Vida.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-ink-100 bg-ink-25 py-14 sm:py-20">
        <div className="container-page">
          <h2 className="text-2xl sm:text-3xl">No que o BROTA acredita</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {PILLARS.map((pillar) => (
              <div
                key={pillar.title}
                className="rounded-lg border border-ink-200 bg-white p-5"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <Icon name={pillar.icon} size={20} />
                </span>
                <h3 className="mt-4 text-lg">{pillar.title}</h3>
                <p className="mt-1.5 leading-relaxed text-ink-600">{pillar.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-14 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl sm:text-3xl">A tecnologia por trás</h2>
            <div className="mt-5 space-y-4 leading-relaxed text-ink-700">
              <p>
                O BROTA é uma aplicação web progressiva construída com Next.js,
                React e TypeScript, com banco PostgreSQL. Pode ser instalado no
                celular como um aplicativo e funciona parcialmente sem conexão
                para o que já foi acessado.
              </p>
              <p>
                A identificação de espécies por fotografia usa o{' '}
                <a
                  href="https://plantnet.org"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-brand-700 underline underline-offset-2"
                >
                  Pl@ntNet
                </a>
                , iniciativa científica mantida por CIRAD, INRAE, IRD e Inria. O
                mapa de floriculturas usa dados colaborativos do{' '}
                <a
                  href="https://www.openstreetmap.org"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-brand-700 underline underline-offset-2"
                >
                  OpenStreetMap
                </a>
                .
              </p>
              <p>
                As informações de toxicidade seguem a base do{' '}
                <strong>ASPCA Animal Poison Control Center</strong>, e as
                referências botânicas vêm da <strong>Flora e Funga do Brasil</strong>{' '}
                e do <strong>Missouri Botanical Garden</strong>.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl">Como contribuir</h2>
            <div className="mt-5 space-y-4 leading-relaxed text-ink-700">
              <p>
                Encontrou uma informação incompleta ou incorreta? Em qualquer
                ficha de espécie há o botão <em>Sugerir uma correção</em>. Sua
                sugestão vai para uma fila de revisão, com registro de quem
                sugeriu, o que mudou e quem aprovou.
              </p>
              <p>
                Tem uma foto boa de uma espécie do catálogo? Uma dica que
                funcionou no seu quintal? Uma característica regional que só quem
                é da região conhece? Tudo isso faz a base crescer.
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/explorar" iconRight="arrowRight">
                Explorar o catálogo
              </ButtonLink>
              <ButtonLink href="/contato" variant="outline">
                Falar com a equipe
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
