import type { Metadata } from 'next';
import Link from 'next/link';

import { prisma } from '@/lib/db/prisma';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { EmptyState } from '@/components/ui/feedback';

export const metadata: Metadata = {
  title: 'Aprender',
  description:
    'Conteúdos sobre rega, luminosidade, substrato, propagação, adubação, plantas nativas, polinizadores e compostagem.',
  alternates: { canonical: '/aprender' },
};

// Consulta o banco a cada requisicao, nunca durante o build (Cloudflare + Prisma).
export const dynamic = 'force-dynamic';

export default async function LearnPage() {
  const articles = await prisma.educationalArticle.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: [{ category: 'asc' }, { title: 'asc' }],
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      category: true,
      readingMinutes: true,
    },
  });

  const byCategory = new Map<string, typeof articles>();
  for (const article of articles) {
    const list = byCategory.get(article.category) ?? [];
    list.push(article);
    byCategory.set(article.category, list);
  }

  return (
    <div className="container-page py-6 sm:py-10">
      <header className="max-w-2xl">
        <Badge tone="brand" icon="book">
          Aprender
        </Badge>
        <h1 className="mt-3 text-2xl sm:text-3xl">
          Entender a planta é metade do cuidado
        </h1>
        <p className="mt-2 leading-relaxed text-ink-600">
          Textos curtos e diretos sobre o que realmente faz diferença no dia a
          dia — sem jargão e sem receita de bolo.
        </p>
      </header>

      {articles.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon="book"
          title="Nenhum conteúdo publicado ainda"
          description="Os textos educativos aparecem aqui assim que forem publicados pela equipe."
        />
      ) : (
        <div className="mt-10 space-y-10">
          {[...byCategory.entries()].map(([category, items]) => (
            <section key={category}>
              <h2 className="text-lg">{category}</h2>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((article) => (
                  <li key={article.id}>
                    <Link
                      href={`/aprender/${article.slug}`}
                      className="group flex h-full flex-col rounded-lg border border-ink-200 bg-white p-5 transition-all hover:border-brand-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                    >
                      <h3 className="text-lg leading-snug">{article.title}</h3>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-600">
                        {article.excerpt}
                      </p>
                      <p className="mt-4 flex items-center gap-1.5 text-xs text-ink-500">
                        <Icon name="clock" size={13} />
                        {article.readingMinutes} min de leitura
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
