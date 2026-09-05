import type { PlantSearchInput } from '@/lib/validation/plant';

export type SearchParams = Record<string, string | string[] | undefined>;

function toArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : value.split(',').filter(Boolean);
}

/** Normaliza a query string antes da validação com Zod. */
export function parseFilters(params: SearchParams) {
  return {
    q: typeof params['q'] === 'string' ? params['q'] : '',
    ambiente: toArray(params['ambiente']),
    luz: toArray(params['luz']),
    agua: toArray(params['agua']),
    porte: toArray(params['porte']),
    dificuldade: toArray(params['dificuldade']),
    categoria: toArray(params['categoria']),
    petFriendly: params['pets'] === '1',
    criancas: params['criancas'] === '1',
    nativas: params['nativas'] === '1',
    ordenar: typeof params['ordenar'] === 'string' ? params['ordenar'] : 'relevancia',
    pagina: typeof params['pagina'] === 'string' ? params['pagina'] : '1',
  };
}

/** Reconstrói a query string a partir dos filtros — usado nos links. */
export function buildQuery(
  filters: PlantSearchInput,
  overrides: Partial<Record<string, string | string[] | boolean | number | null>> = {},
): string {
  const params = new URLSearchParams();

  const source: Record<string, unknown> = {
    q: filters.q,
    ambiente: filters.ambiente,
    luz: filters.luz,
    agua: filters.agua,
    porte: filters.porte,
    dificuldade: filters.dificuldade,
    categoria: filters.categoria,
    pets: filters.petFriendly,
    criancas: filters.criancas,
    nativas: filters.nativas,
    ordenar: filters.ordenar === 'relevancia' ? '' : filters.ordenar,
    pagina: filters.pagina === 1 ? '' : filters.pagina,
    ...overrides,
  };

  for (const [key, value] of Object.entries(source)) {
    if (value === null || value === undefined || value === '' || value === false) {
      continue;
    }
    if (Array.isArray(value)) {
      if (value.length > 0) params.set(key, value.join(','));
    } else if (value === true) {
      params.set(key, '1');
    } else {
      params.set(key, String(value));
    }
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}
