import Image from 'next/image';

import { cn } from '@/lib/utils/cn';

const SIZES = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 88,
} as const;

export type AvatarSize = keyof typeof SIZES;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join('') || '?';
}

export function Avatar({
  name,
  src,
  size = 'md',
  className,
}: {
  name: string;
  src?: string | null;
  size?: AvatarSize;
  className?: string;
}) {
  const dimension = SIZES[size];

  if (src) {
    return (
      <Image
        src={src}
        alt={`Foto de perfil de ${name}`}
        width={dimension}
        height={dimension}
        className={cn(
          'shrink-0 rounded-full border border-ink-100 object-cover',
          className,
        )}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      style={{ width: dimension, height: dimension }}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-medium text-brand-800',
        size === 'xs' && 'text-2xs',
        size === 'sm' && 'text-xs',
        size === 'md' && 'text-sm',
        size === 'lg' && 'text-base',
        size === 'xl' && 'text-xl',
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
