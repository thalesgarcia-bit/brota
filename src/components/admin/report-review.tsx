'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { ReportReason, ReportStatus, ReportTargetType } from '@/generated/prisma/client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Field } from '@/components/ui/field';
import { Select, Textarea } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { REPORT_REASON, REPORT_STATUS } from '@/lib/labels';
import { formatRelative } from '@/lib/utils/format';
import { handleReportAction } from '@/server/actions/admin';

type Report = {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  createdAt: string;
  resolution: string | null;
  reporter: string;
  handledBy: string | null;
  content: { text: string; author: string; status: string } | null;
};

const TARGET_LABELS: Record<ReportTargetType, string> = {
  POST: 'Publicação',
  COMMENT: 'Comentário',
  USER: 'Perfil',
};

export function ReportReview({ report }: { report: Report }) {
  const router = useRouter();
  const { notify } = useToast();
  const [action, setAction] = useState<'none' | 'hide_content' | 'remove_content'>(
    'none',
  );
  const [resolution, setResolution] = useState('');
  const [pending, startTransition] = useTransition();

  const statusInfo = REPORT_STATUS[report.status];
  const isOpen = report.status === 'OPEN' || report.status === 'IN_REVIEW';

  function decide(decision: 'RESOLVED' | 'DISMISSED') {
    startTransition(async () => {
      const result = await handleReportAction({
        id: report.id,
        decision,
        action: decision === 'RESOLVED' ? action : 'none',
        resolution: resolution.trim() || null,
      });
      notify(result.message, result.ok ? 'success' : 'error');
      if (result.ok) router.refresh();
    });
  }

  return (
    <article className="rounded-lg border border-ink-200 bg-white p-4 sm:p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{TARGET_LABELS[report.targetType]}</Badge>
            <span className="font-medium text-ink-900">
              {REPORT_REASON[report.reason]}
            </span>
          </p>
          <p className="mt-1 text-xs text-ink-500">
            Reportado por {report.reporter} · {formatRelative(report.createdAt)}
          </p>
        </div>
        <Badge tone={statusInfo.tone}>{statusInfo.label}</Badge>
      </header>

      {report.details ? (
        <p className="mt-3 text-sm text-ink-700">
          <span className="font-medium">Detalhes: </span>
          {report.details}
        </p>
      ) : null}

      {report.content ? (
        <div className="mt-4 rounded-md border border-ink-200 bg-ink-25 p-3.5">
          <p className="text-xs tracking-wide text-ink-500 uppercase">
            Conteúdo denunciado — {report.content.author}
            {report.content.status !== 'PUBLISHED' ? ' (já oculto)' : ''}
          </p>
          <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-ink-700">
            {report.content.text.slice(0, 600)}
            {report.content.text.length > 600 ? '…' : ''}
          </p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-ink-500">
          O conteúdo denunciado não está mais disponível.
        </p>
      )}

      {isOpen ? (
        <div className="mt-5 border-t border-ink-100 pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field id={`acao-${report.id}`} label="Ação sobre o conteúdo">
              {(props) => (
                <Select
                  {...props}
                  value={action}
                  onChange={(event) =>
                    setAction(event.target.value as typeof action)
                  }
                >
                  <option value="none">Nenhuma — manter publicado</option>
                  <option value="hide_content">Ocultar conteúdo</option>
                  <option value="remove_content">Remover conteúdo</option>
                </Select>
              )}
            </Field>

            <Field id={`resolucao-${report.id}`} label="Registro da decisão">
              {(props) => (
                <Textarea
                  {...props}
                  rows={2}
                  value={resolution}
                  maxLength={1000}
                  onChange={(event) => setResolution(event.target.value)}
                  placeholder="O que foi verificado e por que essa decisão."
                />
              )}
            </Field>
          </div>

          <div className="mt-4 flex flex-wrap gap-2.5">
            <Button
              size="sm"
              iconLeft="checkCircle"
              loading={pending}
              onClick={() => decide('RESOLVED')}
            >
              Resolver
            </Button>
            <Button
              size="sm"
              variant="outline"
              loading={pending}
              onClick={() => decide('DISMISSED')}
            >
              Descartar denúncia
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-4 border-t border-ink-100 pt-3 text-sm text-ink-500">
          Tratada por {report.handledBy ?? 'equipe'}.
          {report.resolution ? ` “${report.resolution}”` : ''}
        </p>
      )}
    </article>
  );
}
