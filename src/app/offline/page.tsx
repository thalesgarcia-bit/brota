import type { Metadata } from 'next';

import { BrotaMark } from '@/components/ui/logo';
import { Icon } from '@/components/ui/icon';

export const metadata: Metadata = {
  title: 'Sem conexão',
  robots: { index: false },
};

/** Página exibida pelo service worker quando não há rede e nada em cache. */
export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-ink-25 px-4 text-center">
      <BrotaMark size={56} />
      <h1 className="mt-6 text-2xl sm:text-3xl">Você está sem conexão</h1>
      <p className="mt-3 max-w-md leading-relaxed text-ink-600">
        As páginas que você já visitou continuam disponíveis — o BROTA guarda uma
        cópia delas no seu aparelho. Para ver conteúdo novo, é preciso reconectar.
      </p>

      <ul className="mt-7 space-y-2 text-left text-sm text-ink-600">
        {[
          'Fichas de espécies que você já abriu continuam acessíveis.',
          'O que você escrever agora não será enviado até a conexão voltar.',
          'A identificação por foto e o mapa precisam de internet.',
        ].map((item) => (
          <li key={item} className="flex gap-2.5">
            <Icon name="info" size={16} className="mt-0.5 shrink-0 text-ink-400" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
