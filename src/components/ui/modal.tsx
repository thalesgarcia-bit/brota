'use client';

import {
  useCallback,
  useEffect,
  useRef,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type SyntheticEvent,
} from 'react';

import { cn } from '@/lib/utils/cn';
import { IconButton } from './button';

/**
 * Diálogo modal.
 *
 * Usa o elemento nativo <dialog>, que já entrega gratuitamente: camada superior,
 * captura de foco, fechamento por Esc e semântica de modal para leitores de tela.
 * No mobile, aparece como folha ancorada na base — mais confortável para o polegar.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** Opcional: uma confirmação pode viver só de título e descrição. */
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      document.body.style.overflow = 'hidden';
    } else if (!open && dialog.open) {
      dialog.close();
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleCancel = useCallback(
    (event: SyntheticEvent<HTMLDialogElement>) => {
      event.preventDefault();
      onClose();
    },
    [onClose],
  );

  // Clique no backdrop fecha; clique no conteúdo não.
  const handleClick = useCallback(
    (event: ReactMouseEvent<HTMLDialogElement>) => {
      if (event.target === ref.current) onClose();
    },
    [onClose],
  );

  return (
    <dialog
      ref={ref}
      onCancel={handleCancel}
      onClick={handleClick}
      aria-labelledby="modal-title"
      aria-describedby={description ? 'modal-description' : undefined}
      className={cn(
        'w-full backdrop:bg-ink-900/45 backdrop:backdrop-blur-[2px]',
        'm-0 mt-auto max-h-[92dvh] rounded-t-2xl bg-white p-0 shadow-lg',
        'sm:m-auto sm:max-h-[85dvh] sm:rounded-xl',
        'animate-rise',
        size === 'sm' && 'sm:max-w-md',
        size === 'md' && 'sm:max-w-xl',
        size === 'lg' && 'sm:max-w-3xl',
      )}
    >
      <div className="flex max-h-[92dvh] flex-col sm:max-h-[85dvh]">
        <header className="flex items-start justify-between gap-4 border-b border-ink-100 px-5 py-4">
          <div className="min-w-0">
            <h2 id="modal-title" className="text-lg">
              {title}
            </h2>
            {description ? (
              <p id="modal-description" className="mt-1 text-sm text-ink-600">
                {description}
              </p>
            ) : null}
          </div>
          <IconButton icon="close" label="Fechar" onClick={onClose} size="sm" />
        </header>

        {/* Sem conteúdo, sem caixa: uma confirmação que vive só de título e
            descrição não deve abrir uma faixa vazia entre o texto e os botões. */}
        {children ? (
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        ) : null}

        {footer ? (
          <footer className="border-t border-ink-100 px-5 py-4 pb-safe">
            {footer}
          </footer>
        ) : null}
      </div>
    </dialog>
  );
}
