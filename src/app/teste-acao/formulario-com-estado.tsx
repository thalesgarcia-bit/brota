'use client';

import { useActionState } from 'react';

import { acaoComEstado } from './acoes';

/** Mesma mecânica dos formulários reais do BROTA: ação com estado anterior. */
export function FormularioComEstado() {
  const [estado, acao, pendente] = useActionState(acaoComEstado, '');

  return (
    <form action={acao} className="mt-3 flex flex-wrap items-center gap-2">
      <input
        name="nome"
        defaultValue="teste"
        className="h-11 rounded-md border border-ink-200 px-3 text-sm"
      />
      <button
        type="submit"
        disabled={pendente}
        className="h-11 rounded-md bg-brand-600 px-4 text-sm font-medium text-white"
      >
        Enviar (com estado)
      </button>
      {estado ? (
        <p className="w-full text-sm text-brand-800">{estado}</p>
      ) : null}
    </form>
  );
}
