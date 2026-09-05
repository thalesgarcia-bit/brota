import type { HTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';

import { cn } from '@/lib/utils/cn';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** `flat` para listas densas, `raised` para destaque pontual. */
  tone?: 'flat' | 'raised' | 'muted';
  padded?: boolean;
};

export function Card({
  tone = 'flat',
  padded = true,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border',
        tone === 'flat' && 'border-ink-200 bg-white',
        tone === 'raised' && 'border-ink-100 bg-white shadow-md',
        tone === 'muted' && 'border-ink-100 bg-ink-50',
        padded && 'p-4 sm:p-5',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardLink({
  href,
  className,
  children,
  ...props
}: { href: string; className?: string; children: ReactNode } & Omit<
  HTMLAttributes<HTMLAnchorElement>,
  'className' | 'children'
>) {
  return (
    <Link
      href={href}
      className={cn(
        'group block rounded-lg border border-ink-200 bg-white transition-all duration-150',
        'hover:border-brand-300 hover:shadow-md',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}

export function SectionHeading({
  title,
  description,
  action,
  className,
  as: Tag = 'h2',
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3';
}) {
  return (
    <div className={cn('flex items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        <Tag className="text-xl sm:text-2xl">{title}</Tag>
        {description ? (
          <p className="mt-1 text-sm text-ink-600">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
