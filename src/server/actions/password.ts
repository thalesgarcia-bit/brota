'use server';

import { randomBytes, createHash } from 'node:crypto';
import { redirect } from 'next/navigation';

import { prisma } from '@/lib/db/prisma';
import { hashPassword } from '@/lib/auth/password';
import { getMailProvider } from '@/domain/mail';
import { clientEnv } from '@/lib/env';
import {
  requestPasswordResetSchema,
  resetPasswordSchema,
} from '@/lib/validation/auth';
import type { FormState } from './account';

const TOKEN_TTL_MINUTES = 60;

/** Guardamos apenas o hash do token: um vazamento do banco não permite reset. */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function requestPasswordResetAction(
  formData: FormData,
): Promise<void> {
  const parsed = requestPasswordResetSchema.safeParse({
    email: formData.get('email'),
  });

  // A resposta é sempre a mesma, com ou sem conta: não revelamos quem existe.
  if (parsed.success) {
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true, deletedAt: true },
    });

    if (user && !user.deletedAt) {
      const token = randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);

      await prisma.verificationToken.deleteMany({
        where: { identifier: parsed.data.email },
      });

      await prisma.verificationToken.create({
        data: {
          identifier: parsed.data.email,
          token: hashToken(token),
          expires,
        },
      });

      const link = `${clientEnv.NEXT_PUBLIC_SITE_URL}/redefinir-senha?token=${token}&e=${encodeURIComponent(parsed.data.email)}`;

      await getMailProvider().send({
        to: parsed.data.email,
        subject: 'Redefinir sua senha no BROTA',
        text:
          `Você pediu para redefinir a senha da sua conta no BROTA.\n\n` +
          `Use este link (válido por ${TOKEN_TTL_MINUTES} minutos):\n${link}\n\n` +
          `Se não foi você, pode ignorar esta mensagem.`,
      });
    }
  }

  redirect('/recuperar-senha?enviado=1');
}

export async function resetPasswordAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get('token'),
    password: formData.get('password'),
    passwordConfirmation: formData.get('passwordConfirmation'),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? 'form');
      fieldErrors[key] ??= issue.message;
    }
    return { status: 'error', message: 'Confira os campos.', fieldErrors };
  }

  const email = String(formData.get('email') ?? '').toLowerCase();

  const record = await prisma.verificationToken.findUnique({
    where: { token: hashToken(parsed.data.token) },
  });

  if (!record || record.identifier !== email || record.expires < new Date()) {
    return {
      status: 'error',
      message:
        'Esse link de recuperação não é mais válido. Peça um novo para continuar.',
    };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  await prisma.$transaction([
    prisma.user.update({ where: { email }, data: { passwordHash } }),
    prisma.verificationToken.deleteMany({ where: { identifier: email } }),
    // Sessões antigas continuam válidas via JWT até expirarem; registramos a
    // troca para auditoria.
    prisma.auditLog.create({
      data: {
        action: 'password.reset',
        entityType: 'User',
        entityId: email,
      },
    }),
  ]);

  redirect('/entrar?senha=redefinida');
}
