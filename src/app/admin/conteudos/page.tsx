import type { Metadata } from 'next';
import Link from 'next/link';

import { requirePermission } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/feedback';
import { Icon } from '@/components/ui/icon';
import { formatDate } from '@/lib/utils/format';

// Consulta o banco a cada requisicao, nunca durante o build (Cloudflare + Prisma).
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Conteúdos educativos',
  robots: { index: false },
};

export default async function AdminArticlesPage() {
  await requirePermission('admin:manage_content', '/admin/conteudos');

  const articles = await prisma.educationalArticle.findMany({
    orderBy: [{ status: 'asc' }, { category: 'asc' }, { title: 'asc' }],
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      status: true,
      readingMinutes: true,
      publishedAt: true,
      _count: { select: { savedItems: true } },
    },
  });

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <header>
        <h1 className="text-2xl sm:text-3xl">Conteúdos educativos</h1>
        <p className="mt-1.5 max-w-2xl text-ink-600">
          Os textos da área Aprender. A edição do corpo é feita no arquivo de
          seed ou diretamente no banco — o editor visual entra em uma próxima
          etapa.
        </p>
      </header>

      <div className="mt-6">
        {articles.length === 0 ? (
          <EmptyState
            icon="book"
            title="Nenhum conteúdo cadastrado"
            description="Rode o seed do banco para carregar os textos iniciais."
          />
        ) : (
          <ul className="space-y-2.5">
            {articles.map((article) => (
              <li
                key={article.id}
                className="flex flex-wrap items-center gap-4 rounded-lg border border-ink-200 bg-white p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/aprender/${article.slug}`}
                      className="font-medium text-ink-900 hover:text-brand-700"
                    >
                      {article.title}
                    </Link>
                    <Badge tone="neutral">{article.category}</Badge>
                    <Badge
                      tone={article.status === 'PUBLISHED' ? 'success' : 'warning'}
                    >
                      {article.status === 'PUBLISHED' ? 'Publicado' : 'Rascunho'}
                    </Badge>
                  </p>
                  <p className="mt-1 text-xs text-ink-500">
                    {article.readingMinutes} min de leitura ·{' '}
                    {article._count.savedItems} salvamentos
                    {article.publishedAt
                      ? ` · desde ${formatDate(article.publishedAt)}`
                      : ''}
                  </p>
                </div>

                <Link
                  href={`/aprender/${article.slug}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline"
                >
                  Ver
                  <Icon name="externalLink" size={14} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
