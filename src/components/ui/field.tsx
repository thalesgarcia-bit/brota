import type { ReactNode } from 'react';

import { cn } from '@/lib/utils/cn';
import { Icon } from './icon';

/* Envelope de campo de formulário: rótulo, dica, erro e ligação por id.
 * Nenhum input do BROTA aparece sem rótulo. */

type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  /** Oculta visualmente o rótulo, mantendo-o para leitores de tela. */
  labelHidden?: boolean;
  children: (props: {
    id: string;
    'aria-describedby': string | undefined;
    'aria-invalid': boolean | undefined;
  }) => ReactNode;
  className?: string;
};

export function Field({
  id,
  label,
  hint,
  error,
  required,
  labelHidden,
  children,
  className,
}: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label
        htmlFor={id}
        className={cn(
          'text-sm font-medium text-ink-800',
          labelHidden && 'sr-only',
        )}
      >
        {label}
        {required ? (
          <span className="ml-1 text-danger-500" aria-hidden="true">
            *
          </span>
        ) : null}
        {required ? <span className="sr-only"> (obrigatório)</span> : null}
      </label>

      {hint ? (
        <p id={hintId} className="text-xs text-ink-500">
          {hint}
        </p>
      ) : null}

      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
      })}

      {error ? (
        <p
          id={errorId}
          className="flex items-start gap-1.5 text-xs text-danger-700"
          role="alert"
        >
          <Icon name="alert" size={14} className="mt-px" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
