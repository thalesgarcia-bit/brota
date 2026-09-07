'use server';

import { redirect } from 'next/navigation';

/* ===========================================================================
 * PÁGINA TEMPORÁRIA DE TESTE — REMOVER DEPOIS
 *
 * Duas ações mínimas, sem banco, sem autenticação, sem nenhuma dependência do
 * BROTA. Servem para separar duas perguntas que hoje estão embaralhadas:
 *
 *   • Ações de servidor funcionam neste ambiente?
 *   • Ou só quebram quando carregam estado anterior (useActionState)?
 *
 * O primeiro formulário usa a forma direta; o segundo, a forma com estado —
 * que é a usada em todos os formulários reais do BROTA.
 * =========================================================================== */

export async function acaoSimples(formData: FormData): Promise<void> {
  const nome = String(formData.get('nome') ?? '');
  console.error('[teste] acaoSimples executou com:', nome);
  redirect(`/teste-acao?simples=${encodeURIComponent(nome || 'vazio')}`);
}

export async function acaoComEstado(
  _anterior: string,
  formData: FormData,
): Promise<string> {
  const nome = String(formData.get('nome') ?? '');
  console.error('[teste] acaoComEstado executou com:', nome);
  return `A ação com estado funcionou. Recebi: ${nome || '(vazio)'}`;
}
