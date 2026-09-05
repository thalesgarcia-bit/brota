import { z } from 'zod';
import { usernameSchema } from '@/lib/validation/auth';

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(2, 'Informe seu nome.').max(60),
  username: usernameSchema,
  bio: z.string().trim().max(280, 'A bio pode ter até 280 caracteres.').nullable().default(null),
  city: z.string().trim().max(80).nullable().default(null),
  state: z.string().trim().max(2).nullable().default(null),
  showLocation: z.boolean().default(false),
  isPublic: z.boolean().default(true),
  experienceLevel: z
    .enum(['NONE', 'BEGINNER', 'INTERMEDIATE', 'EXPERIENCED'])
    .default('NONE'),
  avatarUrl: z.string().max(500).nullable().default(null),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
