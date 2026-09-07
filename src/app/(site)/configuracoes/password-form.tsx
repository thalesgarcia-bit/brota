'use client';

import { useActionState, useEffect } from 'react';

import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import { Alert } from '@/components/ui/feedback';
import { useToast } from '@/components/ui/toast';
import { INITIAL_FORM_STATE } from '@/server/actions/form-state';
import { changePasswordAction } from '@/server/actions/account-deletion';

export function PasswordForm() {
  const { notify } = useToast();
  const [state, action] = useActionState(changePasswordAction, INITIAL_FORM_STATE);

  useEffect(() => {
    if (state.status === 'success') {
      notify(state.message ?? 'Senha alterada.', 'success');
    }
  }, [state, notify]);

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.status === 'error' && !state.fieldErrors ? (
        <Alert tone="danger">{state.message}</Alert>
      ) : null}

      <Field
        id="currentPassword"
        label="Senha atual"
        required
        error={state.fieldErrors?.['currentPassword']}
      >
        {(props) => (
          <Input
            {...props}
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
          />
        )}
      </Field>

      <Field
        id="newPassword"
        label="Nova senha"
        hint="Ao menos 8 caracteres, com letras e números."
        required
        error={state.fieldErrors?.['password']}
      >
        {(props) => (
          <Input
            {...props}
            name="password"
            type="password"
            autoComplete="new-password"
            required
          />
        )}
      </Field>

      <Field
        id="newPasswordConfirmation"
        label="Confirme a nova senha"
        required
        error={state.fieldErrors?.['passwordConfirmation']}
      >
        {(props) => (
          <Input
            {...props}
            name="passwordConfirmation"
            type="password"
            autoComplete="new-password"
            required
          />
        )}
      </Field>

      <SubmitButton>Alterar senha</SubmitButton>
    </form>
  );
}
