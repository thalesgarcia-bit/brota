import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { requirePermission } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { Icon } from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { ArticleForm } from '@/components/admin/article-form';

// Consulta o banco a cada requisicao, nunca durante o build (Cloudflare + Prisma).
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Editar conteúdo',
  robots: { index: false },
};

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission('admin:manage_content', '/admin/conteudos');

  const { id } = await params;

  const [artigo, categorias] = await Promise.all([
    prisma.educationalArticle.findUnique({
      where: { id },
      include: {
        author: { select: { profile: { select: { displayName: true } } } },
      },
    }),
    prisma.educationalArticle.findMany({
      distinct: ['category'],
      orderBy: { category: 'asc' },
      select: { category: true },
    }),
  ]);

  if (!artigo) notFound();

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <nav aria-label="Você está em" className="mb-5 text-sm text-ink-500">
        <Link
          href="/admin/conteudos"
          className="inline-flex items-center gap-1.5 hover:text-brand-700"
        >
          <Icon name="chevronLeft" size={14} />
          Conteúdos educativos
        </Link>
      </nav>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl">Editar conteúdo</h1>
          <p className="mt-1.5 text-ink-600">
            {artigo.author?.profile?.displayName
              ? `Escrito por ${artigo.author.profile.displayName}.`
              : 'Sem autoria registrada.'}{' '}
            {artigo.status === 'PUBLISHED' ? (
              <Link
                href={`/aprender/${artigo.slug}`}
                className="text-brand-700 underline-offset-2 hover:underline"
              >
                Ver no site
              </Link>
            ) : null}
          </p>
        </div>

        <Badge
          tone={
            artigo.status === 'PUBLISHED'
              ? 'success'
              : artigo.status === 'ARCHIVED'
                ? 'neutral'
                : 'warning'
          }
        >
          {artigo.status === 'PUBLISHED'
            ? 'Publicado'
            : artigo.status === 'ARCHIVED'
              ? 'Arquivado'
              : 'Rascunho'}
        </Badge>
      </header>

      <div className="max-w-3xl">
        <ArticleForm
          categories={categorias.map((item) => item.category)}
          initial={{
            id: artigo.id,
            slug: artigo.slug,
            title: artigo.title,
            excerpt: artigo.excerpt,
            body: artigo.body,
            category: artigo.category,
            coverUrl: artigo.coverUrl ?? '',
            readingMinutes: String(artigo.readingMinutes),
            status: artigo.status,
          }}
        />
      </div>
    </div>
  );
}
