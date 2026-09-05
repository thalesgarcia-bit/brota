import { z } from 'zod';

/** Campos do modelo Plant que a comunidade pode sugerir alterar. */
export const SUGGESTABLE_FIELDS = [
  { value: 'commonNames', label: 'Nomes populares' },
  { value: 'description', label: 'Descrição' },
  { value: 'substrate', label: 'Substrato' },
  { value: 'fertilization', label: 'Adubação' },
  { value: 'pruning', label: 'Poda' },
  { value: 'propagation', label: 'Propagação' },
  { value: 'flowering', label: 'Floração' },
  { value: 'commonProblems', label: 'Problemas comuns' },
  { value: 'commonPests', label: 'Pragas comuns' },
  { value: 'commonMistakes', label: 'Erros frequentes' },
  { value: 'curiosity', label: 'Curiosidade' },
  { value: 'toxicityNote', label: 'Observação sobre toxicidade' },
  { value: 'regional', label: 'Característica regional' },
] as const;

export const createSuggestionSchema = z.object({
  plantId: z.string().cuid(),
  field: z.string().min(1, 'Escolha o que você quer sugerir.'),
  suggestedValue: z
    .string()
    .trim()
    .min(5, 'Descreva sua sugestão.')
    .max(3000),
  justification: z.string().trim().max(1000).nullable().default(null),
  sourceUrl: z
    .string()
    .trim()
    .url('Informe uma URL válida ou deixe em branco.')
    .nullable()
    .or(z.literal(''))
    .transform((value) => (value === '' ? null : value))
    .default(null),
});

export const reviewSuggestionSchema = z.object({
  id: z.string().cuid(),
  decision: z.enum(['APPROVED', 'REJECTED']),
  reviewNote: z.string().trim().max(1000).nullable().default(null),
  applyToPlant: z.boolean().default(false),
});

export const REPORT_REASONS = [
  { value: 'SPAM', label: 'Spam' },
  { value: 'OFFENSIVE', label: 'Conteúdo ofensivo' },
  { value: 'DANGEROUS_INFORMATION', label: 'Informação potencialmente perigosa' },
  { value: 'INAPPROPRIATE', label: 'Conteúdo inadequado' },
  { value: 'COPYRIGHT', label: 'Direitos autorais' },
  { value: 'OTHER', label: 'Outro' },
] as const;

export const createReportSchema = z.object({
  targetType: z.enum(['POST', 'COMMENT', 'USER']),
  targetId: z.string().cuid(),
  reason: z.enum([
    'SPAM',
    'OFFENSIVE',
    'DANGEROUS_INFORMATION',
    'INAPPROPRIATE',
    'COPYRIGHT',
    'OTHER',
  ]),
  details: z.string().trim().max(1000).nullable().default(null),
});

export const handleReportSchema = z.object({
  id: z.string().cuid(),
  decision: z.enum(['RESOLVED', 'DISMISSED']),
  action: z.enum(['none', 'hide_content', 'remove_content']).default('none'),
  resolution: z.string().trim().max(1000).nullable().default(null),
});

export type CreateSuggestionInput = z.infer<typeof createSuggestionSchema>;
export type CreateReportInput = z.infer<typeof createReportSchema>;
