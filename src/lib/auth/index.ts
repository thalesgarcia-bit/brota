import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import type { Role } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import { authConfig } from '@/lib/auth/config';
import { verifyPassword } from '@/lib/auth/password';
import { credentialsSchema } from '@/lib/validation/auth';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      id: 'credentials',
      name: 'E-mail e senha',
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          include: { profile: true, greenProfile: { select: { id: true } } },
        });

        // Conta excluída (LGPD) não autentica.
        if (user?.deletedAt) return null;

        const ok = await verifyPassword(password, user?.passwordHash);
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

      // Recarrega os dados quando a sessão é atualizada explicitamente
      // (troca de papel pelo admin, conclusão do onboarding, novo apelido).
      if (trigger === 'update' && token.id) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id },
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
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.username = token.username;
        session.user.hasGreenProfile = token.hasGreenProfile;
      }
      return session;
    },
  },
});
