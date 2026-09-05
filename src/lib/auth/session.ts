import 'server-only';
import { redirect } from 'next/navigation';
import type { Role } from '@prisma/client';

import { auth } from '@/lib/auth';
import { can, isStaff, type Permission } from '@/lib/auth/rbac';

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: Role;
  username: string | null;
  hasGreenProfile: boolean;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    email: session.user.email ?? '',
    name: session.user.name ?? null,
    image: session.user.image ?? null,
    role: session.user.role,
    username: session.user.username,
    hasGreenProfile: session.user.hasGreenProfile,
  };
}

/** Exige um usuário autenticado; redireciona para o login preservando o destino. */
export async function requireUser(returnTo?: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    const target = returnTo ? `?proximo=${encodeURIComponent(returnTo)}` : '';
    redirect(`/entrar${target}`);
  }
  return user;
}

/** Exige uma permissão específica. Usar em toda página e ação protegida. */
export async function requirePermission(
  permission: Permission,
  returnTo?: string,
): Promise<SessionUser> {
  const user = await requireUser(returnTo);
  if (!can(user.role, permission)) {
    redirect('/sem-permissao');
  }
  return user;
}

export async function requireStaff(returnTo?: string): Promise<SessionUser> {
  const user = await requireUser(returnTo);
  if (!isStaff(user.role)) {
    redirect('/sem-permissao');
  }
  return user;
}

/** Erro de autorização para uso em server actions e rotas de API. */
export class AuthorizationError extends Error {
  constructor(message = 'Você não tem permissão para esta ação.') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export async function assertPermission(permission: Permission): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthorizationError('É necessário entrar na sua conta.');
  if (!can(user.role, permission)) throw new AuthorizationError();
  return user;
}
