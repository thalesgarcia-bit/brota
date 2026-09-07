'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import {
  archiveArticleAction,
  deleteArticleAction,
} from '@/server/actions/content';

/**
 * Arquivar, retomar e apagar um conteúdo educativo.
 *
 * São dois passos de propósito. Arquivar tira do ar e tem volta; apagar só
 * aparece depois disso, e ainda pede confirmação. Quem escreveu o texto foi uma
 * turma — o caminho para destruir esse trabalho não deveria ser um clique.
 */
export function ArticleActions({
  articleId,
  title,
  archived,
}: {
  articleId: string;
  title: string;
  archived: boolean;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [pending, startTransition] = useTransition();
  const [confirmando, setConfirmando] = useState(false);

  function alternar() {
    startTransition(async () => {
      const result = await archiveArticleAction(articleId);
      notify(
        result.message ?? (result.ok ? 'Pronto.' : 'Não foi possível agora.'),
        result.ok ? 'success' : 'error',
      );
      if (result.ok) router.refresh();
    });
  }

  function apagar() {
    startTransition(async () => {
      const result = await deleteArticleAction(articleId);
      notify(
        result.message ?? (result.ok ? 'Apagado.' : 'Não foi possível agora.'),
        result.ok ? 'success' : 'error',
      );
      setConfirmando(false);
      if (result.ok) router.refresh();
    });
  }

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        loading={pending}
        iconLeft={archived ? 'refresh' : 'eyeOff'}
        onClick={alternar}
      >
        {archived ? 'Retomar' : 'Arquivar'}
      </Button>

      {archived ? (
        <Button
          size="sm"
          variant="ghost"
          iconLeft="trash"
          className="text-danger-700 hover:bg-danger-50"
          onClick={() => setConfirmando(true)}
        >
          Apagar
        </Button>
      ) : null}

      <Modal
        open={confirmando}
        onClose={() => setConfirmando(false)}
        title="Apagar este conteúdo?"
        description={`"${title}" sai do BROTA para sempre, junto com os salvamentos de quem o guardou. Não dá para desfazer.`}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmando(false)}>
              Cancelar
            </Button>
            <Button variant="danger" loading={pending} onClick={apagar}>
              Apagar de vez
            </Button>
          </>
        }
      />
    </>
  );
}
