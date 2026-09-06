import type { Metadata } from 'next';
import Link from 'next/link';

import { requirePermission } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { Icon } from '@/components/ui/icon';
import { PlantForm } from '@/components/admin/plant-form';

export const metadata: Metadata = {
  title: 'Nova espécie',
  robots: { index: false },
};

export default async function NewPlantPage() {
  await requirePermission('admin:manage_plants', '/admin/plantas/nova');

  const categories = await prisma.plantCategory.findMany({
    orderBy: { position: 'asc' },
    select: { slug: true, name: true },
  });

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <nav aria-label="Você está em" className="mb-5 text-sm text-ink-500">
        <Link href="/admin/plantas" className="inline-flex items-center gap-1.5 hover:text-brand-700">
          <Icon name="chevronLeft" size={14} />
          Plantas
        </Link>
      </nav>

      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl">Nova espécie</h1>
        <p className="mt-1.5 max-w-2xl text-ink-600">
          Preencha o que souber com segurança. O que não for confirmado em fonte
          fica como &ldquo;informação não confirmada&rdquo; — e a interface diz
          isso ao usuário.
        </p>
      </header>

      <div className="max-w-3xl">
        <PlantForm
          categories={categories}
          initial={{
            slug: '',
            scientificName: '',
            commonNames: '',
            family: '',
            genus: '',
            origin: '',
            description: '',
            light: 'BRIGHT_INDIRECT',
            water: 'MODERATE',
            humidity: 'MEDIUM',
            tempMinC: '',
            tempMaxC: '',
            substrate: '',
            fertilization: '',
            pruning: '',
            propagation: '',
            flowering: '',
            size: 'MEDIUM',
            growthRate: 'MODERATE',
            difficulty: 'EASY',
            toxicityHumans: 'UNKNOWN',
            toxicityDogs: 'UNKNOWN',
            toxicityCats: 'UNKNOWN',
            toxicityNote: '',
            commonProblems: '',
            commonPests: '',
            commonMistakes: '',
            curiosity: '',
            isNative: false,
            isAirPurifying: false,
            categorySlugs: [],
            environments: [],
            status: 'DRAFT',
            dataQuality: 'SEED_UNREVIEWED',
            sources: [{ title: '', url: '' }],
          }}
        />
      </div>
    </div>
  );
}
