'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { Icon } from '@/components/ui/icon';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils/cn';
import { DIARY_ENTRY_TYPES } from '@/lib/validation/garden';
import { DIARY_TYPE } from '@/lib/labels';
import { createDiaryEntryAction } from '@/server/actions/garden';

/** Registro rápido no Diário Verde: um toque para rega, dois campos para o resto. */
export function DiaryComposer({ userPlantId }: { userPlantId: string }) {
  const router = useRouter();
  const { notify } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState<string>('WATERING');
  const [note, setNote] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [pending, startTransition] = useTransition();

  async function uploadPhoto(file: File) {
    setUploading(true);
    const body = new FormData();
    body.append('file', file);
    body.append('folder', 'garden');

    try {
      const response = await fetch('/api/upload', { method: 'POST', body });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        notify(payload.error ?? 'Não conseguimos enviar a foto.', 'error');
        return;
      }
      setPhotoUrl(payload.url);
      setExpanded(true);
    } catch {
      notify('Não conseguimos enviar a foto. Verifique sua conexão.', 'error');
    } finally {
      setUploading(false);
    }
  }

  function submit(entryType: string) {
    startTransition(async () => {
      const result = await createDiaryEntryAction({
        userPlantId,
        type: entryType,
        note: note.trim() || null,
        photoUrl,
        occurredAt: new Date(),
      });

      if (!result.ok) {
        notify(result.message, 'error');
        return;
      }

      notify(result.message, 'success');
      setNote('');
      setPhotoUrl(null);
      setExpanded(false);
      if (fileRef.current) fileRef.current.value = '';
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border border-ink-200 bg-white p-4">
      <fieldset>
        <legend className="text-sm font-medium text-ink-800">
          O que aconteceu com a sua planta?
        </legend>

        <div className="scroll-x mt-3 -mb-1 flex gap-1.5 pb-1">
          {DIARY_ENTRY_TYPES.map((option) => {
            const info = DIARY_TYPE[option.value];
            const active = type === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setType(option.value);
                  setExpanded(true);
                }}
                aria-pressed={active}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
                  active
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-ink-200 bg-white text-ink-700 hover:bg-ink-50',
                )}
              >
                <Icon name={info.icon} size={14} />
                {info.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {expanded ? (
        <div className="mt-4 space-y-3">
          <label htmlFor="diario-nota" className="sr-only">
            Observação
          </label>
          <Textarea
            id="diario-nota"
            rows={2}
            value={note}
            maxLength={1000}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Alguma observação? (opcional)"
          />

          {photoUrl ? (
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoUrl}
                alt="Foto do registro"
                className="h-24 w-24 rounded-md object-cover"
              />
              <button
                type="button"
                onClick={() => setPhotoUrl(null)}
                aria-label="Remover foto"
                className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-ink-600 shadow-sm hover:text-danger-700"
              >
                <Icon name="close" size={13} />
              </button>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2.5">
            <Button
              variant="outline"
              iconLeft="camera"
              size="sm"
              loading={uploading}
              onClick={() => fileRef.current?.click()}
            >
              Adicionar foto
            </Button>

            <Button
              size="sm"
              iconLeft="check"
              loading={pending}
              onClick={() => submit(type)}
            >
              Registrar
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setExpanded(false);
                setNote('');
                setPhotoUrl(null);
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <Button
            iconLeft="droplet"
            size="sm"
            loading={pending}
            onClick={() => submit('WATERING')}
          >
            Registrar rega de hoje
          </Button>
        </div>
      )}

      <label htmlFor="diario-foto" className="sr-only">
        Foto do registro
      </label>
      <input
        ref={fileRef}
        id="diario-foto"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void uploadPhoto(file);
        }}
      />
    </div>
  );
}
