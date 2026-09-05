import { z } from 'zod';
import { isReservedUsername } from '@/lib/utils/slug';

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Informe seu e-mail.')
  .email('Esse e-mail não parece válido.')
  .max(254)
  .transform((value) => value.toLowerCase());

export const passwordSchema = z
  .string()
  .min(8, 'A senha precisa ter ao menos 8 caracteres.')
  .max(72, 'A senha pode ter no máximo 72 caracteres.')
  .refine((value) => /[a-zA-Z]/.test(value), {
    message: 'Inclua ao menos uma letra.',
  })
  .refine((value) => /[0-9]/.test(value), {
    message: 'Inclua ao menos um número.',
  });

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'O nome de usuário precisa ter ao menos 3 caracteres.')
  .max(24, 'O nome de usuário pode ter no máximo 24 caracteres.')
  .regex(
    /^[a-z0-9_.]+$/,
    'Use apenas letras minúsculas, números, ponto e sublinhado.',
  )
  .refine((value) => !isReservedUsername(value), {
    message: 'Esse nome de usuário não está disponível.',
  });

export const credentialsSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Informe sua senha.'),
});

export const signUpSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(2, 'Informe como quer ser chamado.')
      .max(60),
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    passwordConfirmation: z.string(),
    acceptedTerms: z.literal(true, {
      errorMap: () => ({
        message: 'É preciso aceitar os termos e a política de privacidade.',
      }),
    }),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: 'As senhas não coincidem.',
    path: ['passwordConfirmation'],
  });

export const requestPasswordResetSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10),
    password: passwordSchema,
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: 'As senhas não coincidem.',
    path: ['passwordConfirmation'],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual.'),
    password: passwordSchema,
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: 'As senhas não coincidem.',
    path: ['passwordConfirmation'],
  });

export const deleteAccountSchema = z.object({
  confirmation: z.literal('EXCLUIR', {
    errorMap: () => ({ message: 'Digite EXCLUIR para confirmar.' }),
  }),
  password: z.string().min(1, 'Confirme com sua senha.'),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type CredentialsInput = z.infer<typeof credentialsSchema>;
