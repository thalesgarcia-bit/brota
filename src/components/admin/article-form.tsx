'use client';

import { useActionState, useState } from 'react';

import { Field } from '@/components/ui/field';
import { Input, Select, Textarea } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import { Alert } from '@/components/ui/feedback';
import { Icon } from '@/components/ui/icon';
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
          hint="Aceita ## para subtítulos, - para listas, **negrito**, > para citações e [texto](endereço) para links."
        >
          {(props) => (
            <Textarea
              {...props}
              name="body"
              rows={18}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder={'## Por onde começar\n\nEscreva aqui...'}
              required
              className="font-mono text-sm"
            />
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
