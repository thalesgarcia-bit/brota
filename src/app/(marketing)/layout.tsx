import Link from 'next/link';

import { BrotaLogo } from '@/components/ui/logo';
import { ButtonLink } from '@/components/ui/button';
import { SiteFooter } from '@/components/layout/footer';
import { getSessionUser } from '@/lib/auth/session';

/** Layout das páginas institucionais e da porta de entrada do BROTA. */
export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="sticky top-0 z-20 border-b border-ink-100 bg-white/90 backdrop-blur-sm pt-safe">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Link
            href="/"
            className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            <BrotaLogo size="md" />
            <span className="sr-only">BROTA — página inicial</span>
          </Link>

          <nav aria-label="Navegação institucional" className="flex items-center gap-1">
            <Link
              href="/explorar"
              className="hidden rounded-md px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100 sm:block"
            >
              Explorar
            </Link>
            <Link
              href="/aprender"
              className="hidden rounded-md px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100 sm:block"
            >
              Aprender
            </Link>
            <Link
              href="/sobre"
              className="hidden rounded-md px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100 sm:block"
            >
              Sobre
            </Link>

            {user ? (
              <ButtonLink href="/feed" size="sm" className="ml-2">
                Abrir o BROTA
              </ButtonLink>
            ) : (
              <>
                <Link
                  href="/entrar"
                  className="rounded-md px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100"
                >
                  Entrar
                </Link>
                <ButtonLink href="/cadastro" size="sm">
                  Criar conta
                </ButtonLink>
              </>
            )}
          </nav>
        </div>
      </header>

      <main id="conteudo" className="flex-1">
        {children}
      </main>

      <SiteFooter />
    </div>
  );
}
