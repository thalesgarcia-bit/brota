'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils/cn';

type Suggestion = {
  slug: string;
  scientificName: string;
  commonNames: { name: string }[];
};

const HISTORY_KEY = 'brota:buscas-recentes';
const MAX_HISTORY = 5;

/** Busca com sugestões e histórico local. */
export function SearchBar({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listId = useId();

  const [term, setTerm] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // O histórico é conveniência local do navegador; nunca vai para o servidor.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(HISTORY_KEY);
      if (stored) setHistory(JSON.parse(stored) as string[]);
    } catch {
      // Navegação privativa ou armazenamento bloqueado: seguimos sem histórico.
    }
  }, []);

  useEffect(() => {
    if (term.trim().length < 2) {
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
        // Requisição cancelada ou rede indisponível — a busca completa continua funcionando.
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [term]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function rememberTerm(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    const next = [trimmed, ...history.filter((item) => item !== trimmed)].slice(
      0,
      MAX_HISTORY,
    );
    setHistory(next);
    try {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {
      // Sem armazenamento disponível, apenas não guardamos o histórico.
    }
  }

  function submit(value: string) {
    rememberTerm(value);
    setOpen(false);

    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) params.set('q', value.trim());
    else params.delete('q');
    params.delete('pagina');

    router.push(`/explorar${params.toString() ? `?${params}` : ''}`);
  }

  const showPanel = open && (suggestions.length > 0 || history.length > 0);

  return (
    <div ref={containerRef} className="relative">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          submit(term);
        }}
      >
        <label htmlFor="busca-plantas" className="sr-only">
          Buscar espécies
        </label>
        <div className="relative">
          <Icon
            name="search"
            size={19}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-400"
          />
          <input
            id="busca-plantas"
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            onFocus={() => setOpen(true)}
            autoComplete="off"
            role="combobox"
            aria-expanded={showPanel}
            aria-controls={listId}
            aria-autocomplete="list"
            placeholder="Nome popular, nome científico, característica..."
            className="h-12 w-full rounded-lg border border-ink-200 bg-white pr-4 pl-11 text-base placeholder:text-ink-400 focus:border-brand-500 focus:outline-2 focus:outline-brand-500/40 sm:text-sm"
          />
        </div>
      </form>

      {showPanel ? (
        <div
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-lg border border-ink-200 bg-white shadow-lg animate-rise"
        >
          {suggestions.length > 0 ? (
            <ul className="py-1">
              {suggestions.map((item) => (
                <li key={item.slug}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={false}
                    onClick={() => {
                      rememberTerm(item.commonNames[0]?.name ?? item.scientificName);
                      setOpen(false);
                      router.push(`/plantas/${item.slug}`);
                    }}
                    className={cn(
                      'flex w-full items-baseline gap-2 px-4 py-2.5 text-left transition-colors hover:bg-ink-50',
                      'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-600',
                    )}
                  >
                    <span className="text-sm font-medium text-ink-900">
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

          {history.length > 0 && suggestions.length === 0 ? (
            <div className="py-1">
              <p className="px-4 py-2 text-xs tracking-wide text-ink-500 uppercase">
                Buscas recentes
              </p>
              <ul>
                {history.map((item) => (
                  <li key={item}>
                    <button
                      type="button"
                      onClick={() => {
                        setTerm(item);
                        submit(item);
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-ink-700 transition-colors hover:bg-ink-50"
                    >
                      <Icon name="clock" size={15} className="text-ink-400" />
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
