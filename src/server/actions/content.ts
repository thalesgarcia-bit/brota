'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { prisma } from '@/lib/db/prisma';
import { assertPermission, AuthorizationError } from '@/lib/auth/session';
import { articleSchema } from '@/lib/validation/article';
import { slugify } from '@/lib/utils/slug';
import type { FormState } from './form-state';

/* ===========================================================================
 * CONTEÚDOS EDUCATIVOS
 *
 * Mesma disciplina do cadastro de espécies: o formulário ajuda, o servidor
 * decide. Toda ação aqui exige a permissão `admin:manage_content` e fica
 * registrada — quem escreveu e quem publicou é informação que a escola pode
 * precisar depois.
 * =========================================================================== */

function fieldErrors(error: {
  issues: { path: (string | number)[]; message: string }[];
}): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    result[key] ??= issue.message;
  }
  return result;
}

/**
 * Cria ou atualiza um conteúdo educativo.
 *
 * O endereço (slug) é gerado do título quando fica em branco, e é conferido
 * contra os existentes: dois conteúdos com o mesmo endereço fariam um sumir
 * atrás do outro.
 */
export async function saveArticleAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  let staff;
  try {
    staff = await assertPermission('admin:manage_content');
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { status: 'error', message: error.message };
    }
    throw error;
  }

  const id = String(formData.get('id') ?? '') || null;
  const title = String(formData.get('title') ?? '').trim();
  const coverUrl = String(formData.get('coverUrl') ?? '').trim();

  const parsed = articleSchema.safeParse({
    id,
    slug: String(formData.get('slug') ?? '').trim() || slugify(title),
    title,
    excerpt: String(formData.get('excerpt') ?? ''),
    body: String(formData.get('body') ?? ''),
    category: String(formData.get('category') ?? ''),
    coverUrl: coverUrl || null,
    readingMinutes: formData.get('readingMinutes') ?? 4,
    status: formData.get('status') ?? 'DRAFT',
  });

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Confira os campos destacados.',
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  const dados = parsed.data;

  const conflito = await prisma.educationalArticle.findFirst({
    where: { slug: dados.slug, ...(id ? { NOT: { id } } : {}) },
    select: { id: true },
  });

  if (conflito) {
    return {
      status: 'error',
      message: 'Já existe um conteúdo com esse endereço.',
      fieldErrors: { slug: 'Escolha outro endereço.' },
    };
  }

  // A data de publicação é gravada na primeira vez que o conteúdo vai ao ar,
  // e não muda em edições posteriores — senão um ajuste de vírgula jogaria o
  // texto para o topo da lista como se fosse novidade.
  const anterior = id
    ? await prisma.educationalArticle.findUnique({
        where: { id },
        select: { publishedAt: true, status: true },
      })
    : null;

  if (id && !anterior) {
    return { status: 'error', message: 'Conteúdo não encontrado.' };
  }

  const publishedAt =
    dados.status === 'PUBLISHED'
      ? (anterior?.publishedAt ?? new Date())
      : anterior?.publishedAt ?? null;

  const campos = {
    slug: dados.slug,
    title: dados.title,
    excerpt: dados.excerpt,
    body: dados.body,
    category: dados.category,
    coverUrl: dados.coverUrl ?? null,
    readingMinutes: dados.readingMinutes,
    status: dados.status,
    publishedAt,
  };

  const artigo = id
    ? await prisma.educationalArticle.update({ where: { id }, data: campos })
    : await prisma.educationalArticle.create({
        data: { ...campos, authorId: staff.id },
      });

  await prisma.auditLog.create({
    data: {
      actorId: staff.id,
      action: id ? 'content.update' : 'content.create',
      entityType: 'EducationalArticle',
      entityId: artigo.id,
      before: anterior ? { status: anterior.status } : undefined,
      after: { slug: artigo.slug, title: artigo.title, status: artigo.status },
    },
  });

  revalidatePath('/aprender');
  revalidatePath(`/aprender/${dados.slug}`);
  revalidatePath('/admin/conteudos');

  redirect('/admin/conteudos?salvo=1');
}

/**
 * Arquiva um conteúdo.
 *
 * Arquivar, não apagar: o texto sai do ar para os leitores, mas continua
 * disponível no painel para ser retomado ou consultado. Um conteúdo escrito
 * por uma turma é trabalho de gente, e apagar de vez raramente é o que se quer.
 */
export async function archiveArticleAction(
  articleId: string,
): Promise<{ ok: boolean; message?: string }> {
  try {
    const staff = await assertPermission('admin:manage_content');

    const artigo = await prisma.educationalArticle.findUnique({
      where: { id: articleId },
      select: { id: true, title: true, slug: true, status: true },
    });

    if (!artigo) return { ok: false, message: 'Conteúdo não encontrado.' };

    const arquivar = artigo.status !== 'ARCHIVED';

    await prisma.educationalArticle.update({
      where: { id: articleId },
      data: { status: arquivar ? 'ARCHIVED' : 'DRAFT' },
    });

    await prisma.auditLog.create({
      data: {
        actorId: staff.id,
        action: arquivar ? 'content.archive' : 'content.restore',
        entityType: 'EducationalArticle',
        entityId: articleId,
        before: { status: artigo.status },
        after: { status: arquivar ? 'ARCHIVED' : 'DRAFT' },
      },
    });

    revalidatePath('/aprender');
    revalidatePath(`/aprender/${artigo.slug}`);
    revalidatePath('/admin/conteudos');

    return {
      ok: true,
      message: arquivar
        ? 'Conteúdo arquivado. Ele saiu do ar, mas continua aqui.'
        : 'Conteúdo devolvido para rascunho.',
    };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, message: error.message };
    }
    throw error;
  }
}
