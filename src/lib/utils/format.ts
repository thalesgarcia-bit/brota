/**
 * Formatação em português do Brasil.
 * Tudo centralizado para que datas e números nunca apareçam em formato inglês.
 */

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

const shortDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const monthYearFormatter = new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  year: 'numeric',
});

const numberFormatter = new Intl.NumberFormat('pt-BR');

export function formatDate(value: Date | string): string {
  return dateFormatter.format(new Date(value));
}

export function formatShortDate(value: Date | string): string {
  return shortDateFormatter.format(new Date(value));
}

export function formatMonthYear(value: Date | string): string {
  return monthYearFormatter.format(new Date(value));
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/** "há 3 dias", "agora mesmo". Sempre com o título completo no atributo title. */
export function formatRelative(value: Date | string): string {
  const date = new Date(value);
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);

  if (seconds < 45) return 'agora mesmo';
  if (seconds < 90) return 'há 1 minuto';

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `há ${minutes} minutos`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? 'há 1 hora' : `há ${hours} horas`;

  const days = Math.round(hours / 24);
  if (days === 1) return 'ontem';
  if (days < 30) return `há ${days} dias`;

  const months = Math.round(days / 30);
  if (months < 12) return months === 1 ? 'há 1 mês' : `há ${months} meses`;

  const years = Math.round(months / 12);
  return years === 1 ? 'há 1 ano' : `há ${years} anos`;
}

export function formatDistanceMeters(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`;
}

/** Lista legível: "a, b e c". */
export function formatList(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0] as string;
  return `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`;
}

export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}
