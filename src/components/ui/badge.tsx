import type { ReactNode } from 'react';

import { cn } from '@/lib/utils/cn';
import { Icon, type IconName } from './icon';

export type BadgeTone =
  | 'neutral'
  | 'brand'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'sand';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-ink-100 text-ink-700 border-ink-200',
  brand: 'bg-brand-50 text-brand-800 border-brand-200',
  success: 'bg-success-50 text-success-700 border-success-500/25',
  warning: 'bg-warning-50 text-warning-700 border-warning-500/25',
  danger: 'bg-danger-50 text-danger-700 border-danger-500/25',
  info: 'bg-info-50 text-info-700 border-info-500/25',
  sand: 'bg-sand-100 text-clay-700 border-sand-200',
};

export function Badge({
  children,
  tone = 'neutral',
  icon,
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  icon?: IconName;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        TONES[tone],
        className,
      )}
    >
      {icon ? <Icon name={icon} size={13} /> : null}
      {children}
    </span>
  );
}

/** Chip clicável — usado em filtros e tags. */
export function Chip({
  children,
  selected = false,
  icon,
  onClick,
  as = 'button',
  href,
  className,
}: {
  children: ReactNode;
  selected?: boolean;
  icon?: IconName;
  onClick?: () => void;
  as?: 'button' | 'span';
  href?: string;
  className?: string;
}) {
  const classes = cn(
    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors duration-150',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
    selected
      ? 'border-brand-600 bg-brand-600 text-white hover:bg-brand-700'
      : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300 hover:bg-ink-50',
    className,
  );

  if (href) {
    return (
      <a href={href} className={classes}>
        {icon ? <Icon name={icon} size={14} /> : null}
        {children}
      </a>
    );
  }

  if (as === 'span') {
    return (
      <span className={classes}>
        {icon ? <Icon name={icon} size={14} /> : null}
        {children}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={classes}
    >
      {icon ? <Icon name={icon} size={14} /> : null}
      {children}
      {selected ? <Icon name="close" size={13} className="ml-0.5" /> : null}
    </button>
  );
}
