import type { Metadata } from 'next';
import Link from 'next/link';

import { requirePermission } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/feedback';
import { Alert } from '@/components/ui/feedback';
import { formatDate } from '@/lib/utils/format';
import { RoleControl } from '@/components/admin/role-control';
import { PasswordResetButton } from '@/components/admin/password-reset-button';

// Consulta o banco a cada requisicao, nunca durante o build (Cloudflare + Prisma).
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Usuários',
  robots: { index: false },
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const staff = await requirePermission('admin:manage_users', '/admin/usuarios');
  const { q } = await searchParams;

  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: 'insensitive' } },
              {
                profile: {
                  OR: [
                    { displayName: { contains: q, mode: 'insensitive' } },
                    { username: { contains: q, mode: 'insensitive' } },
                  ],
                },
              },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      profile: { select: { username: true, displayName: true, avatarUrl: true } },
      _count: { select: { posts: true, comments: true, userPlants: true } },
    },
  });

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <header>
        <h1 className="text-2xl sm:text-3xl">Usuários</h1>
        <p className="mt-1.5 text-ink-600">
          Toda mudança de papel fica registrada nos logs.
        </p>
      </header>

      <Alert tone="info" className="mt-5">
        O e-mail aparece aqui apenas para a administração. Ele nunca é exibido no
        perfil público de ninguém.
      </Alert>

      <form action="/admin/usuarios" className="mt-5 flex max-w-md gap-2.5" role="search">
        <label htmlFor="busca-usuarios" className="sr-only">
          Buscar usuário
        </label>
        <input
          id="busca-usuarios"
          name="q"
          type="search"
          defaultValue={q ?? ''}
          placeholder="Nome, usuário ou e-mail"
          className="h-10 flex-1 rounded-md border border-ink-200 bg-white px-3 text-sm focus:border-brand-500 focus:outline-2 focus:outline-brand-500/40"
        />
        <button
          type="submit"
          className="rounded-md border border-ink-200 bg-white px-4 text-sm font-medium text-ink-700 hover:bg-ink-50"
        >
          Buscar
        </button>
      </form>

      <div className="mt-6">
        {users.length === 0 ? (
          <EmptyState
            icon="users"
            title="Nenhum usuário encontrado"
            description="Tente outro termo de busca."
          />
        ) : (
          <ul className="space-y-2.5">
            {users.map((user) => (
              <li
                key={user.id}
                className="flex flex-wrap items-center gap-4 rounded-lg border border-ink-200 bg-white p-4"
              >
                <Avatar
                  name={user.profile?.displayName ?? user.email}
                  src={user.profile?.avatarUrl}
                  size="md"
                />

                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    {user.profile?.username ? (
                      <Link
                        href={`/perfil/${user.profile.username}`}
                        className="font-medium text-ink-900 hover:text-brand-700"
                      >
                        {user.profile.displayName}
                      </Link>
                    ) : (
                      <span className="font-medium text-ink-900">Sem perfil</span>
                    )}
                    {user.id === staff.id ? <Badge tone="brand">Você</Badge> : null}
                  </p>
                  <p className="text-xs text-ink-500">{user.email}</p>
                  <p className="mt-1 text-xs text-ink-500">
                    Desde {formatDate(user.createdAt)} · {user._count.posts}{' '}
                    publicações · {user._count.comments} comentários ·{' '}
                    {user._count.userPlants} plantas
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <PasswordResetButton
                    userId={user.id}
                    userName={user.profile?.displayName ?? user.email}
                    disabled={user.role === 'ADMIN' && user.id !== staff.id}
                  />
                  <RoleControl
                    userId={user.id}
                    role={user.role}
                    disabled={user.id === staff.id}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
