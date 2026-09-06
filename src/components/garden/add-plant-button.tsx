'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Field } from '@/components/ui/field';
import { Input, Select, Textarea } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import { Alert } from '@/components/ui/feedback';
import { useToast } from '@/components/ui/toast';
import { LIGHT } from '@/lib/labels';
import { INITIAL_FORM_STATE } from '@/server/actions/account';
import { createUserPlantAction } from '@/server/actions/garden';
import { SpeciesPicker } from './species-picker';

/** Cadastro de uma planta no Meu Jardim. */
export function AddPlantButton({ label = 'Adicionar planta' }: { label?: string }) {
  const router = useRouter();
  const { notify } = useToast();
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(createUserPlantAction, INITIAL_FORM_STATE);

  useEffect(() => {
    if (state.status === 'success') {
      notify(state.message ?? 'Planta adicionada.', 'success');
      setOpen(false);
      router.refresh();
    }
  }, [state, notify, router]);

  return (
    <>
      <Button iconLeft="plus" onClick={() => setOpen(true)}>
        {label}
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Adicionar planta ao jardim"
        description="Só o nome é obrigatório. O resto você completa quando quiser."
      >
        <form action={action} className="space-y-4">
          {state.status === 'error' && !state.fieldErrors ? (
            <Alert tone="danger">{state.message}</Alert>
          ) : null}

          <Field
            id="nickname"
            label="Nome ou apelido"
            hint="Como você chama essa planta."
            required
            error={state.fieldErrors?.['nickname']}
          >
            {(props) => (
              <Input {...props} name="nickname" maxLength={60} required autoFocus />
            )}
          </Field>

          <SpeciesPicker error={state.fieldErrors?.['plantId']} />

          <Field id="location" label="Onde ela fica? (opcional)">
            {(props) => (
              <Input
                {...props}
                name="location"
                maxLength={80}
                placeholder="Ex.: janela da cozinha"
              />
            )}
          </Field>

          <Field id="lightExposure" label="Luz nesse lugar (opcional)">
            {(props) => (
              <Select {...props} name="lightExposure" defaultValue="">
                <option value="">Não sei dizer</option>
                {Object.entries(LIGHT).map(([value, info]) => (
                  <option key={value} value={value}>
                    {info.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field
            id="acquiredAt"
            label="Desde quando você tem? (opcional)"
            hint="Ajuda a acompanhar o crescimento ao longo do tempo."
          >
            {(props) => <Input {...props} name="acquiredAt" type="date" />}
          </Field>

          <Field id="notes" label="Observações (opcional)">
            {(props) => (
              <Textarea
                {...props}
                name="notes"
                rows={3}
                maxLength={2000}
                placeholder="De onde veio, o que já aconteceu com ela..."
              />
            )}
          </Field>

          <div className="flex gap-2.5 pt-1">
            <Button variant="outline" fullWidth onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <SubmitButton fullWidth>Adicionar</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
