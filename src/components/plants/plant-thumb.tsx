import Image from 'next/image';

import { cn } from '@/lib/utils/cn';

/* ===========================================================================
 * MINIATURA DA ESPÉCIE
 *
 * Quando ainda não há fotografia cadastrada, o BROTA não usa uma foto genérica
 * de banco de imagens nem uma imagem de outra espécie: desenha uma marca
 * botânica gerada a partir do nome da planta. Fica claro que é um espaço à
 * espera de foto, e o catálogo continua bonito enquanto isso.
 * =========================================================================== */

/** Hash estável e simples — o mesmo slug produz sempre o mesmo desenho. */
function hash(value: string): number {
  let result = 0;
  for (let index = 0; index < value.length; index += 1) {
    result = (result << 5) - result + value.charCodeAt(index);
    result |= 0;
  }
  return Math.abs(result);
}

const PALETTES = [
  { bg: '#f1f7f3', leaf: '#3a8761', accent: '#8fc3a5' },
  { bg: '#eef5f1', leaf: '#2c6d4e', accent: '#bcdcc8' },
  { bg: '#f3f7f2', leaf: '#23573f', accent: '#5da47f' },
  { bg: '#faf8f4', leaf: '#2c6d4e', accent: '#a6714e' },
];

const SHAPES = [
  // Folha lanceolada
  'M50 8c22 14 30 38 22 60-6 16-16 26-22 30-6-4-16-14-22-30C20 46 28 22 50 8Z',
  // Folha arredondada
  'M50 12c26 0 40 18 40 38 0 22-18 38-40 38S10 72 10 50c0-20 14-38 40-38Z',
  // Folha recortada, tipo monstera
  'M50 10c24 10 34 32 30 54-3 18-16 30-30 34-14-4-27-16-30-34C16 42 26 20 50 10Zm0 18c-9 6-14 16-14 26h14V28Zm0 34H36c1 8 6 15 14 20V62Zm4-34v26h14c0-10-5-20-14-26Zm0 34v20c8-5 13-12 14-20H54Z',
  // Roseta suculenta
  'M50 14c8 10 8 22 0 32-8-10-8-22 0-32Zm-30 16c12 3 20 12 22 24-12-3-20-12-22-24Zm60 0c-2 12-10 21-22 24 2-12 10-21 22-24ZM26 62c12-2 22 3 28 13-12 2-22-3-28-13Zm48 0c-6 10-16 15-28 13 6-10 16-15 28-13Z',
];

export function PlantThumb({
  slug,
  name,
  src,
  alt,
  className,
  rounded = 'lg',
  priority = false,
}: {
  slug: string;
  name: string;
  src?: string | null;
  alt?: string | null;
  className?: string;
  rounded?: 'lg' | 'xl' | 'none';
  priority?: boolean;
}) {
  const radius =
    rounded === 'none' ? '' : rounded === 'xl' ? 'rounded-xl' : 'rounded-lg';

  if (src) {
    return (
      <Image
        src={src}
        alt={alt ?? `Fotografia de ${name}`}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
        priority={priority}
        className={cn('object-cover', radius, className)}
      />
    );
  }

  const seed = hash(slug);
  const palette = PALETTES[seed % PALETTES.length]!;
  const shape = SHAPES[(seed >> 3) % SHAPES.length]!;
  const rotation = ((seed >> 5) % 5) * 9 - 18;

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={`Ilustração representando ${name}. Esta espécie ainda não tem fotografia cadastrada.`}
      className={cn('h-full w-full', radius, className)}
    >
      <rect width="100" height="100" fill={palette.bg} />
      <circle cx="78" cy="24" r="26" fill={palette.accent} opacity="0.28" />
      <circle cx="18" cy="84" r="20" fill={palette.accent} opacity="0.2" />
      <g transform={`rotate(${rotation} 50 50)`}>
        <path d={shape} fill={palette.leaf} opacity="0.9" />
        <path
          d="M50 88V34"
          stroke={palette.bg}
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.55"
        />
      </g>
    </svg>
  );
}
