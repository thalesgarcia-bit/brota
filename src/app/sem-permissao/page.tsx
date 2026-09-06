import type { Metadata } from 'next';

import { BrotaMark } from '@/components/ui/logo';
import { ButtonLink } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Sem permissão',
  robots: { index: false },
};

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-ink-25 px-4 text-center">
      <BrotaMark size={56} />
      <h1 className="mt-6 text-2xl sm:text-3xl">Esta área não é sua</h1>
      <p className="mt-3 max-w-md text-ink-600">
        Sua conta não tem permissão para acessar esta parte do BROTA. Se você
        acredita que deveria ter, fale com a coordenação do projeto.
      </p>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/feed">Voltar para o início</ButtonLink>
        <ButtonLink href="/contato" variant="outline">
          Falar com a equipe
        </ButtonLink>
      </div>
    </div>
  );
}
