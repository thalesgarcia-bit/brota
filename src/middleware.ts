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

  // O painel administrativo exige papel de staff já na borda.
  if (pathname.startsWith('/admin')) {
    const role = request.auth.user.role;
    if (role !== 'ADMIN' && role !== 'MODERATOR') {
      return NextResponse.redirect(new URL('/sem-permissao', request.nextUrl.origin));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Tudo, exceto arquivos estáticos, imagens do Next e o service worker.
    '/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons/|images/|uploads/).*)',
  ],
};
