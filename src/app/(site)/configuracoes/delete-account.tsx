'use client';

import { useActionState, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { SubmitButton } from '@/components/ui/submit-button';
import { Alert } from '@/components/ui/feedback';
import { INITIAL_FORM_STATE } from '@/server/actions/account';
import { deleteAccountAction } from '@/server/actions/account-deletion';

/** Exclusão de conta — direito garantido pela LGPD, com confirmação dupla. */
export function DeleteAccountSection() {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(deleteAccountAction, INITIAL_FORM_STATE);

  return (
    <>
      <Card className="border-danger-500/25">
        <h2 className="text-lg text-danger-700">Excluir conta</h2>
        <p className="mt-1 text-sm leading-relaxed text-ink-600">
          Apaga o seu perfil, as suas publicações, comentários, plantas do jardim
          e registros do diário. Esta ação não pode ser desfeita.
        </p>
        <div className="mt-4">
          <Button variant="danger" iconLeft="trash" onClick={() => setOpen(true)}>
            Excluir minha conta
          </Button>
        </div>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Excluir conta definitivamente"
        description="Tudo o que você criou no BROTA será apagado. Não há como recuperar depois."
        size="sm"
      >
        <form action={action} className="space-y-4" noValidate>
          {state.status === 'error' && !state.fieldErrors ? (
            <Alert tone="danger">{state.message}</Alert>
          ) : null}

          <Alert tone="danger">
            Serão apagados: perfil, publicações, comentários, curtidas, plantas do
            jardim, registros do diário, identificações e recomendações.
          </Alert>

          <Field
            id="confirmation"
            label="Digite EXCLUIR para confirmar"
            required
            error={state.fieldErrors?.['confirmation']}
          >
            {(props) => (
              <Input
                {...props}
                name="confirmation"
                autoComplete="off"
                placeholder="EXCLUIR"
                required
              />
            )}
          </Field>

          <Field
            id="deletePassword"
            label="Sua senha"
            required
            error={state.fieldErrors?.['password']}
          >
            {(props) => (
              <Input
                {...props}
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            )}
          </Field>

          <div className="flex gap-2.5 pt-1">
            <Button variant="outline" fullWidth onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <SubmitButton variant="danger" fullWidth>
              Excluir para sempre
            </SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
