'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

import { cn } from '@/lib/utils/cn';
import { Icon, type IconName } from './icon';

/* Caixas de seleção, opções e alternâncias.
 * Todas com área de toque confortável e estado de foco visível. */

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: ReactNode;
  description?: string;
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ label, description, className, id, ...props }, ref) {
    return (
      <label
        htmlFor={id}
        className={cn(
          'group flex cursor-pointer items-start gap-3 rounded-md py-1.5',
          props.disabled && 'cursor-not-allowed opacity-60',
          className,
        )}
      >
        <span className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
          <input
            ref={ref}
            id={id}
            type="checkbox"
            className="peer h-5 w-5 cursor-pointer appearance-none rounded-xs border border-ink-300 bg-white transition-colors checked:border-brand-600 checked:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed"
            {...props}
          />
          <Icon
            name="check"
            size={14}
            strokeWidth={2.5}
            className="pointer-events-none absolute text-white opacity-0 peer-checked:opacity-100"
          />
        </span>
        <span className="min-w-0">
          <span className="block text-sm text-ink-800">{label}</span>
          {description ? (
            <span className="mt-0.5 block text-xs text-ink-500">{description}</span>
          ) : null}
        </span>
      </label>
    );
  },
);

export type RadioProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: ReactNode;
  description?: string;
};

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { label, description, className, id, ...props },
  ref,
) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-md py-1.5',
        props.disabled && 'cursor-not-allowed opacity-60',
        className,
      )}
    >
      <span className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
        <input
          ref={ref}
          id={id}
          type="radio"
          className="peer h-5 w-5 cursor-pointer appearance-none rounded-full border border-ink-300 bg-white transition-colors checked:border-[6px] checked:border-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed"
          {...props}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-sm text-ink-800">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs text-ink-500">{description}</span>
        ) : null}
      </span>
    </label>
  );
});

/**
 * Cartão selecionável — usado no onboarding e nos filtros.
 * A seleção nunca é comunicada apenas pela cor: há também borda, marca de
 * verificação e o estado nativo do input.
 */
export type ChoiceCardProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  type: 'radio' | 'checkbox';
  label: string;
  description?: string;
  icon?: IconName;
};

export const ChoiceCard = forwardRef<HTMLInputElement, ChoiceCardProps>(
  function ChoiceCard(
    { type, label, description, icon, className, id, ...props },
    ref,
  ) {
    return (
      <label
        htmlFor={id}
        className={cn(
          'group relative flex cursor-pointer gap-3 rounded-lg border border-ink-200 bg-white p-3.5 transition-all duration-150',
          'hover:border-brand-300 hover:bg-brand-50/40',
          'has-checked:border-brand-600 has-checked:bg-brand-50 has-checked:ring-1 has-checked:ring-brand-600',
          'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand-600',
          props.disabled && 'cursor-not-allowed opacity-60',
          className,
        )}
      >
        <input
          ref={ref}
          id={id}
          type={type}
          className="sr-only"
          {...props}
        />

        {icon ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-ink-50 text-ink-600 transition-colors group-has-checked:bg-brand-600 group-has-checked:text-white">
            <Icon name={icon} size={18} />
          </span>
        ) : null}

        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-ink-900">{label}</span>
          {description ? (
            <span className="mt-0.5 block text-xs leading-relaxed text-ink-500">
              {description}
            </span>
          ) : null}
        </span>

        <span
          aria-hidden="true"
          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-ink-300 text-white opacity-0 transition-opacity group-has-checked:border-brand-600 group-has-checked:bg-brand-600 group-has-checked:opacity-100"
        >
          <Icon name="check" size={12} strokeWidth={3} />
        </span>
      </label>
    );
  },
);

export type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
  description?: string;
};

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { label, description, className, id, ...props },
  ref,
) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer items-start justify-between gap-4 py-1',
        props.disabled && 'cursor-not-allowed opacity-60',
        className,
      )}
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink-800">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs text-ink-500">{description}</span>
        ) : null}
      </span>

      <span className="relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          role="switch"
          className="peer h-6 w-11 cursor-pointer appearance-none rounded-full border border-ink-300 bg-ink-200 transition-colors checked:border-brand-600 checked:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed"
          {...props}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-0.5 h-5 w-5 rounded-full bg-white shadow-xs transition-transform duration-200 peer-checked:translate-x-5"
        />
      </span>
    </label>
  );
});
