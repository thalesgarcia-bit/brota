import { z } from 'zod';

/* ===========================================================================
 * CONTEÚDO EDUCATIVO
 *
 * As regras vivem aqui e valem nos dois lados: o formulário usa para avisar
 * cedo, o servidor usa para decidir. A exigência que muda de peso conforme o
 * estado — texto longo o bastante para publicar — está no refinamento final,
 * porque um rascunho pode e deve poder ficar pela metade.
 * =========================================================================== */

export const ARTICLE_STATUS = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;

export const articleSchema = z
  .object({
    id: z.string().min(1).nullable().optional(),

    slug: z
      .string()
      .min(3, 'O endereço precisa de ao menos 3 caracteres.')
      .max(80, 'O endereço ficou longo demais.')
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Use apenas letras minúsculas, números e hífens.',
      ),

    title: z
      .string()
      .trim()
      .min(4, 'O título precisa de ao menos 4 caracteres.')
      .max(140, 'O título ficou longo demais.'),

    excerpt: z
      .string()
      .trim()
      .min(20, 'O resumo precisa de ao menos 20 caracteres.')
      .max(400, 'O resumo ficou longo demais — ele é uma chamada, não a matéria.'),

    body: z.string().trim().min(1, 'O conteúdo não pode ficar vazio.'),

    category: z
      .string()
      .trim()
      .min(3, 'Escolha ou escreva uma categoria.')
      .max(60, 'A categoria ficou longa demais.'),

    coverUrl: z
      .string()
      .trim()
      .url('Endereço de imagem inválido.')
      .nullable()
      .optional(),

    readingMinutes: z.coerce
      .number()
      .int('Use um número inteiro de minutos.')
      .min(1, 'O tempo de leitura precisa ser de ao menos 1 minuto.')
      .max(90, 'Acima de 90 minutos, vale dividir em vários conteúdos.'),

    status: z.enum(ARTICLE_STATUS),
  })
  .superRefine((value, ctx) => {
    // Rascunho aceita texto curto; publicado, não. Publicar é afirmar que
    // aquilo está pronto para ser lido por alguém.
    if (value.status === 'PUBLISHED' && value.body.length < 200) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['body'],
        message:
          'Para publicar, o conteúdo precisa de pelo menos 200 caracteres. Salve como rascunho enquanto escreve.',
      });
    }
  });

export type ArticleInput = z.infer<typeof articleSchema>;
