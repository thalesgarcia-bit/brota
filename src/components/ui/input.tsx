'use client';

import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

import { cn } from '@/lib/utils/cn';
import { Icon, type IconName } from './icon';

const CONTROL =
  'w-full rounded-md border bg-white px-3 text-ink-900 placeholder:text-ink-400 ' +
  'transition-colors duration-150 ' +
  'border-ink-200 hover:border-ink-300 ' +
  'focus:border-brand-500 focus:outline-2 focus:outline-offset-0 focus:outline-brand-500/40 ' +
  'disabled:bg-ink-50 disabled:text-ink-400 disabled:cursor-not-allowed ' +
  'aria-[invalid=true]:border-danger-500 aria-[invalid=true]:focus:outline-danger-500/30';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  iconLeft?: IconName;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, iconLeft, ...props },
  ref,
) {
  if (iconLeft) {
    return (
      <span className="relative block">
        <Icon
          name={iconLeft}
          size={18}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-400"
        />
        <input
          ref={ref}
          className={cn(CONTROL, 'h-11 pl-10 text-base sm:h-10 sm:text-sm', className)}
          {...props}
        />
      </span>
    );
  }

  return (
    <input
      ref={ref}
      // 16px no mobile evita o zoom automático do iOS ao focar o campo.
      className={cn(CONTROL, 'h-11 text-base sm:h-10 sm:text-sm', className)}
      {...props}
    />
  );
});

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, rows = 4, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(CONTROL, 'resize-y py-2.5 text-base sm:text-sm', className)}
        {...props}
      />
    );
  },
);

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  children: ReactNode;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <span className="relative block">
      <select
        ref={ref}
        className={cn(
          CONTROL,
          'h-11 appearance-none pr-9 text-base sm:h-10 sm:text-sm',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <Icon
        name="chevronDown"
        size={18}
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-400"
      />
    </span>
  );
});
