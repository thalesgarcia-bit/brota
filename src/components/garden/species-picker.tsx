'use client';

import { useEffect, useState } from 'react';

import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils/cn';

type Suggestion = {
  id: string;
  slug: string;
  scientificName: string;
  commonNames: { name: string }[];
};

/**
 * Escolha da espécie com busca no catálogo.
 * Quem não encontra a espécie pode escrever o nome livremente — a planta entra
 * no jardim mesmo assim, e a equipe pode cadastrar a espécie depois.
 */
export function SpeciesPicker({ error }: { error?: string }) {
  const [term, setTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selected, setSelected] = useState<{ id: string; label: string } | null>(
    null,
  );
  const [freeText, setFreeText] = useState('');

  useEffect(() => {
    if (selected || term.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/plantas/sugestoes?q=${encodeURIComponent(term)}`,
          { signal: controller.signal },
        );
        if (response.ok) setSuggestions((await response.json()) as Suggestion[]);
      } catch {
        // Sem sugestões: o usuário ainda pode escrever o nome livremente.
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [term, selected]);

  return (
    <div className="space-y-2">
      <input type="hidden" name="plantId" value={selected?.id ?? ''} />
      <input
        type="hidden"
        name="customSpeciesName"
        value={selected ? '' : freeText}
      />

      <Field
        id="especie"
        label="Espécie"
        hint="Busque no catálogo ou escreva o nome se ainda não estiver lá."
        error={error}
      >
        {(props) =>
          selected ? (
            <div className="flex items-center justify-between gap-3 rounded-md border border-brand-300 bg-brand-50 px-3 py-2.5">
              <span className="min-w-0 truncate text-sm font-medium text-brand-900">
                {selected.label}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setTerm('');
                }}
                className="shrink-0 rounded-xs p-1 text-brand-700 hover:bg-brand-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-600"
                aria-label="Trocar espécie"
              >
                <Icon name="close" size={15} />
              </button>
            </div>
          ) : (
            <Input
              {...props}
              value={term}
              onChange={(event) => {
                setTerm(event.target.value);
                setFreeText(event.target.value);
              }}
              iconLeft="search"
              placeholder="Ex.: jiboia, Monstera deliciosa..."
              autoComplete="off"
            />
          )
        }
      </Field>

      {suggestions.length > 0 && !selected ? (
        <ul className="max-h-48 overflow-y-auto rounded-md border border-ink-200 bg-white py-1">
          {suggestions.map((item) => (
            <li key={item.slug}>
              <button
                type="button"
                onClick={() => {
                  const label = item.commonNames[0]?.name ?? item.scientificName;
                  setSelected({ id: item.id, label });
                  setTerm(label);
                }}
                className={cn(
                  'flex w-full items-baseline gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-ink-50',
                  'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-600',
                )}
              >
                <span className="font-medium text-ink-900">
                  {item.commonNames[0]?.name ?? item.scientificName}
                </span>
                <span className="truncate text-xs text-ink-500 italic">
                  {item.scientificName}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
