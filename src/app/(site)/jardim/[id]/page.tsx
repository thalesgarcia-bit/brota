import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { requireUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Alert } from '@/components/ui/feedback';
import { PlantThumb } from '@/components/plants/plant-thumb';
import { DIARY_TYPE, LIGHT, WATER } from '@/lib/labels';
import { formatDate, formatRelative } from '@/lib/utils/format';
import { DiaryComposer } from '@/components/garden/diary-composer';
import { ReminderSettings } from '@/components/garden/reminder-settings';

export const metadata: Metadata = {
  title: 'Planta do meu jardim',
  robots: { index: false },
};

export default async function GardenPlantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser(`/jardim/${id}`);

  const item = await prisma.userPlant.findFirst({
    where: { id, userId: user.id },
    include: {
      plant: {
        select: {
          slug: true,
          scientificName: true,
          water: true,
          light: true,
          toxicityCats: true,
          toxicityDogs: true,
          commonNames: { where: { isPrimary: true }, take: 1 },
        },
      },
      diaryEntries: { orderBy: { occurredAt: 'desc' }, take: 50 },
      reminders: true,
    },
  });

  if (!item) notFound();

  const speciesName =
    item.plant?.commonNames[0]?.name ??
    item.plant?.scientificName ??
    item.customSpeciesName;

  return (
    <div className="container-page py-6 sm:py-10">
      <nav aria-label="Você está em" className="mb-5 text-sm text-ink-500">
        <Link href="/jardim" className="inline-flex items-center gap-1.5 hover:text-brand-700">
          <Icon name="chevronLeft" size={14} />
          Meu Jardim
        </Link>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem] lg:gap-10">
        <div className="min-w-0">
          <header className="flex gap-4 sm:gap-5">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-ink-50 sm:h-32 sm:w-32">
              {item.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.photoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <PlantThumb
                  slug={item.plant?.slug ?? item.id}
                  name={item.nickname}
                  rounded="none"
                />
              )}
            </div>

            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl">{item.nickname}</h1>
              {speciesName ? (
                item.plant ? (
                  <Link
                    href={`/plantas/${item.plant.slug}`}
                    className="mt-1 inline-flex items-center gap-1.5 text-sm text-brand-700 hover:underline"
                  >
                    {speciesName}
                    <Icon name="arrowRight" size={13} />
                  </Link>
                ) : (
                  <p className="mt-1 text-sm text-ink-500">{speciesName}</p>
                )
              ) : null}

              <div className="mt-3 flex flex-wrap gap-1.5">
                {item.location ? (
                  <Badge tone="neutral" icon="mapPin">
                    {item.location}
                  </Badge>
                ) : null}
                {item.lightExposure ? (
                  <Badge tone="neutral" icon={LIGHT[item.lightExposure].icon}>
                    {LIGHT[item.lightExposure].short}
                  </Badge>
                ) : null}
                {item.acquiredAt ? (
                  <Badge tone="neutral" icon="calendar">
                    Desde {formatDate(item.acquiredAt)}
                  </Badge>
                ) : null}
              </div>
            </div>
          </header>

          {item.notes ? (
            <p className="mt-5 rounded-lg border border-ink-100 bg-ink-25 p-4 text-sm leading-relaxed text-ink-700">
              {item.notes}
            </p>
          ) : null}

          {item.plant &&
          (item.plant.toxicityCats !== 'NONE' || item.plant.toxicityDogs !== 'NONE') ? (
            <Alert tone="attention" className="mt-5" title="Atenção com animais">
              Esta espécie tem registro de toxicidade para cães ou gatos. Veja os
              detalhes na{' '}
              <Link href={`/plantas/${item.plant.slug}`} className="underline">
                ficha da espécie
              </Link>
              .
            </Alert>
          ) : null}

          {/* Diário Verde */}
          <section className="mt-8">
            <h2 className="text-xl">Diário Verde</h2>
            <p className="mt-1.5 text-sm text-ink-600">
              O histórico é o que faz diferença no ano seguinte: você começa a
              enxergar os ciclos da sua planta.
            </p>

            <div className="mt-4">
              <DiaryComposer userPlantId={item.id} />
            </div>

            {item.diaryEntries.length === 0 ? (
              <p className="mt-6 rounded-lg border border-dashed border-ink-200 bg-ink-25 p-6 text-center text-sm text-ink-600">
                Nenhum registro ainda. Comece anotando a primeira rega.
              </p>
            ) : (
              <ol className="mt-6 space-y-0">
                {item.diaryEntries.map((entry, index) => {
                  const type = DIARY_TYPE[entry.type];
                  const isLast = index === item.diaryEntries.length - 1;

                  return (
                    <li key={entry.id} className="relative flex gap-4 pb-6">
                      {!isLast ? (
                        <span
                          aria-hidden="true"
                          className="absolute top-9 bottom-0 left-[1.125rem] w-px bg-ink-200"
                        />
                      ) : null}

                      <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink-200 bg-white text-brand-600">
                        <Icon name={type.icon} size={17} />
                      </span>

                      <div className="min-w-0 flex-1 pt-1">
                        <p className="flex flex-wrap items-baseline gap-x-2">
                          <span className="font-medium text-ink-900">{type.label}</span>
                          <time
                            dateTime={entry.occurredAt.toISOString()}
                            title={formatDate(entry.occurredAt)}
                            className="text-xs text-ink-500"
                          >
                            {formatRelative(entry.occurredAt)}
                          </time>
                        </p>

                        {entry.note ? (
                          <p className="mt-1 text-sm leading-relaxed text-ink-700">
                            {entry.note}
                          </p>
                        ) : null}

                        {entry.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={entry.photoUrl}
                            alt=""
                            loading="lazy"
                            className="mt-2.5 max-h-72 rounded-lg border border-ink-100 object-cover"
                          />
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>

        {/* Lateral */}
        <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-lg border border-ink-200 bg-white p-4">
            <h2 className="text-base font-semibold">Situação</h2>
            <dl className="mt-3 space-y-2.5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-500">Última rega</dt>
                <dd className="text-ink-800">
                  {item.lastWateredAt ? formatRelative(item.lastWateredAt) : '—'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-500">Registros</dt>
                <dd className="text-ink-800">{item.diaryEntries.length}</dd>
              </div>
              {item.plant ? (
                <div className="flex items-start justify-between gap-3">
                  <dt className="shrink-0 text-ink-500">Rega ideal</dt>
                  <dd className="text-right text-ink-800">
                    {WATER[item.plant.water].label}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>

          <ReminderSettings
            userPlantId={item.id}
            reminders={item.reminders.map((reminder) => ({
              kind: reminder.kind,
              enabled: reminder.enabled,
              intervalDays: reminder.intervalDays,
              preferredHour: reminder.preferredHour,
            }))}
          />
        </aside>
      </div>
    </div>
  );
}
