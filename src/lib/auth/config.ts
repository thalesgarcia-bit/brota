import type { NextAuthConfig } from 'next-auth';
import type { Role } from '@/generated/prisma/client';

/**
 * Configuração compartilhada, sem dependências de Node (Prisma, bcrypt).
 * O middleware roda no runtime Edge e importa apenas este arquivo, por isso
 * os callbacks aqui apenas transportam o que já está assinado no token.
 */
export const authConfig = {
  pages: {
    signIn: '/entrar',
    newUser: '/onboarding',
    error: '/entrar',
  },
  session: {
    // Credenciais exigem JWT: o adaptador de banco não emite sessão nesse fluxo.
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 30,
  },
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth }) {
      return Boolean(auth?.user);
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id =
          typeof token.id === 'string' ? token.id : (token.sub ?? '');
        session.user.role = (token.role ?? 'USER') as Role;
        session.user.username =
          typeof token.username === 'string' ? token.username : null;
        session.user.hasGreenProfile = Boolean(token.hasGreenProfile);
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
