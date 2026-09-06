import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { prisma } from '@/lib/db/prisma';
import { clientEnv } from '@/lib/env';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Markdown } from '@/components/ui/markdown';
import { formatDate } from '@/lib/utils/format';

// Esta rota depende do banco de dados e deve ser resolvida no runtime do
// Cloudflare Worker. Evita que o Next.js tente consultar o Prisma durante o
// build, quando o módulo WASM do cliente Cloudflare ainda não está no ambiente
// final de execução.
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await prisma.educationalArticle.findFirst({
    where: { slug, status: 'PUBLISHED' },
    select: { title: true, excerpt: true },
  });

  if (!article) return { title: 'Conteúdo não encontrado' };

  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: `/aprender/${slug}` },
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.excerpt,
      url: `${clientEnv.NEXT_PUBLIC_SITE_URL}/aprender/${slug}`,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const article = await prisma.educationalArticle.findFirst({
    where: { slug, status: 'PUBLISHED' },
  });

  if (!article) notFound();

  const related = await prisma.educationalArticle.findMany({
    where: {
      status: 'PUBLISHED',
      category: article.category,
      id: { not: article.id },
    },
    select: { slug: true, title: true, excerpt: true },
    take: 3,
  });

  return (
    <article className="container-reading py-8 sm:py-12">
      <nav aria-label="Você está em" className="mb-6 text-sm text-ink-500">
        <Link href="/aprender" className="inline-flex items-center gap-1.5 hover:text-brand-700">
          <Icon name="chevronLeft" size={14} />
          Aprender
        </Link>
      </nav>

      <header>
        <Badge tone="brand">{article.category}</Badge>
        <h1 className="mt-3 text-3xl sm:text-4xl">{article.title}</h1>
        <p className="mt-3 text-lg leading-relaxed text-ink-600">
          {article.excerpt}
        </p>
        <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-500">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="clock" size={14} />
            {article.readingMinutes} min de leitura
          </span>
          {article.publishedAt ? (
            <>
              <span aria-hidden="true">·</span>
              <time dateTime={article.publishedAt.toISOString()}>
                {formatDate(article.publishedAt)}
              </time>
            </>
          ) : null}
        </p>
      </header>

      <hr className="my-8 border-ink-100" />

      <Markdown content={article.body} />

      {related.length > 0 ? (
        <section className="mt-14 border-t border-ink-100 pt-8">
          <h2 className="text-xl">Continue lendo</h2>
          <ul className="mt-4 space-y-3">
            {related.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/aprender/${item.slug}`}
                  className="block rounded-lg border border-ink-200 bg-white p-4 transition-colors hover:border-brand-300"
                >
                  <h3 className="text-lg">{item.title}</h3>
                  <p className="mt-1 text-sm text-ink-600">{item.excerpt}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
