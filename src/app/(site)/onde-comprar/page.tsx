import type { Metadata } from 'next';

import { placesStatus } from '@/lib/env';
import { Alert } from '@/components/ui/feedback';
import { Badge } from '@/components/ui/badge';
import { PlacesExplorer } from './places-explorer';

export const metadata: Metadata = {
  title: 'Onde comprar plantas',
  description:
    'Encontre floriculturas, viveiros e garden centers perto de você. Dados abertos do OpenStreetMap.',
  alternates: { canonical: '/onde-comprar' },
};

export default function WhereToBuyPage() {
  const status = placesStatus();

  return (
    <div className="container-page py-6 sm:py-10">
      <header className="max-w-2xl">
        <Badge tone="brand" icon="mapPin">
          Onde comprar
        </Badge>
        <h1 className="mt-3 text-2xl sm:text-3xl">
          Floriculturas e viveiros perto de você
        </h1>
        <p className="mt-2 leading-relaxed text-ink-600">
          Os estabelecimentos vêm do OpenStreetMap, uma base colaborativa e
          aberta. Só mostramos lugares que existem no mapa — nada é inventado.
        </p>
      </header>

      {!status.configured ? (
        <Alert tone="attention" className="mt-6" title="Mapa não configurado">
          {status.reason}
        </Alert>
      ) : (
        <div className="mt-6">
          <PlacesExplorer />
        </div>
      )}

      <p className="mt-8 text-xs text-ink-500">
        Dados de estabelecimentos: © colaboradores do OpenStreetMap, sob licença
        ODbL. Encontrou um lugar desatualizado?{' '}
        <a
          href="https://www.openstreetmap.org"
          target="_blank"
          rel="noreferrer noopener"
          className="underline hover:text-brand-700"
        >
          Você mesmo pode corrigir no OpenStreetMap
        </a>
        .
      </p>
    </div>
  );
}
