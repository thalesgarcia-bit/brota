import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import type { PrismaClient as AuthPrismaClient, Role } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import { authConfig } from '@/lib/auth/config';
import { verifyPassword } from '@/lib/auth/password';
import { credentialsSchema } from '@/lib/validation/auth';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // `prisma` é uma fachada que resolve o cliente da requisição atual; para o
  // @auth/prisma-adapter, que espera a instância em si, a equivalência é
  // afirmada aqui — apenas nesta fronteira com o pacote externo.
  adapter: PrismaAdapter(prisma as unknown as AuthPrismaClient),
  providers: [
    Credentials({
      id: 'credentials',
      name: 'E-mail e senha',
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(raw) {
        // DIAGNÓSTICO TEMPORÁRIO — remover quando o login estiver estável.
        console.error('[entrar] 3. authorize chamado');

        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          include: { profile: true, greenProfile: { select: { id: true } } },
        });

        console.error('[entrar] 4. banco respondeu, usuário', user ? 'encontrado' : 'não encontrado');

        // Conta excluída (LGPD) não autentica.
        if (user?.deletedAt) return null;

        const ok = await verifyPassword(password, user?.passwordHash);
        console.error('[entrar] 4b. senha conferida:', ok);
        if (!ok || !user) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.profile?.displayName ?? null,
          image: user.profile?.avatarUrl ?? null,
          role: user.role,
          username: user.profile?.username ?? null,
          hasGreenProfile: Boolean(user.greenProfile),
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user.role ?? 'USER') as Role;
        token.username = user.username ?? null;
        token.hasGreenProfile = Boolean(user.hasGreenProfile);
      }

      // Normaliza o ID porque, durante o build, o Auth.js pode tipar
      // campos customizados do token como desconhecidos.
      const tokenId =
        typeof token.id === 'string'
          ? token.id
          : typeof token.sub === 'string'
            ? token.sub
            : null;

      // O token é assinado uma vez e viaja com o navegador. Sem reconferir, uma
      // promoção feita no painel só apareceria para a pessoa depois de ela sair
      // e entrar de novo — e ninguém adivinha isso. Por outro lado, consultar o
      // banco a cada requisição sairia caro à toa: o papel de alguém muda
      // raramente. O meio-termo é reconferir a cada poucos minutos.
      const AGORA = Date.now();
      const INTERVALO_DE_CONFERENCIA = 5 * 60 * 1000;

      const precisaConferir =
        trigger === 'update' ||
        typeof token.conferidoEm !== 'number' ||
        AGORA - token.conferidoEm > INTERVALO_DE_CONFERENCIA;

      if (precisaConferir && tokenId) {
        const fresh = await prisma.user.findUnique({
          where: { id: tokenId },
          select: {
            role: true,
            deletedAt: true,
            profile: { select: { username: true } },
            greenProfile: { select: { id: true } },
          },
        });

        if (fresh && !fresh.deletedAt) {
          token.role = fresh.role;
          token.username = fresh.profile?.username ?? null;
          token.hasGreenProfile = Boolean(fresh.greenProfile);
        }

        token.conferidoEm = AGORA;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const tokenId =
          typeof token.id === 'string'
            ? token.id
            : typeof token.sub === 'string'
              ? token.sub
              : null;

        if (tokenId) {
          session.user.id = tokenId;
        }

        session.user.role =
          typeof token.role === 'string' ? (token.role as Role) : 'USER';
        session.user.username =
          typeof token.username === 'string' ? token.username : null;
        session.user.hasGreenProfile = Boolean(token.hasGreenProfile);
      }

      return session;
    },
  },
});
