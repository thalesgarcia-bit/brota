'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input, Select, Textarea } from '@/components/ui/input';
import { Switch } from '@/components/ui/choice';
import { Alert } from '@/components/ui/feedback';
import { Icon } from '@/components/ui/icon';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils/cn';
import { ImageCompressionError, uploadImage } from '@/lib/image/compress';
import { POST_TYPES } from '@/lib/validation/post';
import { createPostAction } from '@/server/actions/posts';

const MAX_IMAGES = 6;

export function ComposeForm({
  gardenOptions,
}: {
  gardenOptions: { id: string; label: string }[];
}) {
  const router = useRouter();
  const { notify } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState<string>('MY_PLANT');
  const [caption, setCaption] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [plantId, setPlantId] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [allowComments, setAllowComments] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function uploadFiles(files: FileList) {
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      notify(`No máximo ${MAX_IMAGES} fotos por publicação.`, 'error');
      return;
    }

    setUploading(true);

    for (const file of Array.from(files).slice(0, remaining)) {
      try {
        const stored = await uploadImage(file, 'posts');
        setImages((current) => [...current, stored.url]);
      } catch (failure) {
        notify(
          failure instanceof ImageCompressionError
            ? failure.message
            : 'Falha ao enviar a foto. Verifique sua conexão.',
          'error',
        );
      }
    }

    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  function addTag() {
    const value = tagInput
      .trim()
      .toLowerCase()
      .replace(/^#/, '')
      .replace(/[^a-z0-9à-ü]/g, '');

    if (!value || tags.includes(value) || tags.length >= 8) {
      setTagInput('');
      return;
    }

    setTags((current) => [...current, value]);
    setTagInput('');
  }

  function submit() {
    setErrors({});
    setFormError(null);

    startTransition(async () => {
      const result = await createPostAction({
        type,
        caption,
        plantId: plantId || null,
        stage: null,
        city: city.trim() || null,
        state: state.trim().toUpperCase() || null,
        allowComments,
        tags,
        imageIds: images,
      });

      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.fieldErrors ? null : (result.message ?? 'Erro ao publicar.'));
        return;
      }

      notify('Publicação criada.', 'success');
      router.push('/feed');
    });
  }

  return (
    <div className="space-y-6">
      {formError ? <Alert tone="danger">{formError}</Alert> : null}

      {/* Tipo */}
      <fieldset>
        <legend className="text-sm font-medium text-ink-800">
          Que tipo de publicação é essa?
        </legend>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {POST_TYPES.map((option) => (
            <label
              key={option.value}
              className={cn(
                'flex cursor-pointer flex-col rounded-lg border p-3 transition-all',
                'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand-600',
                type === option.value
                  ? 'border-brand-600 bg-brand-50 ring-1 ring-brand-600'
                  : 'border-ink-200 bg-white hover:border-brand-300',
              )}
            >
              <input
                type="radio"
                name="type"
                value={option.value}
                checked={type === option.value}
                onChange={() => setType(option.value)}
                className="sr-only"
              />
              <span className="text-sm font-medium text-ink-900">{option.label}</span>
              <span className="mt-0.5 text-xs text-ink-500">{option.description}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Fotos */}
      <div>
        <p className="text-sm font-medium text-ink-800">
          Fotos <span className="text-danger-500">*</span>
        </p>
        <p className="mt-0.5 text-xs text-ink-500">
          Até {MAX_IMAGES} imagens. A primeira aparece como capa.
        </p>

        <div className="mt-3 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
          {images.map((url, index) => (
            <div key={url} className="relative aspect-square overflow-hidden rounded-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Foto ${index + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setImages((current) => current.filter((item) => item !== url))}
                aria-label={`Remover foto ${index + 1}`}
                className="absolute top-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-ink-700 hover:text-danger-700"
              >
                <Icon name="close" size={14} />
              </button>
              {index === 0 ? (
                <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-2xs text-white">
                  Capa
                </span>
              ) : null}
            </div>
          ))}

          {images.length < MAX_IMAGES ? (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-md border-2 border-dashed border-ink-300 text-ink-500 transition-colors hover:border-brand-400 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-50"
            >
              <Icon name={uploading ? 'loader' : 'camera'} size={20} className={cn(uploading && 'animate-spin')} />
              <span className="text-xs">{uploading ? 'Enviando' : 'Adicionar'}</span>
            </button>
          ) : null}
        </div>

        {errors['imageIds'] ? (
          <p className="mt-2 text-xs text-danger-700" role="alert">
            {errors['imageIds']}
          </p>
        ) : null}

        <label htmlFor="fotos" className="sr-only">
          Escolher fotos
        </label>
        <input
          ref={fileRef}
          id="fotos"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          multiple
          className="sr-only"
          onChange={(event) => {
            if (event.target.files?.length) void uploadFiles(event.target.files);
          }}
        />
      </div>

      {/* Legenda */}
      <Field
        id="caption"
        label="Legenda"
        required
        error={errors['caption']}
        hint={`${caption.length} de 2200 caracteres`}
      >
        {(props) => (
          <Textarea
            {...props}
            rows={5}
            value={caption}
            maxLength={2200}
            onChange={(event) => setCaption(event.target.value)}
            placeholder={
              type === 'QUESTION'
                ? 'Conte o que está acontecendo com a planta: há quanto tempo, o que mudou, como você tem regado...'
                : 'Escreva sobre essa planta.'
            }
          />
        )}
      </Field>

      {/* Espécie */}
      {gardenOptions.length > 0 ? (
        <Field
          id="plantId"
          label="Espécie relacionada (opcional)"
          hint="Escolha entre as plantas do seu jardim."
        >
          {(props) => (
            <Select
              {...props}
              value={plantId}
              onChange={(event) => setPlantId(event.target.value)}
            >
              <option value="">Nenhuma</option>
              {gardenOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
      ) : null}

      {/* Localização */}
      <fieldset>
        <legend className="text-sm font-medium text-ink-800">
          Localização (opcional)
        </legend>
        <p className="mt-0.5 text-xs text-ink-500">
          Guardamos apenas cidade e estado — nunca a sua posição exata.
        </p>
        <div className="mt-3 flex gap-2.5">
          <div className="flex-1">
            <label htmlFor="city" className="sr-only">
              Cidade
            </label>
            <Input
              id="city"
              value={city}
              maxLength={80}
              onChange={(event) => setCity(event.target.value)}
              placeholder="Cidade"
            />
          </div>
          <div className="w-20">
            <label htmlFor="state" className="sr-only">
              Estado
            </label>
            <Input
              id="state"
              value={state}
              maxLength={2}
              onChange={(event) => setState(event.target.value)}
              placeholder="UF"
            />
          </div>
        </div>
      </fieldset>

      {/* Tags */}
      <div>
        <label htmlFor="tag" className="text-sm font-medium text-ink-800">
          Tags (opcional)
        </label>
        <p className="mt-0.5 text-xs text-ink-500">
          Ajudam outras pessoas a encontrar a sua publicação. Até 8.
        </p>

        <div className="mt-3 flex gap-2.5">
          <Input
            id="tag"
            value={tagInput}
            onChange={(event) => setTagInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ',') {
                event.preventDefault();
                addTag();
              }
            }}
            placeholder="suculentas"
            maxLength={30}
          />
          <Button variant="outline" onClick={addTag}>
            Adicionar
          </Button>
        </div>

        {tags.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <li key={tag}>
                <button
                  type="button"
                  onClick={() => setTags((current) => current.filter((item) => item !== tag))}
                  className="inline-flex items-center gap-1 rounded-full border border-ink-200 px-2.5 py-1 text-sm text-ink-700 hover:border-danger-300 hover:text-danger-700"
                >
                  #{tag}
                  <Icon name="close" size={12} />
                  <span className="sr-only">Remover tag</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {/* Comentários */}
      <div className="rounded-lg border border-ink-200 bg-white p-4">
        <Switch
          id="allowComments"
          label="Permitir comentários"
          description="Você decide se quer receber respostas nesta publicação. Pode mudar depois."
          checked={allowComments}
          onChange={(event) => setAllowComments(event.currentTarget.checked)}
        />
      </div>

      <div className="flex gap-2.5">
        <Button variant="outline" fullWidth onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button fullWidth size="lg" loading={pending} onClick={submit}>
          Publicar
        </Button>
      </div>
    </div>
  );
}
