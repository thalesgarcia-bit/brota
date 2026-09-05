import type { ReactNode } from 'react';

import { cn } from '@/lib/utils/cn';
import { Icon, type IconName } from './icon';

/* ===========================================================================
 * ESTADOS DA INTERFACE
 * Carregando, vazio, erro e aviso. Nenhuma tela do BROTA fica "quebrada"
 * quando não há dados — cada situação tem um estado desenhado.
 * =========================================================================== */

export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn('skeleton block', className)} />;
}

export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <span className={cn('block space-y-2', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn('h-3.5', index === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </span>
  );
}

/** Anúncio de carregamento para leitores de tela. */
export function LoadingRegion({ label }: { label: string }) {
  return (
    <span role="status" aria-live="polite" className="sr-only">
      {label}
    </span>
  );
}

export function EmptyState({
  icon = 'sprout',
  title,
  description,
  action,
  className,
}: {
  icon?: IconName;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-lg border border-dashed border-ink-200 bg-ink-25 px-6 py-12 text-center',
        className,
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <Icon name={icon} size={24} />
      </span>
      <h3 className="mt-4 text-lg">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-ink-600">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = 'Não conseguimos carregar isso agora',
  description,
  action,
  className,
}: {
  title?: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center rounded-lg border border-danger-500/20 bg-danger-50 px-6 py-10 text-center',
        className,
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-danger-500">
        <Icon name="alert" size={22} />
      </span>
      <h3 className="mt-4 text-lg text-danger-700">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-danger-700/85">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export type AlertTone = 'info' | 'attention' | 'danger' | 'success';

const ALERT_STYLES: Record<
  AlertTone,
  { wrapper: string; icon: IconName; iconClass: string }
> = {
  info: {
    wrapper: 'border-info-500/20 bg-info-50 text-info-700',
    icon: 'info',
    iconClass: 'text-info-500',
  },
  attention: {
    wrapper: 'border-warning-500/25 bg-warning-50 text-warning-700',
    icon: 'alert',
    iconClass: 'text-warning-500',
  },
  danger: {
    wrapper: 'border-danger-500/25 bg-danger-50 text-danger-700',
    icon: 'alert',
    iconClass: 'text-danger-500',
  },
  success: {
    wrapper: 'border-success-500/25 bg-success-50 text-success-700',
    icon: 'checkCircle',
    iconClass: 'text-success-500',
  },
};

export function Alert({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: AlertTone;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const style = ALERT_STYLES[tone];

  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn(
        'flex gap-3 rounded-md border px-4 py-3 text-sm',
        style.wrapper,
        className,
      )}
    >
      <Icon name={style.icon} size={18} className={cn('mt-0.5 shrink-0', style.iconClass)} />
      <div className="min-w-0">
        {title ? <p className="font-medium">{title}</p> : null}
        <div className={cn(title && 'mt-0.5')}>{children}</div>
      </div>
    </div>
  );
}
