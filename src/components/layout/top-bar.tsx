'use client';

import Link from 'next/link';

import { BrotaLogo } from '@/components/ui/logo';
import { Icon } from '@/components/ui/icon';
import { Avatar } from '@/components/ui/avatar';
import { DropdownMenu, MenuItem, MenuSeparator } from '@/components/ui/menu';

type TopBarProps = {
  user: { name: string; username: string | null; image: string | null } | null;
  unreadNotifications: number;
  isStaff: boolean;
};

/** Barra superior: identidade no mobile, atalhos e conta no desktop. */
export function TopBar({ user, unreadNotifications, isStaff }: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-ink-200 bg-white/95 backdrop-blur-sm pt-safe">
      <div className="flex h-[var(--spacing-topbar)] items-center justify-between gap-3 px-4 lg:px-6">
        <Link
          href={user ? '/feed' : '/'}
          className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 lg:hidden"
        >
          <BrotaLogo size="sm" />
          <span className="sr-only">BROTA — página inicial</span>
        </Link>

        <div className="hidden min-w-0 flex-1 lg:block">
          <form action="/explorar" role="search" className="max-w-md">
            <label htmlFor="busca-global" className="sr-only">
              Buscar plantas
            </label>
            <span className="relative block">
              <Icon
                name="search"
                size={17}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-400"
              />
              <input
                id="busca-global"
                name="q"
                type="search"
                placeholder="Buscar espécie, nome popular, cuidado..."
                className="h-10 w-full rounded-md border border-ink-200 bg-ink-25 pr-3 pl-9 text-sm placeholder:text-ink-400 focus:border-brand-500 focus:bg-white focus:outline-2 focus:outline-brand-500/40"
              />
            </span>
          </form>
        </div>

        <div className="flex items-center gap-1">
          <Link
            href="/explorar"
            aria-label="Buscar"
            className="flex h-10 w-10 items-center justify-center rounded-md text-ink-600 hover:bg-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 lg:hidden"
          >
            <Icon name="search" size={21} />
          </Link>

          {user ? (
            <>
              <Link
                href="/notificacoes"
                aria-label={
                  unreadNotifications > 0
                    ? `Notificações, ${unreadNotifications} não lidas`
                    : 'Notificações'
                }
                className="relative flex h-10 w-10 items-center justify-center rounded-md text-ink-600 hover:bg-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                <Icon name="bell" size={21} />
                {unreadNotifications > 0 ? (
                  <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-2xs font-semibold text-white">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                ) : null}
              </Link>

              <DropdownMenu
                label="Menu da conta"
                trigger={
                  <span className="flex h-10 w-10 items-center justify-center">
                    <Avatar name={user.name} src={user.image} size="sm" />
                  </span>
                }
              >
                <div className="px-3 py-2">
                  <p className="truncate text-sm font-medium text-ink-900">
                    {user.name}
                  </p>
                  {user.username ? (
                    <p className="truncate text-xs text-ink-500">@{user.username}</p>
                  ) : null}
                </div>
                <MenuSeparator />
                <Link href={user.username ? `/perfil/${user.username}` : '/perfil'}>
                  <MenuItem icon="user">Meu perfil</MenuItem>
                </Link>
                <Link href="/jardim">
                  <MenuItem icon="sprout">Meu Jardim</MenuItem>
                </Link>
                <Link href="/salvos">
                  <MenuItem icon="bookmark">Salvos</MenuItem>
                </Link>
                <Link href="/configuracoes">
                  <MenuItem icon="settings">Configurações</MenuItem>
                </Link>
                {isStaff ? (
                  <Link href="/admin">
                    <MenuItem icon="shield">Administração</MenuItem>
                  </Link>
                ) : null}
                <MenuSeparator />
                {/* Envio comum do navegador, sem ação de servidor: é o que
                    garante que o cookie de sessão seja apagado de verdade. */}
                <form action="/api/sair" method="post">
                  <MenuItem icon="logout" tone="danger" type="submit">
                    Sair
                  </MenuItem>
                </form>
              </DropdownMenu>
            </>
          ) : (
            <Link
              href="/entrar"
              className="rounded-md px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
