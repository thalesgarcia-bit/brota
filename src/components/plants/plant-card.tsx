import Link from 'next/link';

import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { DIFFICULTY, LIGHT, WATER } from '@/lib/labels';
import type { PlantCardData } from '@/server/services/plants';
import { PlantThumb } from './plant-thumb';

/** Cartão de espécie usado no catálogo, nas recomendações e nas listas. */
export function PlantCard({
  plant,
  badge,
  footer,
  className,
  priority = false,
}: {
  plant: PlantCardData;
  /** Conteúdo opcional no topo do cartão — usado pelo percentual de compatibilidade. */
  badge?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  priority?: boolean;
}) {
  const commonName = plant.commonNames[0]?.name ?? plant.scientificName;
  const image = plant.images[0];
  const unsafeForPets =
    plant.toxicityCats !== 'NONE' || plant.toxicityDogs !== 'NONE';

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-lg border border-ink-200 bg-white transition-all duration-150 hover:border-brand-300 hover:shadow-md',
        className,
      )}
    >
      <div className="relative aspect-4/3 w-full overflow-hidden bg-ink-50">
        <PlantThumb
          slug={plant.slug}
          name={commonName}
          src={image?.url}
          alt={image?.alt}
          rounded="none"
          priority={priority}
        />

        {badge ? <div className="absolute top-2.5 left-2.5">{badge}</div> : null}

        {plant.isNative ? (
          <div className="absolute right-2.5 bottom-2.5">
            <Badge tone="brand" icon="leaf">
              Nativa
            </Badge>
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="text-base leading-snug font-semibold text-ink-900">
          <Link
            href={`/plantas/${plant.slug}`}
            className="after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            {commonName}
          </Link>
        </h3>
        <p className="mt-0.5 truncate text-xs text-ink-500 italic">
          {plant.scientificName}
        </p>

        <dl className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-ink-600">
          <div className="flex items-center gap-1">
            <dt className="sr-only">Luminosidade</dt>
            <Icon name={LIGHT[plant.light].icon} size={14} className="text-ink-400" />
            <dd>{LIGHT[plant.light].short}</dd>
          </div>
          <div className="flex items-center gap-1">
            <dt className="sr-only">Rega</dt>
            <Icon name="droplet" size={14} className="text-ink-400" />
            <dd>{WATER[plant.water].short}</dd>
          </div>
          <div className="flex items-center gap-1">
            <dt className="sr-only">Dificuldade</dt>
            <Icon name="sprout" size={14} className="text-ink-400" />
            <dd>{DIFFICULTY[plant.difficulty].label}</dd>
          </div>
        </dl>

        {unsafeForPets ? (
          <p className="mt-2.5 flex items-center gap-1.5 text-xs text-warning-700">
            <Icon name="alert" size={13} />
            Atenção com pets
          </p>
        ) : null}

        {footer ? <div className="relative mt-3">{footer}</div> : null}
      </div>
    </article>
  );
}

export function PlantCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-ink-200 bg-white">
      <div className="skeleton aspect-4/3 w-full" />
      <div className="space-y-2 p-3.5">
        <span className="skeleton block h-4 w-2/3" />
        <span className="skeleton block h-3 w-1/2" />
        <span className="skeleton block h-3 w-full" />
      </div>
    </div>
  );
}
