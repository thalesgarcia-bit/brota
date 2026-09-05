const COMBINING_MARKS = /[\u0300-\u036f]/g;

/** Converte texto em slug amigável para URL, sem acentos. */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Normaliza texto para comparação e busca (sem acentos, minúsculas). */
export function normalizeSearch(input: string): string {
  return input.normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase().trim();
}

const RESERVED_USERNAMES = new Set([
  'admin',
  'brota',
  'sobre',
  'entrar',
  'cadastro',
  'api',
  'perfil',
  'configuracoes',
  'suporte',
  'moderacao',
  'root',
  'null',
  'undefined',
]);

export function isReservedUsername(username: string): boolean {
  return RESERVED_USERNAMES.has(username.toLowerCase());
}
