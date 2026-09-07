'use server';

import { randomUUID } from 'node:crypto';
import { redirect } from 'next/navigation';

import { prisma } from '@/lib/db/prisma';
import { signOut } from '@/lib/auth';
import { requireUser } from '@/lib/auth/session';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import {
  changePasswordSchema,
  deleteAccountSchema,
} from '@/lib/validation/auth';
import type { FormState } from './form-state';

function fieldErrorsFrom(error: {
  issues: { path: (string | number)[]; message: string }[];
}): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    result[key] ??= issue.message;
  }
  return result;
}

export async function changePasswordAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const sessionUser = await requireUser('/configuracoes');

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    password: formData.get('password'),
    passwordConfirmation: formData.get('passwordConfirmation'),
  });

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Confira os campos destacados.',
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { passwordHash: true },
  });

  const valid = await verifyPassword(
    parsed.data.currentPassword,
    user?.passwordHash,
  );

  if (!valid) {
    return {
      status: 'error',
      message: 'A senha atual não confere.',
      fieldErrors: { currentPassword: 'Senha incorreta.' },
    };
  }

  await prisma.user.update({
    where: { id: sessionUser.id },
    data: { passwordHash: await hashPassword(parsed.data.password) },
  });

  await prisma.auditLog.create({
    data: {
      actorId: sessionUser.id,
      action: 'password.change',
      entityType: 'User',
      entityId: sessionUser.id,
    },
  });

  return { status: 'success', message: 'Senha alterada.' };
}

/**
 * Exclusão de conta (LGPD).
 *
 * Removemos todos os dados pessoais e o conteúdo produzido pela pessoa.
 * O registro do usuário permanece anonimizado apenas para preservar a
 * integridade referencial de registros de auditoria — sem nenhum dado que
 * permita identificá-la.
 */
export async function deleteAccountAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const sessionUser = await requireUser('/configuracoes');

  const parsed = deleteAccountSchema.safeParse({
    confirmation: formData.get('confirmation'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Confira os campos destacados.',
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { passwordHash: true },
  });

  const valid = await verifyPassword(parsed.data.password, user?.passwordHash);
  if (!valid) {
    return {
      status: 'error',
      message: 'A senha não confere.',
      fieldErrors: { password: 'Senha incorreta.' },
    };
  }

  const anonymousId = randomUUID();

  await prisma.$transaction([
    // Conteúdo produzido pela pessoa
    prisma.post.deleteMany({ where: { authorId: sessionUser.id } }),
    prisma.comment.deleteMany({ where: { authorId: sessionUser.id } }),
    prisma.reaction.deleteMany({ where: { userId: sessionUser.id } }),
    prisma.savedItem.deleteMany({ where: { userId: sessionUser.id } }),
    prisma.collection.deleteMany({ where: { userId: sessionUser.id } }),
    prisma.userPlant.deleteMany({ where: { userId: sessionUser.id } }),
    prisma.identificationRequest.deleteMany({ where: { userId: sessionUser.id } }),
    prisma.notification.deleteMany({ where: { userId: sessionUser.id } }),
    prisma.recommendation.deleteMany({ where: { userId: sessionUser.id } }),
    prisma.recommendationFeedback.deleteMany({ where: { userId: sessionUser.id } }),
    prisma.greenProfile.deleteMany({ where: { userId: sessionUser.id } }),
    prisma.profile.deleteMany({ where: { userId: sessionUser.id } }),
    prisma.session.deleteMany({ where: { userId: sessionUser.id } }),
    prisma.account.deleteMany({ where: { userId: sessionUser.id } }),
    prisma.consentRecord.deleteMany({ where: { userId: sessionUser.id } }),

    // Anonimização do registro remanescente
    prisma.user.update({
      where: { id: sessionUser.id },
      data: {
        email: `excluido-${anonymousId}@brota.invalid`,
        passwordHash: null,
        emailVerified: null,
        deletedAt: new Date(),
      },
    }),

    prisma.auditLog.create({
      data: {
        action: 'account.delete',
        entityType: 'User',
        entityId: sessionUser.id,
      },
    }),
  ]);

  await signOut({ redirect: false });
  redirect('/?conta=excluida');
}
