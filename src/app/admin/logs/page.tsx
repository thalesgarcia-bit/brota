import type { Metadata } from 'next';

import { requirePermission } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { EmptyState } from '@/components/ui/feedback';
import { Badge } from '@/components/ui/badge';
import { formatRelative } from '@/lib/utils/format';

export const metadata: Metadata = {
  title: 'Registros',
  robots: { index: false },
};

const ACTION_LABELS: Record<string, string> = {
  'plant.create': 'Cadastrou espécie',
  'plant.update': 'Editou espécie',
  'plant.archive': 'Arquivou espécie',
  'plant.quality_change': 'Alterou a situação editorial de uma ficha',
  'suggestion.approve': 'Aprovou sugestão',
  'suggestion.reject': 'Recusou sugestão',
  'identification.resolve': 'Resolveu identificação',
  'report.handle': 'Tratou denúncia',
  'user.role_change': 'Alterou papel de usuário',
  'password.change': 'Alterou a própria senha',
  'password.reset': 'Redefiniu senha',
  'account.delete': 'Excluiu conta',
};

export default async function AdminLogsPage() {
  await requirePermission('admin:view_logs', '/admin/logs');

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      actor: { select: { profile: { select: { displayName: true } } } },
    },
  });

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <header>
        <h1 className="text-2xl sm:text-3xl">Registros</h1>
        <p className="mt-1.5 max-w-2xl text-ink-600">
          Histórico de ações administrativas, com o antes e o depois de cada
          mudança. É o que permite auditar as decisões editoriais do BROTA.
        </p>
      </header>

      <div className="mt-6">
        {logs.length === 0 ? (
          <EmptyState
            icon="list"
            title="Nenhuma ação registrada ainda"
            description="Aprovações, edições e decisões de moderação aparecem aqui."
          />
        ) : (
          <ul className="space-y-2">
            {logs.map((log) => (
              <li
                key={log.id}
                className="rounded-lg border border-ink-200 bg-white p-4 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p>
                    <span className="font-medium text-ink-900">
                      {log.actor?.profile?.displayName ?? 'Sistema'}
                    </span>{' '}
                    <span className="text-ink-600">
                      {ACTION_LABELS[log.action] ?? log.action}
                    </span>
                  </p>
                  <span className="flex items-center gap-2">
                    <Badge tone="neutral">{log.entityType}</Badge>
                    <span className="text-xs text-ink-500">
                      {formatRelative(log.createdAt)}
                    </span>
                  </span>
                </div>

                {log.before || log.after ? (
                  <details className="mt-2.5">
                    <summary className="cursor-pointer text-xs text-brand-700 hover:underline">
                      Ver antes e depois
                    </summary>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <pre className="scroll-x rounded-md bg-ink-50 p-2.5 font-mono text-xs text-ink-600">
                        {JSON.stringify(log.before ?? {}, null, 2)}
                      </pre>
                      <pre className="scroll-x rounded-md bg-brand-50 p-2.5 font-mono text-xs text-ink-700">
                        {JSON.stringify(log.after ?? {}, null, 2)}
                      </pre>
                    </div>
                  </details>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
