import type { Metadata } from 'next';
import Link from 'next/link';

import { requirePermission } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { Icon, type IconName } from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/feedback';
import { formatNumber, formatRelative } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

// Consulta o banco a cada requisicao, nunca durante o build (Cloudflare + Prisma).
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Visão geral',
  robots: { index: false },
};

/** Todos os números desta página vêm do banco. Nenhum valor de exemplo. */
export default async function AdminDashboard() {
  const user = await requirePermission('admin:view', '/admin');
  const isAdmin = user.role === 'ADMIN';

  const since30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    users,
    activeUsers,
    plants,
    plantsUnreviewed,
    posts,
    comments,
    pendingIdentifications,
    pendingSuggestions,
    openReports,
    gardens,
    topSearches,
    topSaved,
    acceptedRecommendations,
    recentIdentifications,
  ] = await prisma.$transaction([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({
      where: {
        deletedAt: null,
        OR: [
          { posts: { some: { createdAt: { gte: since30Days } } } },
          { comments: { some: { createdAt: { gte: since30Days } } } },
          { userPlants: { some: { createdAt: { gte: since30Days } } } },
        ],
      },
    }),
    prisma.plant.count({ where: { status: 'PUBLISHED' } }),
    prisma.plant.count({ where: { dataQuality: 'SEED_UNREVIEWED' } }),
    prisma.post.count({ where: { status: 'PUBLISHED' } }),
    prisma.comment.count({ where: { status: 'PUBLISHED' } }),
    prisma.identificationRequest.count({
      where: { status: { in: ['AWAITING_REVIEW', 'IN_REVIEW', 'NEEDS_MORE_INFO'] } },
    }),
    prisma.plantSuggestion.count({ where: { status: 'PENDING' } }),
    prisma.report.count({ where: { status: { in: ['OPEN', 'IN_REVIEW'] } } }),
    prisma.userPlant.count({ where: { isActive: true } }),
    prisma.searchLog.groupBy({
      by: ['term'],
      _count: { term: true },
      orderBy: { _count: { term: 'desc' } },
      take: 6,
    }),
    prisma.savedItem.groupBy({
      by: ['plantId'],
      where: { kind: 'PLANT' },
      _count: { plantId: true },
      orderBy: { _count: { plantId: 'desc' } },
      take: 6,
    }),
    prisma.recommendationFeedback.count({
      where: { action: { in: ['SAVED', 'ADDED_TO_GARDEN'] } },
    }),
    prisma.identificationRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        status: true,
        createdAt: true,
        topScore: true,
        user: { select: { profile: { select: { displayName: true } } } },
      },
    }),
  ]);

  const savedPlantNames = await prisma.plant.findMany({
    where: {
      id: { in: topSaved.map((item) => item.plantId).filter((id): id is string => Boolean(id)) },
    },
    select: {
      id: true,
      slug: true,
      scientificName: true,
      commonNames: { where: { isPrimary: true }, take: 1 },
    },
  });

  const metrics: {
    label: string;
    value: number;
    icon: IconName;
    href?: string;
    tone?: 'default' | 'attention';
  }[] = [
    { label: 'Usuários cadastrados', value: users, icon: 'users' },
    { label: 'Ativos nos últimos 30 dias', value: activeUsers, icon: 'chart' },
    { label: 'Espécies publicadas', value: plants, icon: 'leaf', href: '/admin/plantas' },
    { label: 'Plantas nos jardins', value: gardens, icon: 'sprout' },
    { label: 'Publicações', value: posts, icon: 'image', href: '/admin/publicacoes' },
    { label: 'Comentários', value: comments, icon: 'message', href: '/admin/comentarios' },
  ];

  const queues: {
    label: string;
    value: number;
    icon: IconName;
    href: string;
    description: string;
  }[] = [
    {
      label: 'Identificações pendentes',
      value: pendingIdentifications,
      icon: 'scan',
      href: '/admin/identificacoes',
      description: 'Fotos que a IA não identificou com segurança.',
    },
    {
      label: 'Sugestões aguardando revisão',
      value: pendingSuggestions,
      icon: 'edit',
      href: '/admin/sugestoes',
      description: 'Contribuições da comunidade para a base botânica.',
    },
    {
      label: 'Denúncias abertas',
      value: openReports,
      icon: 'flag',
      href: '/admin/denuncias',
      description: 'Conteúdo reportado por membros.',
    },
  ];

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <header>
        <h1 className="text-2xl sm:text-3xl">Visão geral</h1>
        <p className="mt-1.5 text-ink-600">
          Todos os números vêm do banco de dados, em tempo real.
        </p>
      </header>

      {/* Filas de trabalho */}
      <section className="mt-7">
        <h2 className="text-lg">Precisa da sua atenção</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {queues.map((queue) => (
            <Link
              key={queue.href}
              href={queue.href}
              className={cn(
                'group rounded-lg border p-5 transition-all hover:shadow-md',
                queue.value > 0
                  ? 'border-warning-500/30 bg-warning-50'
                  : 'border-ink-200 bg-white',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg',
                    queue.value > 0
                      ? 'bg-white text-warning-700'
                      : 'bg-ink-50 text-ink-500',
                  )}
                >
                  <Icon name={queue.icon} size={20} />
                </span>
                <span
                  className={cn(
                    'font-display text-3xl font-semibold',
                    queue.value > 0 ? 'text-warning-700' : 'text-ink-300',
                  )}
                >
                  {queue.value}
                </span>
              </div>
              <h3 className="mt-3 font-medium text-ink-900">{queue.label}</h3>
              <p className="mt-1 text-sm text-ink-600">{queue.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Métricas */}
      <section className="mt-8">
        <h2 className="text-lg">Números do BROTA</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric) => {
            const body = (
              <div className="rounded-lg border border-ink-200 bg-white p-5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-50 text-brand-700">
                    <Icon name={metric.icon} size={18} />
                  </span>
                  <dt className="text-sm text-ink-600">{metric.label}</dt>
                </div>
                <dd className="mt-3 font-display text-3xl font-semibold text-ink-900">
                  {formatNumber(metric.value)}
                </dd>
              </div>
            );

            return metric.href ? (
              <Link key={metric.label} href={metric.href} className="block hover:opacity-90">
                {body}
              </Link>
            ) : (
              <div key={metric.label}>{body}</div>
            );
          })}
        </dl>
      </section>

      {plantsUnreviewed > 0 && isAdmin ? (
        <Alert tone="attention" className="mt-6" title="Base botânica não revisada">
          {plantsUnreviewed}{' '}
          {plantsUnreviewed === 1
            ? 'espécie ainda está marcada como não revisada'
            : 'espécies ainda estão marcadas como não revisadas'}
          . Elas aparecem no catálogo com esse aviso visível até que alguém da
          equipe confira as informações e promova o registro para{' '}
          <strong>revisado</strong>.{' '}
          <Link href="/admin/plantas?qualidade=SEED_UNREVIEWED" className="underline">
            Revisar agora
          </Link>
          .
        </Alert>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Buscas */}
        <section className="rounded-lg border border-ink-200 bg-white p-5">
          <h2 className="text-lg">Espécies mais pesquisadas</h2>
          {topSearches.length === 0 ? (
            <p className="mt-3 text-sm text-ink-500">
              Nenhuma busca registrada ainda. Os termos aparecem aqui conforme as
              pessoas usam o catálogo.
            </p>
          ) : (
            <ol className="mt-4 space-y-2">
              {topSearches.map((item, index) => (
                <li
                  key={item.term}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="w-4 shrink-0 text-ink-400">{index + 1}</span>
                    <span className="truncate text-ink-800">{item.term}</span>
                  </span>
                  <span className="shrink-0 text-ink-500">
                    {typeof item._count === 'object' ? (item._count.term ?? 0) : 0}{' '}
                    {typeof item._count === 'object' && item._count.term === 1
                      ? 'busca'
                      : 'buscas'}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Mais salvas */}
        <section className="rounded-lg border border-ink-200 bg-white p-5">
          <h2 className="text-lg">Espécies mais salvas</h2>
          {savedPlantNames.length === 0 ? (
            <p className="mt-3 text-sm text-ink-500">
              Nenhuma espécie foi salva ainda.
            </p>
          ) : (
            <ol className="mt-4 space-y-2">
              {topSaved
                .map((item) => ({
                  count:
                    typeof item._count === 'object'
                      ? (item._count.plantId ?? 0)
                      : 0,
                  plant: savedPlantNames.find((plant) => plant.id === item.plantId),
                }))
                .filter((item) => item.plant)
                .map((item, index) => (
                  <li
                    key={item.plant!.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="w-4 shrink-0 text-ink-400">{index + 1}</span>
                      <Link
                        href={`/plantas/${item.plant!.slug}`}
                        className="truncate text-ink-800 hover:text-brand-700"
                      >
                        {item.plant!.commonNames[0]?.name ??
                          item.plant!.scientificName}
                      </Link>
                    </span>
                    <span className="shrink-0 text-ink-500">{item.count}</span>
                  </li>
                ))}
            </ol>
          )}
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-ink-200 bg-white p-5">
          <h2 className="text-lg">Recomendações aceitas</h2>
          <p className="mt-2 text-sm text-ink-600">
            Quantas vezes uma espécie recomendada foi salva ou adicionada a um
            jardim. É o sinal que vai alimentar o aprendizado do recomendador.
          </p>
          <p className="mt-4 font-display text-3xl font-semibold text-brand-800">
            {formatNumber(acceptedRecommendations)}
          </p>
        </section>

        <section className="rounded-lg border border-ink-200 bg-white p-5">
          <h2 className="text-lg">Identificações recentes</h2>
          {recentIdentifications.length === 0 ? (
            <p className="mt-3 text-sm text-ink-500">
              Nenhuma identificação registrada ainda.
            </p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {recentIdentifications.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-ink-800">
                      {item.user.profile?.displayName ?? 'Membro'}
                    </span>
                    <span className="text-xs text-ink-500">
                      {formatRelative(item.createdAt)}
                      {item.topScore !== null
                        ? ` · ${Math.round(item.topScore * 100)}% de confiança`
                        : ''}
                    </span>
                  </span>
                  <Badge tone="neutral">{item.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
