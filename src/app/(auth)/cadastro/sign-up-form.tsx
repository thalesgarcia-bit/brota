'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';

import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/choice';
import { SubmitButton } from '@/components/ui/submit-button';
import { Alert } from '@/components/ui/feedback';
import { IconButton } from '@/components/ui/button';
import { signUpAction } from '@/server/actions/account';
import { INITIAL_FORM_STATE } from '@/server/actions/form-state';

export function SignUpForm() {
  const [state, action] = useActionState(signUpAction, INITIAL_FORM_STATE);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="mt-6 space-y-4" noValidate>
      {state.status === 'error' && !state.fieldErrors ? (
        <Alert tone="danger">{state.message}</Alert>
      ) : null}

      <Field
        id="displayName"
        label="Como quer ser chamado"
        required
        error={state.fieldErrors?.['displayName']}
      >
        {(props) => (
          <Input
            {...props}
            name="displayName"
            autoComplete="name"
            placeholder="Seu nome"
            required
          />
        )}
      </Field>

      <Field
        id="username"
        label="Nome de usuário"
        hint="É como as pessoas vão te encontrar: brota.app/perfil/seu-nome"
        required
        error={state.fieldErrors?.['username']}
      >
        {(props) => (
          <Input
            {...props}
            name="username"
            autoComplete="username"
            placeholder="seunome"
            pattern="[a-z0-9_.]+"
            required
          />
        )}
      </Field>

      <Field
        id="email"
        label="E-mail"
        hint="Seu e-mail nunca aparece no seu perfil público."
        required
        error={state.fieldErrors?.['email']}
      >
        {(props) => (
          <Input
            {...props}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="voce@exemplo.com"
            required
          />
        )}
      </Field>

      <Field
        id="password"
        label="Senha"
        hint="Ao menos 8 caracteres, com letras e números."
        required
        error={state.fieldErrors?.['password']}
      >
        {(props) => (
          <div className="relative">
            <Input
              {...props}
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className="pr-12"
              required
            />
            <IconButton
              icon={showPassword ? 'eyeOff' : 'eye'}
              label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              size="sm"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute top-1/2 right-1 -translate-y-1/2"
            />
          </div>
        )}
      </Field>

      <Field
        id="passwordConfirmation"
        label="Confirme a senha"
        required
        error={state.fieldErrors?.['passwordConfirmation']}
      >
        {(props) => (
          <Input
            {...props}
            name="passwordConfirmation"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
          />
        )}
      </Field>

      <div>
        <Checkbox
          id="acceptedTerms"
          name="acceptedTerms"
          label={
            <>
              Li e aceito os{' '}
              <Link href="/termos" className="text-brand-700 underline">
                termos de uso
              </Link>{' '}
              e a{' '}
              <Link href="/privacidade" className="text-brand-700 underline">
                política de privacidade
              </Link>
              .
            </>
          }
          required
        />
        {state.fieldErrors?.['acceptedTerms'] ? (
          <p className="mt-1 text-xs text-danger-700" role="alert">
            {state.fieldErrors['acceptedTerms']}
          </p>
        ) : null}
      </div>

      <SubmitButton fullWidth size="lg">
        Criar minha conta
      </SubmitButton>
    </form>
  );
}
