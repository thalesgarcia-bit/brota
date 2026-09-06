'use client';

import { useRef, useState, useTransition } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Select, Textarea } from '@/components/ui/input';
import { Alert, LoadingRegion } from '@/components/ui/feedback';
import { Icon } from '@/components/ui/icon';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils/cn';
import { PLANT_ORGANS } from '@/lib/validation/identification';
import {
  escalateIdentificationAction,
  identifyPlantAction,
} from '@/server/actions/identification';
import type { IdentificationOutcome } from '@/server/services/identification';

type Stage = 'idle' | 'uploading' | 'identifying' | 'result';

/** Linguagem de probabilidade — o BROTA nunca afirma uma espécie com certeza. */
function confidencePhrase(score: number, name: string): string {
  if (score >= 0.7) return `Provavelmente é uma ${name}`;
  if (score >= 0.45) return `Pode ser uma ${name}`;
  return `A espécie mais compatível parece ser ${name}`;
}

export function IdentifyPanel({
  providerConfigured,
  threshold,
}: {
  providerConfigured: boolean;
  threshold: number;
}) {
  const { notify } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [preview, setPreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [organ, setOrgan] = useState('auto');
  const [note, setNote] = useState('');
  const [outcome, setOutcome] = useState<IdentificationOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [escalated, setEscalated] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [pending, startTransition] = useTransition();

  async function handleFile(file: File) {
    setError(null);
    setOutcome(null);
    setEscalated(false);
    setPreview(URL.createObjectURL(file));
    setStage('uploading');

    const body = new FormData();
    body.append('file', file);
    body.append('folder', 'identifications');

    try {
      const response = await fetch('/api/upload', { method: 'POST', body });
      const payload = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !payload.url) {
        setError(payload.error ?? 'Não conseguimos enviar essa imagem.');
        setStage('idle');
        return;
      }

      setImageUrl(payload.url);
      setStage('idle');
    } catch {
      setError('Não conseguimos enviar a imagem. Verifique sua conexão.');
      setStage('idle');
    }
  }

  function identify() {
    if (!imageUrl) return;
    setStage('identifying');
    setError(null);

    startTransition(async () => {
      const result = await identifyPlantAction({
        imageUrl,
        organ,
        note: note.trim() || null,
      });

      if (!result.ok) {
        setError(result.message);
        setStage('idle');
        return;
      }

      setOutcome(result.outcome);
      setStage('result');
    });
  }

  function escalate() {
    if (!outcome) return;
    startTransition(async () => {
      const result = await escalateIdentificationAction({
        requestId: outcome.requestId,
        note: note.trim() || null,
      });
      if (result.ok) {
        setEscalated(true);
        notify(result.message, 'success');
      } else {
        notify(result.message, 'error');
      }
    });
  }

  function reset() {
    setStage('idle');
    setPreview(null);
    setImageUrl(null);
    setOutcome(null);
    setError(null);
    setEscalated(false);
    setNote('');
    if (inputRef.current) inputRef.current.value = '';
  }

  const busy = stage === 'uploading' || stage === 'identifying' || pending;

  return (
    <div className="space-y-5">
      {/* Área de envio */}
      {!preview ? (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const file = event.dataTransfer.files[0];
            if (file) void handleFile(file);
          }}
          className={cn(
            'rounded-xl border-2 border-dashed p-8 text-center transition-colors sm:p-12',
            dragging
              ? 'border-brand-500 bg-brand-50'
              : 'border-ink-300 bg-ink-25 hover:border-brand-400',
          )}
        >
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-brand-600 shadow-xs">
            <Icon name="camera" size={26} />
          </span>

          <p className="mt-4 font-medium text-ink-900">
            Tire uma foto ou escolha da galeria
          </p>
          <p className="mt-1 text-sm text-ink-500">
            No computador, também dá para arrastar o arquivo até aqui.
          </p>

          <div className="mt-6 flex flex-col justify-center gap-2.5 sm:flex-row">
            <Button
              iconLeft="camera"
              onClick={() => inputRef.current?.click()}
              loading={stage === 'uploading'}
            >
              Enviar foto
            </Button>
          </div>

          <label htmlFor="foto-planta" className="sr-only">
            Foto da planta
          </label>
          <input
            ref={inputRef}
            id="foto-planta"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            capture="environment"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-ink-200 bg-white">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Foto enviada para identificação"
              className="max-h-96 w-full object-cover"
            />
            <button
              type="button"
              onClick={reset}
              className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink-700 shadow-sm backdrop-blur-sm hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              aria-label="Escolher outra foto"
            >
              <Icon name="close" size={18} />
            </button>
          </div>

          {stage !== 'result' ? (
            <div className="space-y-4 p-4 sm:p-5">
              <Field
                id="organ"
                label="Que parte da planta aparece na foto?"
                hint="Informar isso melhora bastante a precisão."
              >
                {(props) => (
                  <Select
                    {...props}
                    value={organ}
                    onChange={(event) => setOrgan(event.target.value)}
                  >
                    {PLANT_ORGANS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>

              <Field
                id="note"
                label="Alguma observação? (opcional)"
                hint="Onde encontrou, tamanho aproximado, cheiro — tudo ajuda a equipe."
              >
                {(props) => (
                  <Textarea
                    {...props}
                    rows={2}
                    value={note}
                    maxLength={500}
                    onChange={(event) => setNote(event.target.value)}
                  />
                )}
              </Field>

              <Button
                fullWidth
                size="lg"
                iconLeft="scan"
                loading={busy}
                disabled={!imageUrl}
                onClick={identify}
              >
                {providerConfigured ? 'Identificar' : 'Enviar para análise'}
              </Button>

              {busy ? (
                <LoadingRegion
                  label={
                    stage === 'uploading'
                      ? 'Enviando a imagem'
                      : 'Analisando a fotografia'
                  }
                />
              ) : null}
            </div>
          ) : null}
        </div>
      )}

      {error ? <Alert tone="danger">{error}</Alert> : null}

      {/* Resultado */}
      {outcome ? (
        <div className="rounded-xl border border-ink-200 bg-white p-5">
          {outcome.status === 'identified' && outcome.candidates[0] ? (
            <>
              <h2 className="text-lg">
                {confidencePhrase(
                  outcome.candidates[0].score,
                  outcome.candidates[0].commonNames[0] ??
                    outcome.candidates[0].scientificName,
                )}
              </h2>
              <p className="mt-1 text-sm text-ink-500 italic">
                {outcome.candidates[0].scientificName}
                {outcome.candidates[0].family
                  ? ` · família ${outcome.candidates[0].family}`
                  : ''}
              </p>
              <p className="mt-3 text-sm text-ink-700">
                Confiança de{' '}
                <strong>{Math.round(outcome.candidates[0].score * 100)}%</strong>.
                Identificação por imagem é uma estimativa: confira as
                características antes de tratar como definitivo.
              </p>

              {outcome.candidates[0].plantSlug ? (
                <div className="mt-4">
                  <Link
                    href={`/plantas/${outcome.candidates[0].plantSlug}`}
                    className="inline-flex items-center gap-1.5 font-medium text-brand-700 underline-offset-2 hover:underline"
                  >
                    Ver a ficha completa dessa espécie
                    <Icon name="arrowRight" size={15} />
                  </Link>
                </div>
              ) : (
                <p className="mt-4 text-sm text-ink-600">
                  Essa espécie ainda não está no catálogo do BROTA. Você pode
                  enviar para a equipe avaliar o cadastro.
                </p>
              )}
            </>
          ) : (
            <>
              <h2 className="flex items-center gap-2 text-lg">
                <Icon name="info" size={19} className="text-info-500" />
                Não conseguimos identificar com segurança
              </h2>
              <p className="mt-2 leading-relaxed text-ink-700">
                {outcome.status === 'no_results'
                  ? 'Nenhuma espécie compatível foi encontrada para essa imagem.'
                  : `A melhor correspondência ficou abaixo do limite de confiança de ${Math.round(
                      threshold * 100,
                    )}% que usamos para afirmar uma espécie.`}{' '}
                Preferimos dizer isso a te dar uma resposta errada.
              </p>
            </>
          )}

          {/* Alternativas */}
          {outcome.candidates.length > 1 ? (
            <div className="mt-5 border-t border-ink-100 pt-4">
              <h3 className="text-sm font-semibold text-ink-800">
                Outras espécies compatíveis
              </h3>
              <ul className="mt-2.5 space-y-1.5">
                {outcome.candidates.slice(1).map((candidate) => (
                  <li
                    key={candidate.scientificName}
                    className="flex items-baseline justify-between gap-3 text-sm"
                  >
                    <span className="min-w-0">
                      {candidate.plantSlug ? (
                        <Link
                          href={`/plantas/${candidate.plantSlug}`}
                          className="text-brand-700 hover:underline"
                        >
                          {candidate.scientificName}
                        </Link>
                      ) : (
                        <span className="text-ink-700 italic">
                          {candidate.scientificName}
                        </span>
                      )}
                      {candidate.commonNames[0] ? (
                        <span className="text-ink-500"> — {candidate.commonNames[0]}</span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-xs text-ink-500">
                      {Math.round(candidate.score * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Encaminhar para a equipe */}
          <div className="mt-5 border-t border-ink-100 pt-4">
            {escalated ? (
              <Alert tone="success">
                Enviado para a fila de análise. Você recebe uma notificação
                quando a equipe concluir.
              </Alert>
            ) : (
              <>
                <p className="text-sm text-ink-700">
                  {outcome.status === 'identified'
                    ? 'Acha que não é essa espécie? Envie para a análise da equipe.'
                    : 'Deseja enviar para análise da equipe e da comunidade?'}
                </p>
                <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
                  <Button
                    variant={outcome.status === 'identified' ? 'outline' : 'primary'}
                    iconLeft="users"
                    loading={pending}
                    onClick={escalate}
                  >
                    Enviar para análise
                  </Button>
                  <Button variant="ghost" iconLeft="camera" onClick={reset}>
                    Tentar outra foto
                  </Button>
                </div>
              </>
            )}
          </div>

          {outcome.remainingRequests !== null ? (
            <p className="mt-4 text-xs text-ink-400">
              Consultas restantes no serviço de identificação hoje:{' '}
              {outcome.remainingRequests}.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
