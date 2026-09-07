import type { Metadata } from 'next';
import Link from 'next/link';

import { requirePermission } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { Icon } from '@/components/ui/icon';
import { ArticleForm } from '@/components/admin/article-form';

// Consulta o banco a cada requisicao, nunca durante o build (Cloudflare + Prisma).
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Novo conteúdo',
  robots: { index: false },
};

export default async function NewArticlePage() {
  await requirePermission('admin:manage_content', '/admin/conteudos/novo');

  const categorias = await prisma.educationalArticle.findMany({
    distinct: ['category'],
    orderBy: { category: 'asc' },
    select: { category: true },
  });

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

      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl">Novo conteúdo</h1>
        <p className="mt-1.5 max-w-2xl text-ink-600">
          Escreva com calma e salve como rascunho quantas vezes quiser. Só vai ao
          ar quando você mudar a situação para publicado.
        </p>
      </header>

      <div className="max-w-3xl">
        <ArticleForm
          categories={categorias.map((item) => item.category)}
          initial={{
            slug: '',
            title: '',
            excerpt: '',
            body: '',
            category: '',
            coverUrl: '',
            readingMinutes: '4',
            status: 'DRAFT',
          }}
        />
      </div>
    </div>
  );
}
