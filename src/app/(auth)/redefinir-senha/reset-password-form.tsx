'use client';

import { useActionState } from 'react';

import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import { Alert } from '@/components/ui/feedback';
import { INITIAL_FORM_STATE } from '@/server/actions/form-state';
import { resetPasswordAction } from '@/server/actions/password';

export function ResetPasswordForm({
  token,
  email,
}: {
  token: string;
  email: string;
}) {
  const [state, action] = useActionState(resetPasswordAction, INITIAL_FORM_STATE);

  return (
    <form action={action} className="mt-6 space-y-4" noValidate>
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="email" value={email} />

      {state.status === 'error' && !state.fieldErrors ? (
        <Alert tone="danger">{state.message}</Alert>
      ) : null}

      <Field
        id="password"
        label="Nova senha"
        required
        error={state.fieldErrors?.['password']}
      >
        {(props) => (
          <Input {...props} name="password" type="password" autoComplete="new-password" required />
        )}
      </Field>

      <Field
        id="passwordConfirmation"
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

      <SubmitButton fullWidth size="lg">
        Salvar nova senha
      </SubmitButton>
    </form>
  );
}
