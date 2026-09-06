import Link from 'next/link';

import { requireStaff } from '@/lib/auth/session';
import { ROLE_LABELS } from '@/lib/auth/rbac';
import { prisma } from '@/lib/db/prisma';
import { BrotaLogo } from '@/components/ui/logo';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { AdminNav } from '@/components/admin/admin-nav';

/**
 * Casca do painel administrativo.
 *
 * Mesmo design system, mesma tipografia, mesma paleta: o admin é parte do
 * BROTA, não outra aplicação improvisada.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireStaff('/admin');

  const [pendingIdentifications, pendingSuggestions, openReports] =
    await prisma.$transaction([
      prisma.identificationRequest.count({
        where: { status: { in: ['AWAITING_REVIEW', 'IN_REVIEW', 'NEEDS_MORE_INFO'] } },
      }),
      prisma.plantSuggestion.count({ where: { status: 'PENDING' } }),
      prisma.report.count({ where: { status: { in: ['OPEN', 'IN_REVIEW'] } } }),
    ]);

  return (
    <div className="flex min-h-dvh bg-ink-25">
      <AdminNav
        role={user.role}
        badges={{
          '/admin/identificacoes': pendingIdentifications,
          '/admin/sugestoes': pendingSuggestions,
          '/admin/denuncias': openReports,
        }}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-ink-200 bg-white pt-safe">
          <div className="flex h-14 items-center justify-between gap-3 px-4 lg:px-6">
            <Link href="/admin" className="flex items-center gap-2.5 lg:hidden">
              <BrotaLogo size="sm" />
              <Badge tone="neutral">Admin</Badge>
            </Link>

            <p className="hidden text-sm text-ink-500 lg:block">
              Painel administrativo
            </p>

            <div className="flex items-center gap-3">
              <Badge tone="brand">{ROLE_LABELS[user.role]}</Badge>
              <Link
                href="/feed"
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100"
              >
                <Icon name="arrowLeft" size={15} />
                Voltar ao BROTA
              </Link>
            </div>
          </div>
        </header>

        <main id="conteudo" className="flex-1 pb-16">
          {children}
        </main>
      </div>
    </div>
  );
}
