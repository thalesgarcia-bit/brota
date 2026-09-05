'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import {
  addPlantToGardenAction,
  toggleSavePlantAction,
} from '@/server/actions/plants';

/** Ações do usuário sobre uma espécie: salvar e adicionar ao Meu Jardim. */
export function PlantActions({
  plantId,
  plantName,
  initiallySaved,
  initiallyInGarden,
  isAuthenticated,
}: {
  plantId: string;
  plantName: string;
  initiallySaved: boolean;
  initiallyInGarden: boolean;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [saved, setSaved] = useState(initiallySaved);
  const [inGarden, setInGarden] = useState(initiallyInGarden);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nickname, setNickname] = useState(plantName);
  const [pending, startTransition] = useTransition();

  function requireAccount(): boolean {
    if (isAuthenticated) return false;
    notify('Entre na sua conta para guardar plantas.', 'info');
    router.push(`/entrar?proximo=${encodeURIComponent(window.location.pathname)}`);
    return true;
  }

  function handleSave() {
    if (requireAccount()) return;

    // Atualização otimista: o botão responde na hora e volta atrás se falhar.
    const previous = saved;
    setSaved(!previous);

    startTransition(async () => {
      const result = await toggleSavePlantAction(plantId);
      if (!result.ok) {
        setSaved(previous);
        notify(result.message ?? 'Não foi possível salvar agora.', 'error');
        return;
      }
      setSaved(result.active);
      if (result.message) notify(result.message, 'success');
    });
  }

  function handleAddToGarden() {
    startTransition(async () => {
      const result = await addPlantToGardenAction(plantId, nickname);
      if (!result.ok) {
        notify(result.message ?? 'Não foi possível adicionar agora.', 'error');
        return;
      }
      setInGarden(true);
      setDialogOpen(false);
      notify(result.message ?? 'Adicionada ao seu jardim.', 'success');
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex flex-col gap-2.5 rounded-lg border border-ink-200 bg-white p-4 sm:flex-row lg:flex-col">
        <Button
          variant={inGarden ? 'secondary' : 'primary'}
          iconLeft={inGarden ? 'check' : 'plus'}
          fullWidth
          onClick={() => {
            if (requireAccount()) return;
            setDialogOpen(true);
          }}
        >
          {inGarden ? 'Adicionar outra ao jardim' : 'Adicionar ao Meu Jardim'}
        </Button>

        <Button
          variant="outline"
          iconLeft="bookmark"
          fullWidth
          onClick={handleSave}
          aria-pressed={saved}
          disabled={pending}
        >
          {saved ? 'Salva' : 'Salvar'}
        </Button>
      </div>

      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Adicionar ao Meu Jardim"
        description={`Dê um nome para a sua ${plantName.toLowerCase()}. Você poderá registrar regas, podas e fotos no Diário Verde.`}
        size="sm"
        footer={
          <div className="flex gap-2.5">
            <Button variant="outline" fullWidth onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button fullWidth loading={pending} onClick={handleAddToGarden}>
              Adicionar
            </Button>
          </div>
        }
      >
        <Field
          id="apelido"
          label="Nome ou apelido"
          hint="Pode ser o nome da espécie ou o apelido que você já usa."
        >
          {(props) => (
            <Input
              {...props}
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              maxLength={60}
              autoFocus
            />
          )}
        </Field>
      </Modal>
    </>
  );
}
