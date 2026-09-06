import type { Metadata } from 'next';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';

import { requireUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { EmptyState } from '@/components/ui/feedback';
import { Icon, type IconName } from '@/components/ui/icon';
import { SubmitButton } from '@/components/ui/submit-button';
import { formatRelative } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

export const metadata: Metadata = {
  title: 'Notificações',
  robots: { index: false },
};

const ICONS: Record<string, IconName> = {
  COMMENT: 'message',
  REPLY: 'message',
  LIKE: 'heart',
  IDENTIFICATION_RESOLVED: 'scan',
  SUGGESTION_APPROVED: 'checkCircle',
  SUGGESTION_REJECTED: 'xCircle',
  REMINDER: 'droplet',
  ADMIN_NOTICE: 'shield',
  ACHIEVEMENT: 'star',
};

async function markAllAsRead() {
  'use server';
  const user = await requireUser('/notificacoes');
  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath('/notificacoes');
}

export default async function NotificationsPage() {
  const user = await requireUser('/notificacoes');

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 60,
  });

  const unread = notifications.filter((item) => item.readAt === null).length;

  return (
    <div className="container-page py-6 sm:py-10">
      <div className="mx-auto max-w-2xl">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl">Notificações</h1>
            <p className="mt-1 text-ink-600">
              {unread > 0
                ? `${unread} ${unread === 1 ? 'não lida' : 'não lidas'}`
                : 'Tudo em dia.'}
            </p>
          </div>

          {unread > 0 ? (
            <form action={markAllAsRead}>
              <SubmitButton variant="outline" size="sm" iconLeft="check">
                Marcar todas como lidas
              </SubmitButton>
            </form>
          ) : null}
        </header>

        {notifications.length === 0 ? (
          <EmptyState
            className="mt-8"
            icon="bell"
            title="Nenhuma notificação por aqui"
            description="Quando alguém comentar em uma publicação sua, uma identificação for concluída ou uma sugestão for aprovada, você fica sabendo aqui."
          />
        ) : (
          <ul className="mt-6 space-y-2">
            {notifications.map((item) => {
              const content = (
                <div
                  className={cn(
                    'flex gap-3.5 rounded-lg border p-4 transition-colors',
                    item.readAt === null
                      ? 'border-brand-200 bg-brand-50/60'
                      : 'border-ink-200 bg-white',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                      item.readAt === null
                        ? 'bg-brand-600 text-white'
                        : 'bg-ink-100 text-ink-500',
                    )}
                  >
                    <Icon name={ICONS[item.type] ?? 'bell'} size={17} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink-900">{item.title}</p>
                    {item.body ? (
                      <p className="mt-0.5 text-sm leading-relaxed text-ink-600">
                        {item.body}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-ink-500">
                      {formatRelative(item.createdAt)}
                    </p>
                  </div>

                  {item.readAt === null ? (
                    <span className="sr-only">Não lida</span>
                  ) : null}
                </div>
              );

              return (
                <li key={item.id}>
                  {item.linkUrl ? (
                    <Link
                      href={item.linkUrl}
                      className="block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                    >
                      {content}
                    </Link>
                  ) : (
                    content
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
