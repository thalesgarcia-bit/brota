'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { prisma } from '@/lib/db/prisma';
import { assertPermission, AuthorizationError } from '@/lib/auth/session';
import { can } from '@/lib/auth/rbac';
import { createCommentSchema, createPostSchema } from '@/lib/validation/post';
import { createReportSchema } from '@/lib/validation/community';
import type { FormState } from './form-state';

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
 * Cria uma notificação, a menos que já exista uma igual ainda não lida.
 *
 * Sem esta conferência, curtir, descurtir e curtir de novo deixava três avisos
 * idênticos na caixa da mesma pessoa. O título carrega o nome de quem agiu, e
 * é isso que separa um caso do outro: duas pessoas diferentes curtindo a mesma
 * publicação continuam gerando dois avisos, como deve ser.
 *
 * A comparação só olha o que ainda não foi lido. Depois de a pessoa ler, um
 * aviso novo sobre o mesmo assunto volta a fazer sentido.
 */
async function notificarSemRepetir(dados: {
  userId: string;
  type: 'LIKE' | 'COMMENT' | 'REPLY';
  title: string;
  body?: string;
  linkUrl: string;
}): Promise<void> {
  const jaExiste = await prisma.notification.findFirst({
    where: {
      userId: dados.userId,
      type: dados.type,
      title: dados.title,
      linkUrl: dados.linkUrl,
      readAt: null,
    },
    select: { id: true },
  });

  if (jaExiste) return;

  await prisma.notification.create({ data: dados });
}

export async function createPostAction(payload: unknown): Promise<{
  ok: boolean;
  message?: string;
  postId?: string;
  fieldErrors?: Record<string, string>;
}> {
  let user;
  try {
    user = await assertPermission('post:create');
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, message: error.message };
    }
    throw error;
  }

  const parsed = createPostSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Confira os campos destacados.',
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  const data = parsed.data;

  const post = await prisma.post.create({
    data: {
      authorId: user.id,
      type: data.type,
      caption: data.caption,
      plantId: data.plantId,
      stage: data.stage,
      city: data.city,
      state: data.state,
      allowComments: data.allowComments,
      images: {
        create: data.imageIds.map((url, index) => ({
          url,
          alt: `Foto ${index + 1} da publicação de ${user.name ?? 'um membro'}`,
          position: index,
        })),
      },
      tags: { create: data.tags.map((tag) => ({ tag })) },
    },
    select: { id: true },
  });

  revalidatePath('/feed');
  return { ok: true, postId: post.id };
}

export async function toggleLikeAction(
  postId: string,
): Promise<{ ok: boolean; active: boolean; message?: string }> {
  try {
    const user = await assertPermission('post:react');

    const existing = await prisma.reaction.findFirst({
      where: { userId: user.id, postId },
      select: { id: true },
    });

    if (existing) {
      await prisma.reaction.delete({ where: { id: existing.id } });
      return { ok: true, active: false };
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    await prisma.reaction.create({ data: { userId: user.id, postId } });

    if (post && post.authorId !== user.id) {
      await notificarSemRepetir({
        userId: post.authorId,
        type: 'LIKE',
        title: `${user.name ?? 'Alguém'} gostou da sua publicação`,
        linkUrl: `/feed?publicacao=${postId}`,
      });
    }

    return { ok: true, active: true };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, active: false, message: error.message };
    }
    throw error;
  }
}

export async function toggleSavePostAction(
  postId: string,
): Promise<{ ok: boolean; active: boolean; message?: string }> {
  try {
    const user = await assertPermission('post:save');

    const existing = await prisma.savedItem.findFirst({
      where: { userId: user.id, postId },
      select: { id: true },
    });

    if (existing) {
      await prisma.savedItem.delete({ where: { id: existing.id } });
      revalidatePath('/salvos');
      return { ok: true, active: false };
    }

    await prisma.savedItem.create({
      data: { userId: user.id, kind: 'POST', postId },
    });
    revalidatePath('/salvos');
    return { ok: true, active: true };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, active: false, message: error.message };
    }
    throw error;
  }
}

