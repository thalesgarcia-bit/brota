import { z } from 'zod';

export const POST_TYPES = [
  {
    value: 'MY_PLANT',
    label: 'Minha planta',
    description: 'Um registro do dia a dia da sua planta.',
  },
  {
    value: 'BEFORE_AFTER',
    label: 'Antes e depois',
    description: 'Mostre a evolução ao longo do tempo.',
  },
  {
    value: 'TIP',
    label: 'Dica',
    description: 'Conhecimento que você quer compartilhar.',
  },
  {
    value: 'QUESTION',
    label: 'Dúvida',
    description: 'Peça ajuda para a comunidade.',
  },
  {
    value: 'IDENTIFICATION',
    label: 'Identificação',
    description: 'Alguém pode saber que espécie é essa.',
  },
  {
    value: 'ACHIEVEMENT',
    label: 'Conquista',
    description: 'Floração, brotação, fruto — comemore.',
  },
] as const;

export const postTypeEnum = z.enum([
  'MY_PLANT',
  'BEFORE_AFTER',
  'TIP',
  'QUESTION',
  'IDENTIFICATION',
  'ACHIEVEMENT',
]);

const tagSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9à-ü]+$/, 'Use apenas letras e números nas tags.')
  .min(2)
  .max(30);

export const createPostSchema = z.object({
  type: postTypeEnum,
  caption: z
    .string()
    .trim()
    .min(3, 'Escreva ao menos uma frase.')
    .max(2200, 'A legenda pode ter no máximo 2200 caracteres.'),
  plantId: z.string().cuid().nullable().default(null),
  stage: z.string().trim().max(60).nullable().default(null),
  city: z.string().trim().max(80).nullable().default(null),
  state: z.string().trim().max(2).nullable().default(null),
  allowComments: z.boolean().default(true),
  tags: z.array(tagSchema).max(8, 'No máximo 8 tags.').default([]),
  imageIds: z
    .array(z.string().min(1))
    .min(1, 'Adicione ao menos uma foto.')
    .max(6, 'No máximo 6 fotos por publicação.'),
});

export const updatePostSchema = createPostSchema
  .partial()
  .extend({ id: z.string().cuid() });

export const createCommentSchema = z.object({
  postId: z.string().cuid(),
  parentId: z.string().cuid().nullable().default(null),
  body: z
    .string()
    .trim()
    .min(1, 'Escreva um comentário.')
    .max(1000, 'O comentário pode ter no máximo 1000 caracteres.'),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
