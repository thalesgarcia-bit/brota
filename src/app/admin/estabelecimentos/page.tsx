import type { Metadata } from 'next';

import { requirePermission } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { placesStatus } from '@/lib/env';
import { Alert, EmptyState } from '@/components/ui/feedback';
import { Badge } from '@/components/ui/badge';

// Consulta o banco a cada requisicao, nunca durante o build (Cloudflare + Prisma).
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Estabelecimentos',
  robots: { index: false },
};

export default async function AdminEstablishmentsPage() {
  await requirePermission('admin:manage_content', '/admin/estabelecimentos');

  const places = placesStatus();
  const establishments = await prisma.establishment.findMany({
    orderBy: { name: 'asc' },
    take: 200,
  });

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <header>
        <h1 className="text-2xl sm:text-3xl">Estabelecimentos</h1>
        <p className="mt-1.5 max-w-2xl text-ink-600">
          A página &ldquo;Onde comprar&rdquo; consulta o OpenStreetMap ao vivo.
          Esta lista guarda apenas estabelecimentos curados manualmente pela
          equipe.
        </p>
      </header>

      <Alert
        tone={places.configured ? 'info' : 'attention'}
        className="mt-5"
        title={
          places.configured
            ? 'Fonte principal: OpenStreetMap'
            : 'Provedor de mapas não configurado'
        }
      >
        {places.configured
          ? 'Os resultados do mapa não são copiados para o nosso banco: eles pertencem ao OpenStreetMap e são consultados a cada busca, com atribuição visível ao usuário.'
          : places.reason}
      </Alert>

      <div className="mt-6">
        {establishments.length === 0 ? (
          <EmptyState
            icon="mapPin"
            title="Nenhum estabelecimento curado"
            description="A busca do usuário continua funcionando pelo OpenStreetMap. Esta lista existe para casos em que a equipe queira destacar um lugar específico — por exemplo, um viveiro parceiro da escola."
          />
        ) : (
          <ul className="space-y-2.5">
            {establishments.map((place) => (
              <li
                key={place.id}
                className="flex flex-wrap items-center gap-4 rounded-lg border border-ink-200 bg-white p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-ink-900">{place.name}</span>
                    <Badge tone="neutral">{place.category}</Badge>
                    {place.isVerified ? <Badge tone="success">Verificado</Badge> : null}
                  </p>
                  <p className="mt-1 text-xs text-ink-500">
                    {[place.address, place.city, place.state]
                      .filter(Boolean)
                      .join(', ') || 'Sem endereço cadastrado'}
                  </p>
                </div>
                <Badge tone="neutral">{place.source}</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
