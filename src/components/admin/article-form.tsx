'use client';

import { useActionState, useEffect, useRef, useState } from 'react';

import { Field } from '@/components/ui/field';
import { Input, Select, Textarea } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import { Alert } from '@/components/ui/feedback';
import { Icon, type IconName } from '@/components/ui/icon';
import { cn } from '@/lib/utils/cn';
import { Markdown } from '@/components/ui/markdown';
import { saveArticleAction } from '@/server/actions/content';
import { INITIAL_FORM_STATE } from '@/server/actions/form-state';

export type ArticleFormInitial = {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  coverUrl: string;
  readingMinutes: string;
  status: string;
};

/** Sugestão de leitura: cerca de 200 palavras por minuto, arredondando acima. */
function estimarMinutos(texto: string): number {
  const palavras = texto.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(palavras / 200));
}

/**
 * Botões de formatação.
 *
 * Cada um corresponde a uma marca que o renderizador do BROTA entende. Os
 * estudantes clicam; a marca é escrita por baixo. Quem preferir digitar
 * continua podendo — é o mesmo texto.
 *
 * `linha` marca o começo de cada linha selecionada (subtítulo, lista, citação);
 * `volta` envolve o trecho escolhido dos dois lados (negrito, link).
 */
type Ferramenta = {
  chave: string;
  rotulo: string;
  icone: IconName;
  linha?: string;
  volta?: [string, string];
  exemplo: string;
};

const FERRAMENTAS: Ferramenta[] = [
  { chave: 'titulo', rotulo: 'Subtítulo', icone: 'note', linha: '## ', exemplo: 'Subtítulo' },
  { chave: 'negrito', rotulo: 'Negrito', icone: 'edit', volta: ['**', '**'], exemplo: 'texto em destaque' },
  { chave: 'lista', rotulo: 'Lista', icone: 'list', linha: '- ', exemplo: 'primeiro item' },
  { chave: 'numerada', rotulo: 'Lista numerada', icone: 'chart', linha: '1. ', exemplo: 'primeiro passo' },
  { chave: 'citacao', rotulo: 'Citação', icone: 'message', linha: '> ', exemplo: 'trecho citado' },
  { chave: 'link', rotulo: 'Link', icone: 'externalLink', volta: ['[', '](https://)'], exemplo: 'texto do link' },
];

/** Aplica uma ferramenta ao trecho selecionado e devolve o texto e onde deixar o cursor. */
function aplicar(
  texto: string,
  inicio: number,
  fim: number,
  ferramenta: Ferramenta,
): { texto: string; de: number; ate: number } {
  const selecionado = texto.slice(inicio, fim) || ferramenta.exemplo;

  if (ferramenta.volta) {
    const [abre, fecha] = ferramenta.volta;
    return {
      texto: texto.slice(0, inicio) + abre + selecionado + fecha + texto.slice(fim),
      de: inicio + abre.length,
      ate: inicio + abre.length + selecionado.length,
    };
  }

  const marca = ferramenta.linha ?? '';

  // A marca pertence à linha inteira, então a seleção é esticada até o começo
  // dela — senão o "##" nasceria no meio de uma frase.
  const comecoDaLinha = texto.lastIndexOf('\n', inicio - 1) + 1;
  const bloco = texto.slice(comecoDaLinha, fim) || ferramenta.exemplo;
  const marcado = bloco
    .split('\n')
    .map((linha) => (linha.startsWith(marca) ? linha : marca + linha))
    .join('\n');

  return {
    texto: texto.slice(0, comecoDaLinha) + marcado + texto.slice(fim),
    de: comecoDaLinha + marca.length,
    ate: comecoDaLinha + marcado.length,
  };
}

