'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { IdentificationStatus } from '@prisma/client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Field } from '@/components/ui/field';
import { Select, Textarea } from '@/components/ui/input';
import { Icon } from '@/components/ui/icon';
import { useToast } from '@/components/ui/toast';
import { IDENTIFICATION_STATUS } from '@/lib/labels';
import { formatRelative } from '@/lib/utils/format';
import { PLANT_ORGANS } from '@/lib/validation/identification';
import { resolveIdentificationAction } from '@/server/actions/identification';

type Candidate = {
  scientificName: string;
  commonNames: string[];
  family: string | null;
  score: number;
  plantId: string | null;
};

type Request = {
  id: string;
  imageUrl: string;
  organ: string | null;
  note: string | null;
  status: IdentificationStatus;
  topScore: number | null;
  createdAt: string;
  adminNotes: string | null;
  author: string;
  candidates: Candidate[];
};

/**
 * Fila administrativa de identificação.
 *
 * Cada pendência mostra a foto, quem enviou, o que a IA sugeriu com que
 * confiança, e as ações disponíveis. Toda resolução notifica o usuário e fica
 * registrada no log de auditoria.
 */
export function IdentificationQueue({
  requests,
  plantOptions,
}: {
  requests: Request[];
  plantOptions: { id: string; label: string }[];
}) {
  return (
    <ul className="space-y-4">
      {requests.map((request) => (
        <li key={request.id}>
          <RequestCard request={request} plantOptions={plantOptions} />
        </li>
      ))}
    </ul>
  );
}

function RequestCard({
  request,
  plantOptions,
}: {
  request: Request;
  plantOptions: { id: string; label: string }[];
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [pending, startTransition] = useTransition();
  const [plantId, setPlantId] = useState(request.candidates[0]?.plantId ?? '');
  const [notes, setNotes] = useState('');

  const statusInfo = IDENTIFICATION_STATUS[request.status];
  const organLabel = PLANT_ORGANS.find(
    (item) => item.value === request.organ,
  )?.label;

  function run(action: string) {
    startTransition(async () => {
      const result = await resolveIdentificationAction({
        requestId: request.id,
        action,
        plantId: action === 'link_existing' ? plantId || null : null,
        adminNotes: notes.trim() || null,
      });

      notify(result.message, result.ok ? 'success' : 'error');
      if (result.ok) router.refresh();
    });
  }

  return (
    <article className="overflow-hidden rounded-lg border border-ink-200 bg-white">
      <div className="grid gap-0 md:grid-cols-[16rem_1fr]">
        {/* Foto */}
        <div className="relative bg-ink-100 md:h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={request.imageUrl}
            alt={`Foto enviada por ${request.author} para identificação`}
            className="h-56 w-full object-cover md:h-full"
            loading="lazy"
          />
          <a
            href={request.imageUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="absolute right-2 bottom-2 inline-flex items-center gap-1.5 rounded-md bg-white/90 px-2.5 py-1.5 text-xs font-medium text-ink-700 backdrop-blur-sm hover:bg-white"
          >
            <Icon name="eye" size={13} />
            Ver em tamanho real
          </a>
        </div>

        {/* Conteúdo */}
        <div className="p-4 sm:p-5">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium text-ink-900">{request.author}</p>
              <p className="text-xs text-ink-500">
                {formatRelative(request.createdAt)}
                {organLabel ? ` · ${organLabel}` : ''}
              </p>
            </div>
            <Badge tone={statusInfo.tone === 'neutral' ? 'neutral' : statusInfo.tone}>
              {statusInfo.label}
            </Badge>
          </header>

          {request.note ? (
            <p className="mt-3 rounded-md border border-ink-100 bg-ink-25 p-3 text-sm text-ink-700">
              <span className="font-medium">Observação do usuário: </span>
              {request.note}
            </p>
          ) : null}

          {/* Sugestões da IA */}
          <section className="mt-4">
            <h3 className="text-xs font-semibold tracking-wide text-ink-500 uppercase">
              Sugestões da identificação automática
            </h3>

            {request.candidates.length === 0 ? (
              <p className="mt-2 text-sm text-ink-500">
                Nenhum candidato retornado — a análise não encontrou espécie
                compatível ou o provedor falhou.
              </p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {request.candidates.map((candidate) => (
                  <li
                    key={candidate.scientificName}
                    className="flex flex-wrap items-baseline justify-between gap-2 rounded-md border border-ink-100 px-3 py-2 text-sm"
                  >
                    <span className="min-w-0">
                      <span className="font-medium text-ink-900 italic">
                        {candidate.scientificName}
                      </span>
                      {candidate.commonNames[0] ? (
                        <span className="text-ink-600"> — {candidate.commonNames[0]}</span>
                      ) : null}
                      {candidate.family ? (
                        <span className="text-ink-400"> · {candidate.family}</span>
                      ) : null}
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {candidate.plantId ? (
                        <Badge tone="success">Já está na base</Badge>
                      ) : (
                        <Badge tone="neutral">Fora da base</Badge>
                      )}
                      <span className="font-medium text-ink-700">
                        {Math.round(candidate.score * 100)}%
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {request.adminNotes ? (
            <p className="mt-3 text-sm text-ink-600">
              <span className="font-medium">Nota interna: </span>
              {request.adminNotes}
            </p>
          ) : null}

          {/* Ações */}
          <section className="mt-5 border-t border-ink-100 pt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id={`planta-${request.id}`} label="Vincular a uma espécie da base">
                {(props) => (
                  <Select
                    {...props}
                    value={plantId}
                    onChange={(event) => setPlantId(event.target.value)}
                  >
                    <option value="">Escolha uma espécie…</option>
                    {plantOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>

              <Field
                id={`notas-${request.id}`}
                label="Mensagem para o usuário (opcional)"
              >
                {(props) => (
                  <Textarea
                    {...props}
                    rows={2}
                    value={notes}
                    maxLength={1000}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Ex.: precisamos de uma foto da folha de perto."
                  />
                )}
              </Field>
            </div>

            <div className="mt-4 flex flex-wrap gap-2.5">
              <Button
                size="sm"
                iconLeft="checkCircle"
                loading={pending}
                disabled={!plantId}
                onClick={() => run('link_existing')}
              >
                Identificar e avisar
              </Button>

              {request.status !== 'IN_REVIEW' ? (
                <Button
                  size="sm"
                  variant="outline"
                  iconLeft="eye"
                  loading={pending}
                  onClick={() => run('start_review')}
                >
                  Marcar em análise
                </Button>
              ) : null}

              <Button
                size="sm"
                variant="outline"
                iconLeft="camera"
                loading={pending}
                onClick={() => run('request_new_photo')}
              >
                Pedir outra foto
              </Button>

              <Button
                size="sm"
                variant="outline"
                iconLeft="xCircle"
                loading={pending}
                onClick={() => run('mark_inadequate')}
              >
                Imagem inadequada
              </Button>

              <Button
                size="sm"
                variant="ghost"
                loading={pending}
                onClick={() => run('close')}
              >
                Encerrar
              </Button>
            </div>

            <p className="mt-3 text-xs text-ink-500">
              A espécie não está na base?{' '}
              <Link href="/admin/plantas/nova" className="text-brand-700 underline">
                Cadastre a nova espécie
              </Link>{' '}
              e volte para vincular.
            </p>
          </section>
        </div>
      </div>
    </article>
  );
}
