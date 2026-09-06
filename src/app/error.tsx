'use client';

import { useEffect } from 'react';

import { BrotaMark } from '@/components/ui/logo';
import { Button, ButtonLink } from '@/components/ui/button';

/**
 * Erro inesperado.
 * O usuário recebe uma mensagem humana; o detalhe técnico vai para o console
 * do servidor e para o serviço de monitoramento, quando houver.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[BROTA] erro não tratado:', error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-ink-25 px-4 text-center">
      <BrotaMark size={56} />
      <h1 className="mt-6 text-2xl sm:text-3xl">Algo não funcionou como devia</h1>
      <p className="mt-3 max-w-md text-ink-600">
        Não conseguimos carregar esta parte do BROTA agora. Você pode tentar de
        novo — se continuar assim, a equipe já foi avisada.
      </p>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Button onClick={reset} iconLeft="refresh">
          Tentar novamente
        </Button>
        <ButtonLink href="/" variant="outline">
          Ir para o início
        </ButtonLink>
      </div>

      {error.digest ? (
        <p className="mt-8 font-mono text-xs text-ink-400">
          Código do erro: {error.digest}
        </p>
      ) : null}
    </div>
  );
}
