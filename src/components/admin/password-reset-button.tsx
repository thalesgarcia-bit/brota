'use client';

import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Alert } from '@/components/ui/feedback';
import { Icon } from '@/components/ui/icon';
import { useToast } from '@/components/ui/toast';
import { resetUserPasswordAction } from '@/server/actions/admin';

/**
 * Redefinição de senha pelo professor.
 *
 * Existe porque o BROTA ainda não envia e-mail: sem isto, um aluno que
 * esquecesse a senha ficaria sem acesso à própria conta. A senha temporária
 * aparece uma vez só — depois disso, nem a equipe consegue vê-la de novo.
 */
export function PasswordResetButton({
  userId,
  userName,
  disabled,
}: {
  userId: string;
  userName: string;
  disabled?: boolean;
}) {
  const { notify } = useToast();
  const [open, setOpen] = useState(false);
  const [temporary, setTemporary] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    startTransition(async () => {
      const result = await resetUserPasswordAction(userId);

      if (!result.ok || !result.temporaryPassword) {
        notify(result.message, 'error');
        setOpen(false);
        return;
      }

      setTemporary(result.temporaryPassword);
    });
  }

  function close() {
    setOpen(false);
    setTemporary(null);
  }

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        iconLeft="lock"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        Redefinir senha
      </Button>

      <Modal
        open={open}
        onClose={close}
        title={temporary ? 'Senha temporária gerada' : 'Redefinir a senha'}
        description={
          temporary
            ? undefined
            : `Isso cria uma senha temporária para ${userName}. A senha atual deixa de funcionar imediatamente.`
        }
        size="sm"
        footer={
          temporary ? (
            <Button fullWidth onClick={close}>
              Já anotei
            </Button>
          ) : (
            <div className="flex gap-2.5">
              <Button variant="outline" fullWidth onClick={close}>
                Cancelar
              </Button>
              <Button fullWidth loading={pending} onClick={reset}>
                Gerar senha temporária
              </Button>
            </div>
          )
        }
      >
        {temporary ? (
          <div>
            <p className="text-sm text-ink-700">
              Entregue esta senha para <strong>{userName}</strong> e peça que
              troque em Configurações assim que entrar.
            </p>

            <p className="mt-4 rounded-lg border border-brand-300 bg-brand-50 px-4 py-4 text-center font-mono text-xl font-semibold tracking-wide text-brand-900 select-all">
              {temporary}
            </p>

            <Alert tone="attention" className="mt-4">
              Esta senha não aparece de novo. No banco fica apenas o hash — nem a
              equipe consegue recuperá-la depois.
            </Alert>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="flex gap-2.5 text-sm text-ink-700">
              <Icon name="info" size={17} className="mt-0.5 shrink-0 text-info-500" />
              Use quando alguém esquecer a senha. Como o envio de e-mail ainda não
              está configurado, esta é a forma de devolver o acesso.
            </p>
            <p className="flex gap-2.5 text-sm text-ink-700">
              <Icon name="shield" size={17} className="mt-0.5 shrink-0 text-ink-400" />
              A ação fica registrada nos logs com o seu nome, e a pessoa recebe
              uma notificação avisando da troca.
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}
