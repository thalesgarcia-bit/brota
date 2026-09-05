import type { ButtonHTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';

import { cn } from '@/lib/utils/cn';
import { Icon, type IconName } from './icon';

/* Botão do design system. Todos os estados previstos: normal, hover, focus,
 * active, disabled e loading. */

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'outline'
  | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const BASE =
  'relative inline-flex items-center justify-center gap-2 rounded-md font-medium ' +
  'transition-colors duration-150 select-none ' +
  'disabled:cursor-not-allowed disabled:opacity-55 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 ' +
    'focus-visible:outline-brand-700 shadow-xs',
  secondary:
    'bg-brand-50 text-brand-800 hover:bg-brand-100 active:bg-brand-200 ' +
    'focus-visible:outline-brand-600',
  outline:
    'border border-ink-200 bg-white text-ink-800 hover:bg-ink-50 ' +
    'active:bg-ink-100 focus-visible:outline-brand-600',
  ghost:
    'text-ink-700 hover:bg-ink-100 active:bg-ink-200 focus-visible:outline-brand-600',
  danger:
    'bg-danger-500 text-white hover:bg-danger-700 active:bg-danger-700 ' +
    'focus-visible:outline-danger-700',
};

const SIZES: Record<ButtonSize, string> = {
  // Altura mínima de 40 px no toque — área confortável exigida na acessibilidade.
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm sm:h-10',
  lg: 'h-12 px-6 text-base',
};

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  fullWidth?: boolean;
  children?: ReactNode;
  className?: string;
};

export type ButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>;

export function Button({
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        BASE,
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <Icon name="loader" size={16} className="animate-spin" />
      ) : iconLeft ? (
        <Icon name={iconLeft} size={size === 'lg' ? 20 : 18} />
      ) : null}
      {children}
      {iconRight && !loading ? (
        <Icon name={iconRight} size={size === 'lg' ? 20 : 18} />
      ) : null}
    </button>
  );
}

export type ButtonLinkProps = CommonProps & {
  href: string;
  prefetch?: boolean;
  target?: string;
  rel?: string;
  'aria-label'?: string;
};

export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  fullWidth = false,
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        BASE,
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {iconLeft ? <Icon name={iconLeft} size={size === 'lg' ? 20 : 18} /> : null}
      {children}
      {iconRight ? <Icon name={iconRight} size={size === 'lg' ? 20 : 18} /> : null}
    </Link>
  );
}

/** Botão só de ícone. Exige rótulo acessível. */
export function IconButton({
  icon,
  label,
  variant = 'ghost',
  size = 'md',
  className,
  ...props
}: Omit<ButtonProps, 'children' | 'iconLeft' | 'iconRight'> & {
  icon: IconName;
  label: string;
}) {
  const dimension =
    size === 'sm' ? 'h-9 w-9' : size === 'lg' ? 'h-12 w-12' : 'h-10 w-10';

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(BASE, VARIANTS[variant], dimension, 'px-0', className)}
      {...props}
    >
      <Icon name={icon} size={size === 'lg' ? 22 : 20} />
    </button>
  );
}
