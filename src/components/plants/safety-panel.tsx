import type { ToxicityLevel } from '@/generated/prisma/client';

import { Icon } from '@/components/ui/icon';
import { TOXICITY } from '@/lib/labels';
import { cn } from '@/lib/utils/cn';

/* ===========================================================================
 * SEGURANÇA BOTÂNICA
 *
 * Informação de toxicidade nunca fica escondida em uma aba, em um rodapé ou
 * atrás de um clique. Aparece em destaque, com o nível declarado por texto e
 * por ícone — nunca apenas por cor.
 * =========================================================================== */

type Subject = { label: string; level: ToxicityLevel; icon: 'users' | 'user' };

function severityOf(level: ToxicityLevel): number {
  switch (level) {
    case 'SEVERE':
      return 3;
    case 'MODERATE':
      return 2;
    case 'MILD':
      return 1;
    default:
      return 0;
  }
}

export function SafetyPanel({
  humans,
  dogs,
  cats,
  note,
  className,
}: {
  humans: ToxicityLevel;
  dogs: ToxicityLevel;
  cats: ToxicityLevel;
  note: string | null;
  className?: string;
}) {
  const subjects: Subject[] = [
    { label: 'Pessoas e crianças', level: humans, icon: 'users' },
    { label: 'Cães', level: dogs, icon: 'user' },
    { label: 'Gatos', level: cats, icon: 'user' },
  ];

  const worst = Math.max(...subjects.map((subject) => severityOf(subject.level)));
  const hasUnknown = subjects.some((subject) => subject.level === 'UNKNOWN');

  const tone =
    worst >= 3
      ? 'danger'
      : worst >= 1
        ? 'attention'
        : hasUnknown
          ? 'info'
          : 'safe';

  return (
    <section
      aria-labelledby="seguranca-botanica"
      className={cn(
        'rounded-lg border p-4 sm:p-5',
        tone === 'danger' && 'border-danger-500/30 bg-danger-50',
        tone === 'attention' && 'border-warning-500/30 bg-warning-50',
        tone === 'info' && 'border-info-500/25 bg-info-50',
        tone === 'safe' && 'border-success-500/25 bg-success-50',
        className,
      )}
    >
      <h2
        id="seguranca-botanica"
        className="flex items-center gap-2 text-base font-semibold"
      >
        <Icon
          name={tone === 'safe' ? 'shield' : 'alert'}
          size={19}
          className={cn(
            tone === 'danger' && 'text-danger-500',
            tone === 'attention' && 'text-warning-500',
            tone === 'info' && 'text-info-500',
            tone === 'safe' && 'text-success-500',
          )}
        />
        Segurança botânica
      </h2>

      <dl className="mt-3.5 grid gap-2.5 sm:grid-cols-3">
        {subjects.map((subject) => {
          const info = TOXICITY[subject.level];
          return (
            <div
              key={subject.label}
              className="rounded-md border border-white/70 bg-white/70 px-3 py-2.5"
            >
              <dt className="text-xs tracking-wide text-ink-500 uppercase">
                {subject.label}
              </dt>
              <dd
                className={cn(
                  'mt-1 flex items-start gap-1.5 text-sm font-medium',
                  info.tone === 'danger' && 'text-danger-700',
                  info.tone === 'warning' && 'text-warning-700',
                  info.tone === 'success' && 'text-success-700',
                  info.tone === 'info' && 'text-info-700',
                )}
              >
                <Icon
                  name={
                    subject.level === 'NONE'
                      ? 'checkCircle'
                      : subject.level === 'UNKNOWN'
                        ? 'info'
                        : 'alert'
                  }
                  size={15}
                  className="mt-0.5 shrink-0"
                />
                <span>{info.label}</span>
              </dd>
            </div>
          );
        })}
      </dl>

      {note ? (
        <p className="mt-3.5 text-sm leading-relaxed text-ink-700">{note}</p>
      ) : null}

      {hasUnknown ? (
        <p className="mt-3 text-xs text-ink-600">
          Onde a informação não foi confirmada em fonte de referência, o BROTA
          declara isso abertamente em vez de supor. Se você tem uma fonte,{' '}
          <span className="font-medium">sugira uma correção</span> nesta página.
        </p>
      ) : null}
    </section>
  );
}
