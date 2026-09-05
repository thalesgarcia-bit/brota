import { cn } from '@/lib/utils/cn';
import { Icon, type IconName } from './icon';

/**
 * Medidor do "Guia rápido" da página da planta.
 *
 * Nunca comunica pela cor ou pelo desenho sozinho: cada medidor traz o rótulo
 * textual do nível e um valor acessível via `role="meter"`.
 */
export function LevelMeter({
  icon,
  label,
  level,
  max = 4,
  levelLabel,
  className,
}: {
  icon: IconName;
  label: string;
  /** 1 a `max`. */
  level: number;
  max?: number;
  levelLabel: string;
  className?: string;
}) {
  const safeLevel = Math.min(Math.max(level, 0), max);

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-ink-50 text-ink-600">
        <Icon name={icon} size={17} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs font-medium tracking-wide text-ink-500 uppercase">
            {label}
          </span>
          <span className="text-sm font-medium text-ink-800">{levelLabel}</span>
        </div>

        <div
          role="meter"
          aria-valuenow={safeLevel}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuetext={`${label}: ${levelLabel}`}
          className="mt-1.5 flex gap-1"
        >
          {Array.from({ length: max }).map((_, index) => (
            <span
              key={index}
              aria-hidden="true"
              className={cn(
                'h-1.5 flex-1 rounded-full',
                index < safeLevel ? 'bg-brand-500' : 'bg-ink-200',
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
