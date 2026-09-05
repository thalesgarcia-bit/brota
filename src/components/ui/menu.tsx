'use client';

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { cn } from '@/lib/utils/cn';
import { Icon, type IconName } from './icon';

/**
 * Menu suspenso acessível: abre por clique, fecha por Esc, clique fora ou
 * seleção, e devolve o foco ao gatilho.
 */
export function DropdownMenu({
  trigger,
  children,
  align = 'end',
  label,
}: {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'start' | 'end';
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={label}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        {trigger}
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          onClick={() => setOpen(false)}
          className={cn(
            'absolute z-40 mt-2 min-w-52 rounded-lg border border-ink-200 bg-white p-1 shadow-lg animate-rise',
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function MenuItem({
  children,
  icon,
  onClick,
  tone = 'default',
  type = 'button',
}: {
  children: ReactNode;
  icon?: IconName;
  onClick?: () => void;
  tone?: 'default' | 'danger';
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      role="menuitem"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm transition-colors',
        'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-600',
        tone === 'danger'
          ? 'text-danger-700 hover:bg-danger-50'
          : 'text-ink-700 hover:bg-ink-100',
      )}
    >
      {icon ? <Icon name={icon} size={16} /> : null}
      {children}
    </button>
  );
}

export function MenuSeparator() {
  return <hr className="my-1 border-ink-100" aria-hidden="true" />;
}