export async function createCommentAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  let user;
  try {
    user = await assertPermission('post:comment');
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { status: 'error', message: error.message };
    }
    throw error;
  }

  const parsed = createCommentSchema.safeParse({
    postId: formData.get('postId'),
    parentId: formData.get('parentId') || null,
    body: formData.get('body'),
  });

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Confira o comentário.',
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  const post = await prisma.post.findUnique({
    where: { id: parsed.data.postId },
    select: { id: true, authorId: true, allowComments: true, status: true },
  });

  if (!post || post.status !== 'PUBLISHED') {
    return { status: 'error', message: 'Publicação não encontrada.' };
  }

  // A decisão do autor vale também no servidor, não só na interface.
  if (!post.allowComments) {
    return {
      status: 'error',
      message: 'Comentários desativados pelo autor.',
    };
  }

  // Uma resposta só é aceita se o comentário respondido existir e pertencer
  // a esta mesma publicação — senão daria para pendurar resposta em qualquer
  // lugar mandando um identificador de fora.
  let respondido: { authorId: string } | null = null;

  if (parsed.data.parentId) {
    respondido = await prisma.comment.findFirst({
      where: {
        id: parsed.data.parentId,
        postId: post.id,
        status: 'PUBLISHED',
        parentId: null,
      },
      select: { authorId: true },
    });

    if (!respondido) {
      return {
        status: 'error',
        message: 'O comentário que você quer responder não está mais disponível.',
      };
    }
  }

  await prisma.comment.create({
    data: {
      postId: post.id,
      authorId: user.id,
      parentId: respondido ? parsed.data.parentId : null,
      body: parsed.data.body,
    },
  });

  const jaAvisados = new Set<string>([user.id]);

  // Quem teve o comentário respondido é avisado primeiro: para essa pessoa a
  // resposta é mais relevante do que o aviso genérico da publicação.
  if (respondido && !jaAvisados.has(respondido.authorId)) {
    jaAvisados.add(respondido.authorId);
    await prisma.notification.create({
      data: {
        userId: respondido.authorId,
        type: 'REPLY',
        title: `${user.name ?? 'Alguém'} respondeu ao seu comentário`,
        body: parsed.data.body.slice(0, 140),
        linkUrl: `/feed?publicacao=${post.id}`,
      },
    });
  }

  if (!jaAvisados.has(post.authorId)) {
    await prisma.notification.create({
      data: {
        userId: post.authorId,
        type: 'COMMENT',
        title: `${user.name ?? 'Alguém'} comentou na sua publicação`,
        body: parsed.data.body.slice(0, 140),
        linkUrl: `/feed?publicacao=${post.id}`,
      },
    });
  }

  revalidatePath('/feed');
  return { status: 'success', message: 'Comentário publicado.' };
}

export async function setPostCommentsAction(
  postId: string,
  allow: boolean,
): Promise<{ ok: boolean; message: string }> {
  try {
    const user = await assertPermission('post:create');

    const post = await prisma.post.findFirst({
      where: { id: postId, authorId: user.id },
      select: { id: true },
    });

    if (!post) {
      return { ok: false, message: 'Publicação não encontrada.' };
    }

    await prisma.post.update({
      where: { id: postId },
      data: { allowComments: allow },
    });

    revalidatePath('/feed');
    return {
      ok: true,
      message: allow ? 'Comentários liberados.' : 'Comentários desativados.',
    };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, message: error.message };
    }
    throw error;
  }
}

/**
 * Apaga um comentário.
 *
 * O autor apaga o que escreveu; o moderador esconde o que não deveria estar
 * no ar. São coisas diferentes e ficam registradas como tais — por isso o
 * estado gravado não é o mesmo, e só a ação da moderação gera registro.
 *
 * Nada é removido do banco: o comentário sai da vista, mas o histórico
 * permanece, que é o que permite auditar uma decisão depois.
 */
export async function deleteCommentAction(
  commentId: string,
): Promise<{ ok: boolean; message?: string }> {
  try {
    const user = await assertPermission('post:comment');

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, authorId: true, postId: true, status: true },
    });

    if (!comment || comment.status !== 'PUBLISHED') {
      return { ok: false, message: 'Comentário não encontrado.' };
    }

    const isOwner = comment.authorId === user.id;
    const isModerator = can(user.role, 'moderation:hide_content');

    if (!isOwner && !isModerator) {
      throw new AuthorizationError();
    }

    await prisma.comment.update({
      where: { id: commentId },
      data: {
        status: isOwner ? 'REMOVED_BY_AUTHOR' : 'HIDDEN_BY_MODERATION',
      },
    });

    if (!isOwner) {
      await prisma.moderationAction.create({
        data: {
          moderatorId: user.id,
          targetType: 'Comment',
          targetId: commentId,
          action: 'hide',
        },
      });
    }

    revalidatePath('/feed');
    revalidatePath('/comunidade');

    return {
      ok: true,
      message: isOwner ? 'Comentário apagado.' : 'Comentário ocultado.',
    };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, message: error.message };
    }
    throw error;
  }
}

export async function deletePostAction(postId: string): Promise<void> {
  const user = await assertPermission('post:create');

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });

  const isOwner = post?.authorId === user.id;
  const isModerator = can(user.role, 'moderation:hide_content');

  if (!post || (!isOwner && !isModerator)) {
    throw new AuthorizationError();
  }

  await prisma.post.update({
    where: { id: postId },
    data: {
      status: isOwner ? 'REMOVED_BY_AUTHOR' : 'HIDDEN_BY_MODERATION',
    },
  });

  if (!isOwner) {
    await prisma.moderationAction.create({
      data: {
        moderatorId: user.id,
        targetType: 'Post',
        targetId: postId,
        action: 'hide',
      },
    });
  }

  revalidatePath('/feed');
  redirect('/feed');
}

export async function createReportAction(
  payload: unknown,
): Promise<{ ok: boolean; message: string }> {
  try {
    const user = await assertPermission('report:create');

    const parsed = createReportSchema.safeParse(payload);
    if (!parsed.success) {
      return { ok: false, message: 'Escolha um motivo para a denúncia.' };
    }

    await prisma.report.create({
      data: { reporterId: user.id, ...parsed.data },
    });

    revalidatePath('/admin/denuncias');
    return {
      ok: true,
      message: 'Denúncia registrada. A equipe de moderação vai avaliar.',
    };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, message: error.message };
    }
    throw error;
  }
}
