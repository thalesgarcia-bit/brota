import { twMerge } from 'tailwind-merge';

type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | ClassValue[]
  | Record<string, boolean | null | undefined>;

/**
 * Junta nomes de classe descartando valores falsos e resolvendo conflitos.
 *
 * A resolução de conflito não é luxo: sem ela, `cn('bg-brand-600', 'bg-white')`
 * mantém as duas classes e quem vence é a ordem em que o Tailwind gerou o CSS
 * — não a ordem em que escrevemos. Foi assim que um botão ficou branco sobre
 * branco e o olho de "mostrar senha" foi parar embaixo do campo.
 */
export function cn(...values: ClassValue[]): string {
  const out: string[] = [];

  for (const value of values) {
    if (!value) continue;

    if (typeof value === 'string' || typeof value === 'number') {
      out.push(String(value));
    } else if (Array.isArray(value)) {
      const nested = flatten(value);
      if (nested) out.push(nested);
    } else {
      for (const [key, enabled] of Object.entries(value)) {
        if (enabled) out.push(key);
      }
    }
  }

  return twMerge(out.join(' '));
}

function flatten(values: ClassValue[]): string {
  const out: string[] = [];

  for (const value of values) {
    if (!value) continue;

    if (typeof value === 'string' || typeof value === 'number') {
      out.push(String(value));
    } else if (Array.isArray(value)) {
      const nested = flatten(value);
      if (nested) out.push(nested);
    } else {
      for (const [key, enabled] of Object.entries(value)) {
        if (enabled) out.push(key);
      }
    }
  }

  return out.join(' ');
}
