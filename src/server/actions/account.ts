'use server';

import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { signIn } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { hashPassword } from '@/lib/auth/password';
import { requireUser } from '@/lib/auth/session';
import { credentialsSchema, signUpSchema } from '@/lib/validation/auth';
import { updateProfileSchema } from '@/lib/validation/profile';

/* ===========================================================================
 * AÇÕES DE CONTA
 * Toda validação acontece aqui, no servidor — o formulário valida também, mas
 * apenas para dar retorno rápido ao usuário.
 * =========================================================================== */

export type FormState = {
  status: 'idle' | 'error' | 'success';
  message?: string;
  fieldErrors?: Record<string, string>;
};

export const INITIAL_FORM_STATE: FormState = { status: 'idle' };

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

export async function signUpAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = signUpSchema.safeParse({
    displayName: formData.get('displayName'),
    username: formData.get('username'),
    email: formData.get('email'),
    password: formData.get('password'),
    passwordConfirmation: formData.get('passwordConfirmation'),
    acceptedTerms: formData.get('acceptedTerms') === 'on',
  });

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Confira os campos destacados.',
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const { email, username, displayName, password } = parsed.data;

  const [existingEmail, existingUsername] = await Promise.all([
    prisma.user.findUnique({ where: { email }, select: { id: true } }),
    prisma.profile.findUnique({ where: { username }, select: { id: true } }),
  ]);

  if (existingEmail) {
    return {
      status: 'error',
      message: 'Esse e-mail já tem uma conta.',
      fieldErrors: { email: 'Já existe uma conta com esse e-mail.' },
    };
  }

  if (existingUsername) {
    return {
      status: 'error',
      message: 'Escolha outro nome de usuário.',
      fieldErrors: { username: 'Esse nome de usuário já está em uso.' },
    };
  }

  const passwordHash = await hashPassword(password);

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: 'USER',
      profile: { create: { username, displayName } },
      collections: {
        create: [
          { name: 'Favoritas', slug: 'favoritas', isDefault: true },
          { name: 'Quero ter', slug: 'quero-ter', isDefault: true },
        ],
      },
      consents: {
        create: [
          { kind: 'terms', granted: true, version: '2026-09' },
          { kind: 'privacy', granted: true, version: '2026-09' },
        ],
      },
    },
  });

  // Entra automaticamente e segue para o questionário do Perfil Verde.
  await signIn('credentials', {
    email,
    password,
    redirect: false,
  });

  redirect('/onboarding');
}

export async function signInAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Confira os campos destacados.',
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const nextPath = String(formData.get('proximo') ?? '') || '/feed';
  const safeNext = nextPath.startsWith('/') && !nextPath.startsWith('//')
    ? nextPath
    : '/feed';

  try {
    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // Mensagem propositalmente genérica: não revelamos se o e-mail existe.
      return {
        status: 'error',
        message: 'E-mail ou senha incorretos.',
      };
    }

    // Qualquer outra falha é problema nosso, não do usuário. Antes isto
    // derrubava a página inteira e o log só mostrava código minificado.
    // Registrar nome, mensagem e pilha é o que permite descobrir a causa.
    const detail = error instanceof Error ? error : new Error(String(error));
    console.error(
      '[entrar] falha inesperada no login:',
      detail.name,
      '|',
      detail.message,
      '|',
      detail.stack,
    );

    return {
      status: 'error',
      message:
        'Não conseguimos concluir a entrada agora. Tente novamente em instantes.',
    };
  }

  redirect(safeNext);
}

export async function updateProfileAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();

  const parsed = updateProfileSchema.safeParse({
    displayName: formData.get('displayName'),
    username: formData.get('username'),
    bio: formData.get('bio') || null,
    city: formData.get('city') || null,
    state: formData.get('state') || null,
    showLocation: formData.get('showLocation') === 'on',
    isPublic: formData.get('isPublic') === 'on',
    experienceLevel: formData.get('experienceLevel') || 'NONE',
    avatarUrl: formData.get('avatarUrl') || null,
  });

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Confira os campos destacados.',
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const taken = await prisma.profile.findFirst({
    where: { username: parsed.data.username, userId: { not: user.id } },
    select: { id: true },
  });

  if (taken) {
    return {
      status: 'error',
      message: 'Escolha outro nome de usuário.',
      fieldErrors: { username: 'Esse nome de usuário já está em uso.' },
    };
  }

  await prisma.profile.update({
    where: { userId: user.id },
    data: parsed.data,
  });

  revalidatePath('/configuracoes');
  revalidatePath(`/perfil/${parsed.data.username}`);

  return { status: 'success', message: 'Perfil atualizado.' };
}
