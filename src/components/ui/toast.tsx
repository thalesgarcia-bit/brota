'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { cn } from '@/lib/utils/cn';
import { Icon, type IconName } from './icon';

type ToastTone = 'success' | 'error' | 'info';

type Toast = {
  id: number;
  tone: ToastTone;
  message: string;
};

type ToastContextValue = {
  notify: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_STYLES: Record<ToastTone, { classes: string; icon: IconName }> = {
  success: { classes: 'border-success-500/25 bg-white text-success-700', icon: 'checkCircle' },
  error: { classes: 'border-danger-500/25 bg-white text-danger-700', icon: 'alert' },
  info: { classes: 'border-ink-200 bg-white text-ink-800', icon: 'info' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, tone: ToastTone = 'info') => {
      counter.current += 1;
      const id = counter.current;
      setToasts((current) => [...current, { id, tone, message }]);
      window.setTimeout(() => dismiss(id), 5200);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        // aria-live garante que o aviso chegue a quem usa leitor de tela.
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--spacing-tabbar)+0.75rem)] z-50 flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-md border px-4 py-3 text-sm shadow-lg animate-rise',
              TONE_STYLES[toast.tone].classes,
            )}
          >
            <Icon name={TONE_STYLES[toast.tone].icon} size={17} className="mt-0.5" />
            <span className="min-w-0 flex-1">{toast.message}</span>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dispensar aviso"
              className="-m-1 rounded-xs p-1 text-ink-400 hover:text-ink-700 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-600"
            >
              <Icon name="close" size={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast precisa estar dentro de <ToastProvider>.');
  }
  return context;
}
