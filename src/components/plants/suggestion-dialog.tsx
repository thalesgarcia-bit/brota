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
import { SUGGESTABLE_FIELDS } from '@/lib/validation/community';
import { INITIAL_FORM_STATE } from '@/server/actions/form-state';
import { createSuggestionAction } from '@/server/actions/plants';

/**
 * Fluxo colaborativo: sugestão → revisão → aprovação → publicação.
 * Ninguém edita a base oficial diretamente.
 */
export function SuggestionDialog({
  plantId,
  plantName,
  isAuthenticated,
}: {
  plantId: string;
  plantName: string;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(createSuggestionAction, INITIAL_FORM_STATE);

  useEffect(() => {
    if (state.status === 'success') {
      notify(state.message ?? 'Sugestão enviada.', 'success');
      setOpen(false);
    }
  }, [state, notify]);

  return (
    <>
      <Button
        variant="ghost"
        iconLeft="edit"
        size="sm"
        onClick={() => {
          if (!isAuthenticated) {
            router.push(
              `/entrar?proximo=${encodeURIComponent(window.location.pathname)}`,
            );
            return;
          }
          setOpen(true);
        }}
      >
        Sugerir uma correção ou acréscimo
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Sugerir mudança"
        description={`Sua sugestão para ${plantName} será revisada pela equipe antes de entrar na base.`}
      >
        <form action={action} className="space-y-4" id="form-sugestao">
          <input type="hidden" name="plantId" value={plantId} />

          {state.status === 'error' && !state.fieldErrors ? (
            <Alert tone="danger">{state.message}</Alert>
          ) : null}

          <Field
            id="field"
            label="O que você quer corrigir ou acrescentar?"
            required
            error={state.fieldErrors?.['field']}
          >
            {(props) => (
              <Select {...props} name="field" required defaultValue="">
                <option value="" disabled>
                  Escolha uma opção
                </option>
                {SUGGESTABLE_FIELDS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field
            id="suggestedValue"
            label="Sua sugestão"
            required
            error={state.fieldErrors?.['suggestedValue']}
          >
            {(props) => (
              <Textarea
                {...props}
                name="suggestedValue"
                rows={5}
                maxLength={3000}
                placeholder="Escreva o texto como ele deveria aparecer na página."
                required
              />
            )}
          </Field>

          <Field
            id="sourceUrl"
            label="Fonte (opcional)"
            hint="Um link para artigo, livro digital ou base botânica reforça muito a sua sugestão."
            error={state.fieldErrors?.['sourceUrl']}
          >
            {(props) => (
              <Input
                {...props}
                name="sourceUrl"
                type="url"
                inputMode="url"
                placeholder="https://"
              />
            )}
          </Field>

          <Field
            id="justification"
            label="Comentário para a equipe (opcional)"
            error={state.fieldErrors?.['justification']}
          >
            {(props) => (
              <Textarea
                {...props}
                name="justification"
                rows={3}
                maxLength={1000}
                placeholder="Por que essa mudança faz sentido?"
              />
            )}
          </Field>

          <div className="flex gap-2.5 pt-1">
            <Button variant="outline" fullWidth onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <SubmitButton fullWidth>Enviar sugestão</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
