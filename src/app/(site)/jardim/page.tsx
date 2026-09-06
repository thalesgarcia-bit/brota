import type { Metadata } from 'next';
import Link from 'next/link';

import { requireUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { EmptyState } from '@/components/ui/feedback';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { PlantThumb } from '@/components/plants/plant-thumb';
import { formatRelative } from '@/lib/utils/format';
import { AddPlantButton } from '@/components/garden/add-plant-button';

// Consulta o banco a cada requisicao, nunca durante o build (Cloudflare + Prisma).
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Meu Jardim',
  robots: { index: false },
};

export default async function GardenPage() {
  const user = await requireUser('/jardim');

  const plants = await prisma.userPlant.findMany({
    where: { userId: user.id, isActive: true },
    orderBy: { createdAt: 'desc' },
    include: {
      plant: {
        select: {
          slug: true,
          scientificName: true,
          water: true,
          commonNames: { where: { isPrimary: true }, take: 1 },
        },
      },
      _count: { select: { diaryEntries: true } },
    },
  });

  return (
    <div className="container-page py-6 sm:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl">Meu Jardim</h1>
          <p className="mt-1.5 text-ink-600">
            {plants.length > 0
              ? `${plants.length} ${plants.length === 1 ? 'planta' : 'plantas'} sob os seus cuidados.`
              : 'O seu jardim digital — mesmo que caiba em um peitoril.'}
          </p>
        </div>
        {plants.length > 0 ? <AddPlantButton /> : null}
      </header>

      {plants.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon="sprout"
          title="Seu jardim ainda está vazio"
          description="Quando você adicionar sua primeira planta, poderá acompanhar a evolução dela por aqui: regas, podas, novas folhas e a primeira flor."
          action={<AddPlantButton label="Adicionar minha primeira planta" />}
        />
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {plants.map((item) => {
            const speciesName =
              item.plant?.commonNames[0]?.name ??
              item.plant?.scientificName ??
              item.customSpeciesName;

            return (
              <li key={item.id}>
                <Link
                  href={`/jardim/${item.id}`}
                  className="group flex gap-4 rounded-lg border border-ink-200 bg-white p-3.5 transition-all hover:border-brand-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-ink-50">
                    {item.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.photoUrl}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <PlantThumb
                        slug={item.plant?.slug ?? item.id}
                        name={item.nickname}
                        rounded="none"
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-semibold text-ink-900">
                      {item.nickname}
                    </h2>
                    {speciesName ? (
                      <p className="truncate text-xs text-ink-500">{speciesName}</p>
                    ) : null}

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.lastWateredAt ? (
                        <Badge tone="info" icon="droplet">
                          Regada {formatRelative(item.lastWateredAt)}
                        </Badge>
                      ) : (
                        <Badge tone="neutral" icon="droplet">
                          Sem rega registrada
                        </Badge>
                      )}
                    </div>

                    <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-500">
                      <Icon name="note" size={13} />
                      {item._count.diaryEntries}{' '}
                      {item._count.diaryEntries === 1 ? 'registro' : 'registros'} no
                      diário
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
