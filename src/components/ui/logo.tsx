import { cn } from '@/lib/utils/cn';

/* ===========================================================================
 * MARCA BROTA
 *
 * O símbolo une três leituras em uma só forma:
 *  • um broto — duas folhas nascendo de um caule;
 *  • um balão de conversa — a silhueta arredondada com a ponta inferior;
 *  • duas pessoas voltadas uma para a outra — as folhas em espelho.
 *
 * "O conhecimento também brota quando é cultivado em comunidade."
 * =========================================================================== */

type MarkProps = {
  size?: number;
  className?: string;
  /** Versão em contorno para fundos escuros ou uso monocromático. */
  variant?: 'solid' | 'mono';
  title?: string;
};

export function BrotaMark({
  size = 32,
  className,
  variant = 'solid',
  title,
}: MarkProps) {
  const leafLeft = variant === 'mono' ? 'currentColor' : 'var(--color-brand-600)';
  const leafRight = variant === 'mono' ? 'currentColor' : 'var(--color-brand-400)';
  const stem = variant === 'mono' ? 'currentColor' : 'var(--color-brand-800)';

  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className={cn('shrink-0', className)}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}

      {/* Balão de comunidade: silhueta com a ponta voltada para baixo à esquerda. */}
      <path
        d="M20 3.5c9.1 0 16.5 6.6 16.5 15.1 0 8.4-7.4 15.1-16.5 15.1-1.5 0-3-.2-4.4-.5l-6.2 3.3a1 1 0 0 1-1.5-1l.7-5.2C5 27.5 3.5 23.6 3.5 18.6 3.5 10.1 10.9 3.5 20 3.5Z"
        fill={variant === 'mono' ? 'none' : 'var(--color-brand-50)'}
        stroke={variant === 'mono' ? 'currentColor' : 'var(--color-brand-200)'}
        strokeWidth={variant === 'mono' ? 2 : 1.5}
      />

      {/* Caule */}
      <path
        d="M20 28.5v-8.2"
        stroke={stem}
        strokeWidth={2.4}
        strokeLinecap="round"
        fill="none"
      />

      {/* Folha esquerda */}
      <path
        d="M20 20.6c-4.6 0-8.3-3.2-8.3-7.2 4.6 0 8.3 3.2 8.3 7.2Z"
        fill={variant === 'mono' ? 'none' : leafLeft}
        stroke={variant === 'mono' ? 'currentColor' : 'none'}
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* Folha direita — maior, o broto que avança */}
      <path
        d="M20 20.6c0-5.2 4.3-9.4 9.6-9.4 0 5.2-4.3 9.4-9.6 9.4Z"
        fill={variant === 'mono' ? 'none' : leafRight}
        stroke={variant === 'mono' ? 'currentColor' : 'none'}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </svg>
  );
}

type LogoProps = {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Mostra a assinatura "Comunidade Inteligente de Plantas". */
  withTagline?: boolean;
  variant?: 'solid' | 'mono';
};

const SIZES = {
  sm: { mark: 26, text: 'text-lg', tagline: 'text-2xs' },
  md: { mark: 32, text: 'text-xl', tagline: 'text-xs' },
  lg: { mark: 44, text: 'text-2xl', tagline: 'text-sm' },
} as const;

export function BrotaLogo({
  className,
  size = 'md',
  withTagline = false,
  variant = 'solid',
}: LogoProps) {
  const config = SIZES[size];

  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <BrotaMark size={config.mark} variant={variant} />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            'font-display font-semibold tracking-tight',
            config.text,
            variant === 'mono' ? 'text-current' : 'text-brand-900',
          )}
        >
          BROTA
        </span>
        {withTagline ? (
          <span
            className={cn(
              'mt-1 tracking-wide uppercase',
              config.tagline,
              variant === 'mono' ? 'text-current opacity-80' : 'text-ink-500',
            )}
          >
            Comunidade Inteligente de Plantas
          </span>
        ) : null}
      </span>
    </span>
  );
}
