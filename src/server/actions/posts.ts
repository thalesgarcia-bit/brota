'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { prisma } from '@/lib/db/prisma';
import { assertPermission, AuthorizationError } from '@/lib/auth/session';
import { can } from '@/lib/auth/rbac';
import { createCommentSchema, createPostSchema } from '@/lib/validation/post';
import { createReportSchema } from '@/lib/validation/community';
import type { FormState } from './account';

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
      await prisma.notification.create({
        data: {
          userId: post.authorId,
          type: 'LIKE',
          title: `${user.name ?? 'Alguém'} gostou da sua publicação`,
          linkUrl: `/feed?publicacao=${postId}`,
        },
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

  await prisma.comment.create({
    data: {
      postId: post.id,
      authorId: user.id,
      parentId: parsed.data.parentId,
      body: parsed.data.body,
    },
  });

  if (post.authorId !== user.id) {
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
