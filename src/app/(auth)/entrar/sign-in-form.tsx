'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';

import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import { Alert } from '@/components/ui/feedback';
import { IconButton } from '@/components/ui/button';
import {
  INITIAL_FORM_STATE,
  signInAction,
} from '@/server/actions/account';

export function SignInForm({ next }: { next: string | null }) {
  const [state, action] = useActionState(signInAction, INITIAL_FORM_STATE);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="mt-6 space-y-4" noValidate>
      {next ? <input type="hidden" name="proximo" value={next} /> : null}

      {state.status === 'error' && !state.fieldErrors ? (
        <Alert tone="danger">{state.message}</Alert>
      ) : null}

      <Field
        id="email"
        label="E-mail"
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
        required
        error={state.fieldErrors?.['password']}
      >
        {(props) => (
          <div className="relative">
            <Input
              {...props}
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Sua senha"
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

      <div className="flex justify-end">
        <Link
          href="/recuperar-senha"
          className="text-sm text-brand-700 underline-offset-2 hover:underline"
        >
          Esqueci minha senha
        </Link>
      </div>

      <SubmitButton fullWidth size="lg">
        Entrar
      </SubmitButton>
    </form>
  );
}