export function ArticleForm({
  initial,
  categories,
}: {
  initial: ArticleFormInitial;
  /** Categorias já usadas, oferecidas como atalho — não como camisa de força. */
  categories: string[];
}) {
  const [state, action] = useActionState(saveArticleAction, INITIAL_FORM_STATE);
  const [body, setBody] = useState(initial.body);
  const [minutos, setMinutos] = useState(initial.readingMinutes);
  const [visualizando, setVisualizando] = useState(false);

  const areaRef = useRef<HTMLTextAreaElement>(null);
  const selecao = useRef<{ de: number; ate: number } | null>(null);

  // Depois de formatar, o cursor volta para dentro do trecho — a pessoa
  // continua digitando de onde estava, sem ter que clicar de novo.
  useEffect(() => {
    const alvo = selecao.current;
    const area = areaRef.current;
    if (!alvo || !area) return;
    selecao.current = null;
    area.focus();
    area.setSelectionRange(alvo.de, alvo.ate);
  }, [body]);

  function formatar(ferramenta: Ferramenta) {
    const area = areaRef.current;
    if (!area) return;
    const resultado = aplicar(body, area.selectionStart, area.selectionEnd, ferramenta);
    selecao.current = { de: resultado.de, ate: resultado.ate };
    setBody(resultado.texto);
  }

  const erros = state.fieldErrors ?? {};
  const sugestao = estimarMinutos(body);

  return (
    <form action={action} className="space-y-6">
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      {state.status === 'error' && !state.fieldErrors ? (
        <Alert tone="danger">{state.message}</Alert>
      ) : null}

      <section className="space-y-4 rounded-xl border border-ink-200 bg-white p-5">
        <h2 className="text-lg">O conteúdo</h2>

        <Field id="title" label="Título" required error={erros['title']}>
          {(props) => (
            <Input
              {...props}
              name="title"
              defaultValue={initial.title}
              maxLength={140}
              placeholder="Como regar sem afogar a planta"
              required
            />
          )}
        </Field>

        <Field
          id="excerpt"
          label="Resumo"
          required
          error={erros['excerpt']}
          hint="Uma ou duas frases. É o que aparece na lista de conteúdos e nos resultados de busca."
        >
          {(props) => (
            <Textarea
              {...props}
              name="excerpt"
              rows={2}
              maxLength={400}
              defaultValue={initial.excerpt}
              required
            />
          )}
        </Field>

        <Field
          id="body"
          label="Texto"
          required
          error={erros['body']}
          hint="Selecione um trecho e use os botões para formatar. Antes de publicar, confira em Visualizar."
        >
          {(props) => (
            <>
              <div className="flex flex-wrap items-center gap-1 rounded-t-md border border-b-0 border-ink-200 bg-ink-25 p-1.5">
                {FERRAMENTAS.map((ferramenta) => (
                  <button
                    key={ferramenta.chave}
                    type="button"
                    title={ferramenta.rotulo}
                    aria-label={ferramenta.rotulo}
                    disabled={visualizando}
                    onClick={() => formatar(ferramenta)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-ink-700 hover:bg-white hover:text-brand-700 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                  >
                    <Icon name={ferramenta.icone} size={15} />
                    <span className="hidden sm:inline">{ferramenta.rotulo}</span>
                  </button>
                ))}

                <div className="ml-auto flex rounded-md bg-ink-100 p-0.5">
                  {[
                    { chave: 'escrever', rotulo: 'Escrever', ativo: !visualizando },
                    { chave: 'visualizar', rotulo: 'Visualizar', ativo: visualizando },
                  ].map((aba) => (
                    <button
                      key={aba.chave}
                      type="button"
                      aria-pressed={aba.ativo}
                      onClick={() => setVisualizando(aba.chave === 'visualizar')}
                      className={cn(
                        'rounded px-3 py-1.5 text-xs font-medium transition-colors',
                        aba.ativo
                          ? 'bg-white text-ink-900 shadow-xs'
                          : 'text-ink-600 hover:text-ink-900',
                      )}
                    >
                      {aba.rotulo}
                    </button>
                  ))}
                </div>
              </div>

              {/* O texto continua existindo no formulário mesmo em pré-visualização:
                  trocar de aba não pode significar perder o que foi escrito. */}
              <Textarea
                {...props}
                ref={areaRef}
                name="body"
                rows={18}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Comece a escrever. Use os botões acima para dar forma ao texto."
                required
                className={cn(
                  'rounded-t-none font-mono text-sm',
                  visualizando && 'sr-only',
                )}
              />

              {visualizando ? (
                <div className="min-h-64 rounded-b-md border border-ink-200 bg-white px-4 py-4">
                  {body.trim() ? (
                    <Markdown content={body} />
                  ) : (
                    <p className="text-sm text-ink-500">
                      Nada escrito ainda. Volte para Escrever e comece o texto.
                    </p>
                  )}
                </div>
              ) : null}
            </>
          )}
        </Field>

        <p className="flex items-center gap-2 text-sm text-ink-500">
          <Icon name="info" size={15} className="shrink-0 text-info-500" />
          {body.trim() ? (
            <>
              {body.trim().split(/\s+/).filter(Boolean).length} palavras — cerca de{' '}
              {sugestao} {sugestao === 1 ? 'minuto' : 'minutos'} de leitura.
            </>
          ) : (
            'O texto ainda está vazio.'
          )}
        </p>
      </section>

      <section className="space-y-4 rounded-xl border border-ink-200 bg-white p-5">
        <h2 className="text-lg">Organização</h2>

        <Field
          id="category"
          label="Categoria"
          required
          error={erros['category']}
          hint="Escolha uma das existentes ou escreva uma nova."
        >
          {(props) => (
            <>
              <Input
                {...props}
                name="category"
                list="categorias-de-conteudo"
                defaultValue={initial.category}
                maxLength={60}
                placeholder="Cuidados básicos"
                required
              />
              <datalist id="categorias-de-conteudo">
                {categories.map((categoria) => (
                  <option key={categoria} value={categoria} />
                ))}
              </datalist>
            </>
          )}
        </Field>

        <Field
          id="slug"
          label="Endereço"
          error={erros['slug']}
          hint="A parte final do link. Em branco, é gerado a partir do título. Depois de publicado, mudar quebra links antigos."
        >
          {(props) => (
            <Input
              {...props}
              name="slug"
              defaultValue={initial.slug}
              maxLength={80}
              placeholder="como-regar-sem-afogar"
            />
          )}
        </Field>

        <Field
          id="readingMinutes"
          label="Tempo de leitura (minutos)"
          required
          error={erros['readingMinutes']}
        >
          {(props) => (
            <div className="flex items-center gap-2.5">
              <Input
                {...props}
                name="readingMinutes"
                type="number"
                min={1}
                max={90}
                value={minutos}
                onChange={(event) => setMinutos(event.target.value)}
                required
                className="max-w-28"
              />
              <button
                type="button"
                onClick={() => setMinutos(String(sugestao))}
                className="text-sm font-medium text-brand-700 underline-offset-2 hover:underline"
              >
                Usar {sugestao}
              </button>
            </div>
          )}
        </Field>

        <Field
          id="coverUrl"
          label="Imagem de capa"
          error={erros['coverUrl']}
          hint="Opcional. Endereço completo de uma imagem que você tenha direito de usar."
        >
          {(props) => (
            <Input
              {...props}
              name="coverUrl"
              type="url"
              defaultValue={initial.coverUrl}
              placeholder="https://..."
            />
          )}
        </Field>
      </section>

      <section className="space-y-4 rounded-xl border border-ink-200 bg-white p-5">
        <h2 className="text-lg">Publicação</h2>

        <Field
          id="status"
          label="Situação"
          required
          error={erros['status']}
          hint="Rascunho fica visível só aqui no painel. Publicado vai para a página Aprender."
        >
          {(props) => (
            <Select {...props} name="status" defaultValue={initial.status} required>
              <option value="DRAFT">Rascunho</option>
              <option value="PUBLISHED">Publicado</option>
              <option value="ARCHIVED">Arquivado</option>
            </Select>
          )}
        </Field>

        <Alert tone="info">
          Cite de onde veio a informação dentro do próprio texto, com link. É o
          que separa um conteúdo educativo de um palpite bem escrito.
        </Alert>
      </section>

      <div className="flex justify-end gap-2.5">
        <SubmitButton size="lg" iconLeft="check">
          Salvar conteúdo
        </SubmitButton>
      </div>
    </form>
  );
}
