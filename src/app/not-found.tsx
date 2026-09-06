import Link from 'next/link';

import { BrotaMark } from '@/components/ui/logo';
import { ButtonLink } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-ink-25 px-4 text-center">
      <BrotaMark size={56} />
      <h1 className="mt-6 text-2xl sm:text-3xl">Não encontramos esta página</h1>
      <p className="mt-3 max-w-md text-ink-600">
        O endereço pode ter mudado, ou o conteúdo pode ter sido removido. Nada de
        grave — o catálogo continua aqui.
      </p>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/">Ir para a página inicial</ButtonLink>
        <ButtonLink href="/explorar" variant="outline">
          Explorar espécies
        </ButtonLink>
      </div>
      <p className="mt-8 text-sm text-ink-500">
        Se você chegou aqui por um link do próprio BROTA,{' '}
        <Link href="/contato" className="text-brand-700 underline">
          nos avise
        </Link>
        .
      </p>
    </div>
  );
}
