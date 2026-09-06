import type { Metadata } from 'next';

import { requireUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { ComposeForm } from './compose-form';

// Consulta o banco a cada requisicao, nunca durante o build (Cloudflare + Prisma).
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Publicar',
  robots: { index: false },
};

export default async function ComposePage() {
  const user = await requireUser('/publicar');

  const gardenPlants = await prisma.userPlant.findMany({
    where: { userId: user.id, isActive: true },
    select: {
      nickname: true,
      plant: {
        select: {
          id: true,
          scientificName: true,
          commonNames: { where: { isPrimary: true }, take: 1 },
        },
      },
    },
    take: 30,
  });

  return (
    <div className="container-page py-6 sm:py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl sm:text-3xl">Nova publicação</h1>
        <p className="mt-1.5 text-ink-600">
          Mostre uma planta, compartilhe uma dica ou peça ajuda à comunidade.
        </p>

        <div className="mt-7">
          <ComposeForm
            gardenOptions={gardenPlants
              .filter((item) => item.plant)
              .map((item) => ({
                id: item.plant!.id,
                label: `${item.nickname} — ${item.plant!.commonNames[0]?.name ?? item.plant!.scientificName}`,
              }))}
          />
        </div>
      </div>
    </div>
  );
}
