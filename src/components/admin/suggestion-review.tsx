'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { SuggestionStatus } from '@prisma/client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Field } from '@/components/ui/field';
import { Textarea } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/choice';
import { Icon } from '@/components/ui/icon';
import { useToast } from '@/components/ui/toast';
import { SUGGESTION_STATUS } from '@/lib/labels';
import { SUGGESTABLE_FIELDS } from '@/lib/validation/community';
import { formatRelative } from '@/lib/utils/format';
import { reviewSuggestionAction } from '@/server/actions/admin';

type Suggestion = {
  id: string;
  field: string;
  currentValue: string | null;
  suggestedValue: string;
  justification: string | null;
  sourceUrl: string | null;
  status: SuggestionStatus;
  createdAt: string;
  reviewNote: string | null;
  author: string;
  reviewer: string | null;
  plant: { slug: string; label: string } | null;
};

export function SuggestionReview({ suggestion }: { suggestion: Suggestion }) {
  const router = useRouter();
  const { notify } = useToast();
  const [note, setNote] = useState('');
  const [apply, setApply] = useState(true);
  const [pending, startTransition] = useTransition();

  const fieldLabel =
    SUGGESTABLE_FIELDS.find((item) => item.value === suggestion.field)?.label ??
    suggestion.field;
  const statusInfo = SUGGESTION_STATUS[suggestion.status];
  const isPending = suggestion.status === 'PENDING';

  function decide(decision: 'APPROVED' | 'REJECTED') {
    startTransition(async () => {
      const result = await reviewSuggestionAction({
        id: suggestion.id,
        decision,
        reviewNote: note.trim() || null,
        applyToPlant: decision === 'APPROVED' && apply,
      });
      notify(result.message, result.ok ? 'success' : 'error');
      if (result.ok) router.refresh();
    });
  }

  return (
    <article className="rounded-lg border border-ink-200 bg-white p-4 sm:p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-ink-600">
            <span className="font-medium text-ink-900">{suggestion.author}</span>{' '}
            sugeriu uma mudança em{' '}
            <strong className="text-ink-800">{fieldLabel}</strong>
            {suggestion.plant ? (
              <>
                {' '}
                de{' '}
                <Link
                  href={`/plantas/${suggestion.plant.slug}`}
                  className="text-brand-700 hover:underline"
                >
                  {suggestion.plant.label}
                </Link>
              </>
            ) : null}
          </p>
          <p className="mt-0.5 text-xs text-ink-500">
            {formatRelative(suggestion.createdAt)}
          </p>
        </div>
        <Badge tone={statusInfo.tone}>{statusInfo.label}</Badge>
      </header>

      {/* Comparação antes / depois */}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-md border border-ink-200 bg-ink-25 p-3.5">
          <h3 className="text-xs font-semibold tracking-wide text-ink-500 uppercase">
            Valor atual
          </h3>
          <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-ink-600">
            {suggestion.currentValue?.trim() || '— vazio —'}
          </p>
        </div>

        <div className="rounded-md border border-brand-300 bg-brand-50 p-3.5">
          <h3 className="text-xs font-semibold tracking-wide text-brand-700 uppercase">
            Valor sugerido
          </h3>
          <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-ink-800">
            {suggestion.suggestedValue}
          </p>
        </div>
      </div>

      {suggestion.justification ? (
        <p className="mt-3 text-sm text-ink-600">
          <span className="font-medium text-ink-800">Justificativa: </span>
          {suggestion.justification}
        </p>
      ) : null}

      {suggestion.sourceUrl ? (
        <p className="mt-2 text-sm">
          <a
            href={suggestion.sourceUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 text-brand-700 hover:underline"
          >
            <Icon name="externalLink" size={14} />
            Fonte indicada
          </a>
        </p>
      ) : null}

      {isPending ? (
        <div className="mt-5 border-t border-ink-100 pt-4">
          <Field id={`nota-${suggestion.id}`} label="Resposta para quem sugeriu (opcional)">
            {(props) => (
              <Textarea
                {...props}
                rows={2}
                value={note}
                maxLength={1000}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Explique a decisão. A pessoa recebe essa mensagem na notificação."
              />
            )}
          </Field>

          <div className="mt-3">
            <Checkbox
              id={`aplicar-${suggestion.id}`}
              label="Aplicar o novo texto diretamente na ficha da espécie"
              description="Marque apenas se o texto sugerido já estiver pronto para publicação."
              checked={apply}
              onChange={(event) => setApply(event.currentTarget.checked)}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2.5">
            <Button
              size="sm"
              iconLeft="checkCircle"
              loading={pending}
              onClick={() => decide('APPROVED')}
            >
              Aprovar
            </Button>
            <Button
              size="sm"
              variant="outline"
              iconLeft="xCircle"
              loading={pending}
              onClick={() => decide('REJECTED')}
            >
              Recusar
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-4 border-t border-ink-100 pt-3 text-sm text-ink-500">
          Revisada por {suggestion.reviewer ?? 'equipe'}.
          {suggestion.reviewNote ? ` “${suggestion.reviewNote}”` : ''}
        </p>
      )}
    </article>
  );
}
