'use client';

import { useActionState, useState } from 'react';

import { Field } from '@/components/ui/field';
import { Input, Select, Textarea } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/choice';
import { Button } from '@/components/ui/button';
import { SubmitButton } from '@/components/ui/submit-button';
import { Alert } from '@/components/ui/feedback';
import { Icon } from '@/components/ui/icon';
import {
  DATA_QUALITY,
  DIFFICULTY,
  ENVIRONMENT,
  GROWTH,
  HUMIDITY,
  LIGHT,
  SIZE,
  TOXICITY,
  WATER,
} from '@/lib/labels';
import {
  INITIAL_PLANT_FORM_STATE,
  savePlantAction,
} from '@/server/actions/plant-admin';

export type PlantFormInitial = {
  id?: string;
  slug: string;
  scientificName: string;
  commonNames: string;
  family: string;
  genus: string;
  origin: string;
  description: string;
  light: string;
  water: string;
  humidity: string;
  tempMinC: string;
  tempMaxC: string;
  substrate: string;
  fertilization: string;
  pruning: string;
  propagation: string;
  flowering: string;
  size: string;
  growthRate: string;
  difficulty: string;
  toxicityHumans: string;
  toxicityDogs: string;
  toxicityCats: string;
  toxicityNote: string;
  commonProblems: string;
  commonPests: string;
  commonMistakes: string;
  curiosity: string;
  isNative: boolean;
  isAirPurifying: boolean;
  categorySlugs: string[];
  environments: string[];
  status: string;
  dataQuality: string;
  sources: { title: string; url: string }[];
};

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-ink-200 bg-white p-4 sm:p-5">
      <h2 className="text-lg">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-ink-600">{description}</p>
      ) : null}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

