'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import {
  apagarPlantaAction,
  arquivarPlantaAction,
} from '@/server/actions/plant-admin';

/**
 * Arquivar, retomar e apagar uma espécie do catálogo.
 *
 * Apagar só aparece depois de arquivada, e o servidor ainda recusa se a ficha
 * estiver no jardim, nos salvos ou nas publicações de alguém.
 */
export function PlantActions({
  plantId,
  nome,
  archived,
}: {
  plantId: string;
  nome: string;
  archived: boolean;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [pending, startTransition] = useTransition();
  const [confirmando, setConfirmando] = useState(false);

  function alternar() {
    startTransition(async () => {
      const result = await arquivarPlantaAction(plantId);
      notify(
        result.message ?? (result.ok ? 'Pronto.' : 'Não foi possível agora.'),
        result.ok ? 'success' : 'error',
      );
      if (result.ok) router.refresh();
    });
  }

  function apagar() {
    startTransition(async () => {
      const result = await apagarPlantaAction(plantId);
      notify(
        result.message ?? (result.ok ? 'Apagada.' : 'Não foi possível agora.'),
        result.ok ? 'success' : 'error',
      );
      setConfirmando(false);
      if (result.ok) router.push('/admin/plantas');
      else router.refresh();
    });
  }

  return (
    <div className="mt-8 rounded-lg border border-ink-200 bg-white p-4">
      <h2 className="text-sm font-medium text-ink-800">Tirar do catálogo</h2>
      <p className="mt-1 text-sm text-ink-600">
        {archived
          ? 'Esta espécie está arquivada: ela não aparece no catálogo. Você pode devolvê-la ao rascunho ou apagá-la de vez.'
          : 'Arquivar tira a ficha do catálogo sem mexer em quem já a usa. É reversível.'}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          loading={pending}
          iconLeft={archived ? 'refresh' : 'eyeOff'}
          onClick={alternar}
        >
          {archived ? 'Retomar como rascunho' : 'Arquivar'}
        </Button>

        {archived ? (
          <Button
            size="sm"
            variant="ghost"
            iconLeft="trash"
            className="text-danger-700 hover:bg-danger-50"
            onClick={() => setConfirmando(true)}
          >
            Apagar de vez
          </Button>
        ) : null}
      </div>

      <Modal
        open={confirmando}
        onClose={() => setConfirmando(false)}
        title="Apagar esta espécie?"
        description={`${nome} sai do BROTA para sempre. Se alguém tiver esta planta no jardim, nos salvos ou em uma publicação, o BROTA vai recusar e explicar o motivo.`}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmando(false)}>
              Cancelar
            </Button>
            <Button variant="danger" loading={pending} onClick={apagar}>
              Apagar de vez
            </Button>
          </>
        }
      />
    </div>
  );
}
