import Link from 'next/link';

import { BrotaLogo } from '@/components/ui/logo';

/** Layout enxuto para entrar, cadastrar e recuperar senha. */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-ink-25">
      <header className="px-4 py-6 sm:px-8">
        <Link
          href="/"
          className="inline-flex rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          <BrotaLogo size="md" />
          <span className="sr-only">Voltar para a página inicial do BROTA</span>
        </Link>
      </header>

      <main id="conteudo" className="flex flex-1 items-start justify-center px-4 pb-16 sm:items-center">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="px-4 py-6 text-center text-xs text-ink-400">
        <p>
          Um projeto da Escola Criativa de Uberaba ·{' '}
          <Link href="/privacidade" className="underline hover:text-ink-600">
            Privacidade
          </Link>
        </p>
      </footer>
    </div>
  );
}
