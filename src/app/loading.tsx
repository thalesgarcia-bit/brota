import { BrotaMark } from '@/components/ui/logo';

export default function Loading() {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4">
      <BrotaMark size={40} className="animate-pulse" />
      <p role="status" aria-live="polite" className="text-sm text-ink-500">
        Carregando…
      </p>
    </div>
  );
}
