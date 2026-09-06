'use client';

import { useActionState, useEffect } from 'react';

import { Field } from '@/components/ui/field';
import { Input, Select, Textarea } from '@/components/ui/input';
import { Switch } from '@/components/ui/choice';
import { SubmitButton } from '@/components/ui/submit-button';
import { Alert } from '@/components/ui/feedback';
import { useToast } from '@/components/ui/toast';
import { EXPERIENCE } from '@/lib/labels';
import { INITIAL_FORM_STATE, updateProfileAction } from '@/server/actions/account';

type Initial = {
  displayName: string;
  username: string;
  bio: string | null;
  city: string | null;
  state: string | null;
  showLocation: boolean;
  isPublic: boolean;
  experienceLevel: keyof typeof EXPERIENCE;
  avatarUrl: string | null;
};

export function ProfileForm({ initial }: { initial: Initial }) {
  const { notify } = useToast();
  const [state, action] = useActionState(updateProfileAction, INITIAL_FORM_STATE);

  useEffect(() => {
    if (state.status === 'success') {
      notify(state.message ?? 'Perfil atualizado.', 'success');
    }
  }, [state, notify]);

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="avatarUrl" value={initial.avatarUrl ?? ''} />

      {state.status === 'error' && !state.fieldErrors ? (
        <Alert tone="danger">{state.message}</Alert>
      ) : null}

      <Field
        id="displayName"
        label="Nome de exibição"
        required
        error={state.fieldErrors?.['displayName']}
      >
        {(props) => (
          <Input
            {...props}
            name="displayName"
            defaultValue={initial.displayName}
            maxLength={60}
            required
          />
        )}
      </Field>

      <Field
        id="username"
        label="Nome de usuário"
        hint="Aparece no endereço do seu perfil."
        required
        error={state.fieldErrors?.['username']}
      >
        {(props) => (
          <Input
            {...props}
            name="username"
            defaultValue={initial.username}
            maxLength={24}
            required
          />
        )}
      </Field>

      <Field id="bio" label="Bio" error={state.fieldErrors?.['bio']}>
        {(props) => (
          <Textarea
            {...props}
            name="bio"
            rows={3}
            maxLength={280}
            defaultValue={initial.bio ?? ''}
            placeholder="Conte um pouco sobre você e suas plantas."
          />
        )}
      </Field>

      <Field id="experienceLevel" label="Nível de experiência">
        {(props) => (
          <Select
            {...props}
            name="experienceLevel"
            defaultValue={initial.experienceLevel}
          >
            {Object.entries(EXPERIENCE).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <fieldset>
        <legend className="text-sm font-medium text-ink-800">Localização</legend>
        <p className="mt-0.5 text-xs text-ink-500">
          Apenas cidade e estado. O BROTA nunca guarda a sua posição exata.
        </p>
        <div className="mt-3 flex gap-2.5">
          <div className="flex-1">
            <label htmlFor="city" className="sr-only">
              Cidade
            </label>
            <Input
              id="city"
              name="city"
              defaultValue={initial.city ?? ''}
              maxLength={80}
              placeholder="Cidade"
            />
          </div>
          <div className="w-20">
            <label htmlFor="state" className="sr-only">
              Estado
            </label>
            <Input
              id="state"
              name="state"
              defaultValue={initial.state ?? ''}
              maxLength={2}
              placeholder="UF"
            />
          </div>
        </div>
      </fieldset>

      <div className="space-y-3 rounded-lg border border-ink-200 p-4">
        <Switch
          id="showLocation"
          name="showLocation"
          label="Exibir minha cidade no perfil"
          description="Desmarcado, a cidade fica guardada mas não aparece para ninguém."
          defaultChecked={initial.showLocation}
        />
        <Switch
          id="isPublic"
          name="isPublic"
          label="Perfil público"
          description="Desmarcado, só você vê o seu perfil."
          defaultChecked={initial.isPublic}
        />
      </div>

      <SubmitButton>Salvar alterações</SubmitButton>
    </form>
  );
}
