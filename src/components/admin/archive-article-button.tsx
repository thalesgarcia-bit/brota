'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { archiveArticleAction } from '@/server/actions/content';

/**
 * Arquiva ou devolve um conteúdo para rascunho.
 *
 * Não existe botão de apagar: um texto escrito pela turma sai do ar, mas
 * continua no painel. Quem quiser retomá-lo daqui a um semestre, consegue.
 */
export function ArchiveArticleButton({
  articleId,
  archived,
}: {
  articleId: string;
  archived: boolean;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [pending, startTransition] = useTransition();

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

  return (
    <Button
      size="sm"
      variant="ghost"
      loading={pending}
      iconLeft={archived ? 'refresh' : 'trash'}
      onClick={alternar}
    >
      {archived ? 'Retomar' : 'Arquivar'}
    </Button>
  );
}
