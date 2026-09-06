import type { Metadata } from 'next';
import Link from 'next/link';

import { Icon } from '@/components/ui/icon';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Contato',
  description: 'Fale com a equipe do BROTA.',
  alternates: { canonical: '/contato' },
};

export default function ContactPage() {
  return (
    <div className="container-reading py-12 sm:py-16">
      <h1 className="text-3xl sm:text-4xl">Contato</h1>
      <p className="mt-3 leading-relaxed text-ink-600">
        O BROTA é mantido por estudantes e professores da Escola Criativa de
        Uberaba. Escolha o caminho que faz mais sentido para o seu assunto.
      </p>

      <div className="mt-8 space-y-4">
        <Card>
          <h2 className="flex items-center gap-2 text-lg">
            <Icon name="edit" size={19} className="text-brand-600" />
            Corrigir uma informação botânica
          </h2>
          <p className="mt-2 text-ink-600">
            Não precisa escrever para a equipe: em cada ficha de espécie há o
            botão <em>Sugerir uma correção</em>. A sugestão entra direto na fila
            de revisão, com registro de autoria.
          </p>
          <Link
            href="/explorar"
            className="mt-3 inline-flex items-center gap-1.5 font-medium text-brand-700 hover:underline"
          >
            Ir para o catálogo
            <Icon name="arrowRight" size={15} />
          </Link>
        </Card>

        <Card>
          <h2 className="flex items-center gap-2 text-lg">
            <Icon name="flag" size={19} className="text-brand-600" />
            Denunciar conteúdo
          </h2>
          <p className="mt-2 text-ink-600">
            Toda publicação e todo comentário tem a opção de denúncia no menu de
            três pontos. A equipe de moderação avalia cada caso.
          </p>
        </Card>

        <Card>
          <h2 className="flex items-center gap-2 text-lg">
            <Icon name="shield" size={19} className="text-brand-600" />
            Privacidade e exclusão de dados
          </h2>
          <p className="mt-2 text-ink-600">
            A exclusão da conta está disponível em Configurações. Para outras
            solicitações relacionadas à LGPD, use o canal institucional da
            escola.
          </p>
          <Link
            href="/privacidade"
            className="mt-3 inline-flex items-center gap-1.5 font-medium text-brand-700 hover:underline"
          >
            Ler a política de privacidade
            <Icon name="arrowRight" size={15} />
          </Link>
        </Card>

        <Card tone="muted">
          <h2 className="text-lg">Contato institucional</h2>
          <p className="mt-2 text-ink-600">
            Escola Criativa de Uberaba — disciplina de Projeto de Vida.
            <br />
            Coordenação do projeto: Prof. Thales Garcia.
          </p>
          <p className="mt-3 text-sm text-ink-500">
            O endereço de e-mail para contato ainda será definido pela equipe e
            aparecerá aqui.
          </p>
        </Card>
      </div>
    </div>
  );
}
