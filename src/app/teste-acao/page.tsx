import { acaoSimples } from './acoes';
import { FormularioComEstado } from './formulario-com-estado';

export const dynamic = 'force-dynamic';

export const metadata = { robots: { index: false, follow: false } };

/** PÁGINA TEMPORÁRIA DE TESTE — REMOVER DEPOIS. */
export default async function TesteAcaoPage({
  searchParams,
}: {
  searchParams: Promise<{ simples?: string }>;
}) {
  const { simples } = await searchParams;

  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-semibold">Teste de formulários</h1>
      <p className="mt-2 text-sm text-ink-600">
        Página temporária. Cada botão envia um formulário sem banco de dados e
        sem autenticação. O que funcionar aqui diz onde está o problema.
      </p>

      <section className="mt-8 rounded-lg border border-ink-200 p-4">
        <h2 className="font-medium">1. Envio direto</h2>
        <form action={acaoSimples} className="mt-3 flex flex-wrap gap-2">
          <input
            name="nome"
            defaultValue="teste"
            className="h-11 rounded-md border border-ink-200 px-3 text-sm"
          />
          <button
            type="submit"
            className="h-11 rounded-md bg-brand-600 px-4 text-sm font-medium text-white"
          >
            Enviar (direto)
          </button>
        </form>
        {simples ? (
          <p className="mt-3 text-sm text-brand-800">
            A ação direta funcionou. Recebi: {simples}
          </p>
        ) : null}
      </section>

      <section className="mt-4 rounded-lg border border-ink-200 p-4">
        <h2 className="font-medium">2. Envio com estado</h2>
        <p className="mt-1 text-sm text-ink-600">
          É esta a forma usada no login, no cadastro e em todos os formulários
          do BROTA.
        </p>
        <FormularioComEstado />
      </section>
    </main>
  );
}
