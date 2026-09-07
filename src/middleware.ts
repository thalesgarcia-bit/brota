import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';

import { authConfig } from '@/lib/auth/config';

const { auth } = NextAuth(authConfig);

/** Rotas que exigem sessão. O RBAC fino acontece em cada página/ação. */
const PROTECTED_PREFIXES = [
  '/feed',
  '/jardim',
  '/publicar',
  '/salvos',
  '/notificacoes',
  '/configuracoes',
  '/onboarding',
  '/recomendacoes',
  '/admin',
];

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!isProtected) return NextResponse.next();

  if (!request.auth?.user) {
    const url = new URL('/entrar', request.nextUrl.origin);
    url.searchParams.set('proximo', pathname);
    return NextResponse.redirect(url);
  }

  // O papel NÃO é decidido aqui, e isso é deliberado.
  //
  // O middleware roda no runtime Edge e só enxerga o que está assinado dentro
  // do cookie — um token emitido no momento em que a pessoa entrou. Promover
  // alguém a Moderador muda o banco, não o cookie que já está no navegador
  // dela. O resultado era um moderador de verdade sendo barrado na borda por um
  // papel velho, sem nunca chegar à página que teria deixado ele passar.
  //
  // Quem decide é o layout de /admin, com requireStaff(), que lê o papel
  // conferido no banco a cada requisição. Aqui fica só a pergunta que o cookie
  // responde com segurança: existe sessão?
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Tudo, exceto arquivos estáticos, imagens do Next e o service worker.
    '/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons/|images/|uploads/).*)',
  ],
};