/** Formulário administrativo de espécie: campos estruturados, um a um. */
export function PlantForm({
  initial,
  categories,
}: {
  initial: PlantFormInitial;
  categories: { slug: string; name: string }[];
}) {
  const [state, action] = useActionState(savePlantAction, INITIAL_PLANT_FORM_STATE);
  const [sources, setSources] = useState(
    initial.sources.length > 0 ? initial.sources : [{ title: '', url: '' }],
  );

  const error = (field: string) => state.fieldErrors?.[field];

  return (
    <form action={action} className="space-y-5" noValidate>
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      {state.status === 'error' ? (
        <Alert tone="danger">{state.message}</Alert>
      ) : null}

      <Section
        title="Identificação"
        description="Nome científico e nomes populares são a base da busca."
      >
        <Field id="scientificName" label="Nome científico" required error={error('scientificName')}>
          {(props) => (
            <Input
              {...props}
              name="scientificName"
              defaultValue={initial.scientificName}
              placeholder="Monstera deliciosa"
              required
            />
          )}
        </Field>

        <Field
          id="commonNames"
          label="Nomes populares"
          hint="Um por linha ou separados por vírgula. O primeiro é o nome principal."
          required
          error={error('commonNames')}
        >
          {(props) => (
            <Textarea
              {...props}
              name="commonNames"
              rows={3}
              defaultValue={initial.commonNames}
              placeholder={'Costela-de-adão\nMonstera'}
              required
            />
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="family" label="Família" required error={error('family')}>
            {(props) => (
              <Input {...props} name="family" defaultValue={initial.family} required />
            )}
          </Field>
          <Field id="genus" label="Gênero" hint="Se vazio, usamos a primeira palavra do nome científico." error={error('genus')}>
            {(props) => <Input {...props} name="genus" defaultValue={initial.genus} />}
          </Field>
        </div>

        <Field id="origin" label="Origem" error={error('origin')}>
          {(props) => (
            <Input
              {...props}
              name="origin"
              defaultValue={initial.origin}
              placeholder="Florestas tropicais da América Central"
            />
          )}
        </Field>

        <Field
          id="slug"
          label="Endereço da página"
          hint="Fica em /plantas/… — se vazio, geramos a partir do nome popular."
          error={error('slug')}
        >
          {(props) => (
            <Input {...props} name="slug" defaultValue={initial.slug} placeholder="costela-de-adao" />
          )}
        </Field>

        <Field id="description" label="Descrição" required error={error('description')}>
          {(props) => (
            <Textarea
              {...props}
              name="description"
              rows={5}
              defaultValue={initial.description}
              placeholder="Como a planta é, de onde vem, para quem ela serve."
              required
            />
          )}
        </Field>
      </Section>

      <Section title="Cuidados" description="Alimentam a busca, os filtros e o recomendador.">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="light" label="Luminosidade" required error={error('light')}>
            {(props) => (
              <Select {...props} name="light" defaultValue={initial.light} required>
                {Object.entries(LIGHT).map(([value, info]) => (
                  <option key={value} value={value}>
                    {info.short}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field id="water" label="Rega" required error={error('water')}>
            {(props) => (
              <Select {...props} name="water" defaultValue={initial.water} required>
                {Object.entries(WATER).map(([value, info]) => (
                  <option key={value} value={value}>
                    {info.short}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field id="humidity" label="Umidade do ar" required error={error('humidity')}>
            {(props) => (
              <Select {...props} name="humidity" defaultValue={initial.humidity} required>
                {Object.entries(HUMIDITY).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="size" label="Porte" required error={error('size')}>
            {(props) => (
              <Select {...props} name="size" defaultValue={initial.size} required>
                {Object.entries(SIZE).map(([value, info]) => (
                  <option key={value} value={value}>
                    {info.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field id="growthRate" label="Crescimento" required error={error('growthRate')}>
            {(props) => (
              <Select {...props} name="growthRate" defaultValue={initial.growthRate} required>
                {Object.entries(GROWTH).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field id="difficulty" label="Dificuldade" required error={error('difficulty')}>
            {(props) => (
              <Select {...props} name="difficulty" defaultValue={initial.difficulty} required>
                {Object.entries(DIFFICULTY).map(([value, info]) => (
                  <option key={value} value={value}>
                    {info.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="tempMinC" label="Temperatura mínima (°C)" error={error('tempMinC')}>
            {(props) => (
              <Input {...props} name="tempMinC" type="number" defaultValue={initial.tempMinC} />
            )}
          </Field>
          <Field id="tempMaxC" label="Temperatura máxima (°C)" error={error('tempMaxC')}>
            {(props) => (
              <Input {...props} name="tempMaxC" type="number" defaultValue={initial.tempMaxC} />
            )}
          </Field>
        </div>

        {(
          [
            ['substrate', 'Substrato'],
            ['fertilization', 'Adubação'],
            ['pruning', 'Poda'],
            ['propagation', 'Propagação'],
            ['flowering', 'Floração'],
          ] as const
        ).map(([name, label]) => (
          <Field key={name} id={name} label={label} error={error(name)}>
            {(props) => (
              <Textarea
                {...props}
                name={name}
                rows={2}
                defaultValue={initial[name]}
              />
            )}
          </Field>
        ))}
      </Section>

      <Section
        title="Segurança botânica"
        description="Nunca deixe em branco por conveniência. Sem confirmação em fonte, escolha 'Informação não confirmada'."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {(
            [
              ['toxicityHumans', 'Para pessoas'],
              ['toxicityDogs', 'Para cães'],
              ['toxicityCats', 'Para gatos'],
            ] as const
          ).map(([name, label]) => (
            <Field key={name} id={name} label={label}>
              {(props) => (
                <Select {...props} name={name} defaultValue={initial[name]}>
                  {Object.entries(TOXICITY).map(([value, info]) => (
                    <option key={value} value={value}>
                      {info.label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          ))}
        </div>

        <Field id="toxicityNote" label="Observação sobre toxicidade" error={error('toxicityNote')}>
          {(props) => (
            <Textarea
              {...props}
              name="toxicityNote"
              rows={3}
              defaultValue={initial.toxicityNote}
              placeholder="Princípio tóxico, sintomas e o que fazer."
            />
          )}
        </Field>
      </Section>

      <Section title="Problemas e curiosidades">
        {(
          [
            ['commonProblems', 'Problemas frequentes'],
            ['commonPests', 'Pragas comuns'],
            ['commonMistakes', 'Erros frequentes'],
            ['curiosity', 'Curiosidade'],
          ] as const
        ).map(([name, label]) => (
          <Field key={name} id={name} label={label} error={error(name)}>
            {(props) => (
              <Textarea {...props} name={name} rows={2} defaultValue={initial[name]} />
            )}
          </Field>
        ))}
      </Section>

      <Section title="Classificação">
        <fieldset>
          <legend className="text-sm font-medium text-ink-800">
            Ambientes <span className="text-danger-500">*</span>
          </legend>
          {error('environments') ? (
            <p className="mt-1 text-xs text-danger-700" role="alert">
              {error('environments')}
            </p>
          ) : null}
          <div className="mt-2 grid gap-1 sm:grid-cols-3">
            {Object.entries(ENVIRONMENT).map(([value, info]) => (
              <Checkbox
                key={value}
                id={`env-${value}`}
                name="environments"
                value={value}
                label={info.label}
                defaultChecked={initial.environments.includes(value)}
              />
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium text-ink-800">Categorias</legend>
          <div className="mt-2 grid gap-1 sm:grid-cols-3">
            {categories.map((category) => (
              <Checkbox
                key={category.slug}
                id={`cat-${category.slug}`}
                name="categorySlugs"
                value={category.slug}
                label={category.name}
                defaultChecked={initial.categorySlugs.includes(category.slug)}
              />
            ))}
          </div>
        </fieldset>

        <div className="space-y-1">
          <Checkbox
            id="isNative"
            name="isNative"
            label="Nativa do Brasil"
            defaultChecked={initial.isNative}
          />
          <Checkbox
            id="isAirPurifying"
            name="isAirPurifying"
            label="Citada em estudos de purificação do ar"
            defaultChecked={initial.isAirPurifying}
          />
        </div>
      </Section>

      <Section
        title="Fontes"
        description="Toda ficha publicada precisa de ao menos uma fonte — é o que separa informação de opinião."
      >
        {error('sources') ? <Alert tone="danger">{error('sources')}</Alert> : null}

        <ul className="space-y-3">
          {sources.map((source, index) => (
            <li key={index} className="grid gap-2.5 sm:grid-cols-[1fr_1fr_auto]">
              <div>
                <label htmlFor={`sourceTitle-${index}`} className="sr-only">
                  Título da fonte {index + 1}
                </label>
                <Input
                  id={`sourceTitle-${index}`}
                  name="sourceTitle"
                  defaultValue={source.title}
                  placeholder="Título da fonte"
                />
              </div>
              <div>
                <label htmlFor={`sourceUrl-${index}`} className="sr-only">
                  URL da fonte {index + 1}
                </label>
                <Input
                  id={`sourceUrl-${index}`}
                  name="sourceUrl"
                  type="url"
                  defaultValue={source.url}
                  placeholder="https://"
                />
              </div>
              <Button
                variant="ghost"
                aria-label={`Remover fonte ${index + 1}`}
                onClick={() =>
                  setSources((current) =>
                    current.length === 1
                      ? [{ title: '', url: '' }]
                      : current.filter((_, position) => position !== index),
                  )
                }
              >
                <Icon name="trash" size={17} />
              </Button>
            </li>
          ))}
        </ul>

        <Button
          variant="outline"
          size="sm"
          iconLeft="plus"
          onClick={() => setSources((current) => [...current, { title: '', url: '' }])}
        >
          Adicionar fonte
        </Button>
      </Section>

      <Section title="Publicação">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="status" label="Situação">
            {(props) => (
              <Select {...props} name="status" defaultValue={initial.status}>
                <option value="DRAFT">Rascunho</option>
                <option value="PUBLISHED">Publicada</option>
                <option value="ARCHIVED">Arquivada</option>
              </Select>
            )}
          </Field>

          <Field id="dataQuality" label="Situação editorial">
            {(props) => (
              <Select {...props} name="dataQuality" defaultValue={initial.dataQuality}>
                {Object.entries(DATA_QUALITY).map(([value, info]) => (
                  <option key={value} value={value}>
                    {info.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
      </Section>

      <div className="sticky bottom-0 flex gap-2.5 border-t border-ink-200 bg-ink-25 py-4">
        <SubmitButton size="lg">
          {initial.id ? 'Salvar alterações' : 'Cadastrar espécie'}
        </SubmitButton>
      </div>
    </form>
  );
}
