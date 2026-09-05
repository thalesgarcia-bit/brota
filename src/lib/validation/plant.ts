import { z } from 'zod';

const lightEnum = z.enum(['FULL_SUN', 'PARTIAL_SUN', 'BRIGHT_INDIRECT', 'LOW_LIGHT']);
const waterEnum = z.enum(['HIGH', 'MODERATE', 'LOW', 'VERY_LOW']);
const humidityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH']);
const sizeEnum = z.enum(['SMALL', 'MEDIUM', 'LARGE']);
const growthEnum = z.enum(['SLOW', 'MODERATE', 'FAST']);
const difficultyEnum = z.enum(['EASY', 'MEDIUM', 'HARD']);
const toxicityEnum = z.enum(['NONE', 'MILD', 'MODERATE', 'SEVERE', 'UNKNOWN']);
const environmentEnum = z.enum([
  'INDOOR',
  'OUTDOOR',
  'BALCONY',
  'GARDEN',
  'WINDOW',
  'OFFICE_BEDROOM',
]);

export const plantSourceSchema = z.object({
  title: z.string().trim().min(2, 'Informe o título da fonte.').max(200),
  url: z.string().url('URL inválida.').nullable().default(null),
  publisher: z.string().trim().max(120).nullable().default(null),
});

export const plantImageSchema = z.object({
  url: z.string().min(1),
  alt: z
    .string()
    .trim()
    .min(3, 'Descreva a imagem para quem usa leitor de tela.')
    .max(200),
  credit: z.string().trim().max(160).nullable().default(null),
  license: z.string().trim().max(80).nullable().default(null),
  sourceUrl: z.string().url().nullable().default(null),
  isPrimary: z.boolean().default(false),
});

export const plantFormSchema = z.object({
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, 'Use apenas letras minúsculas, números e hífen.')
    .min(2)
    .max(80),
  scientificName: z.string().trim().min(3, 'Informe o nome científico.').max(160),
  family: z.string().trim().min(2, 'Informe a família botânica.').max(80),
  genus: z.string().trim().min(2, 'Informe o gênero.').max(80),
  origin: z.string().trim().max(200).nullable().default(null),
  description: z
    .string()
    .trim()
    .min(40, 'A descrição precisa ter ao menos 40 caracteres.')
    .max(4000),

  commonNames: z
    .array(z.string().trim().min(2).max(80))
    .min(1, 'Informe ao menos um nome popular.')
    .max(10),

  light: lightEnum,
  water: waterEnum,
  humidity: humidityEnum,
  tempMinC: z.coerce.number().int().min(-20).max(50).nullable().default(null),
  tempMaxC: z.coerce.number().int().min(-20).max(60).nullable().default(null),
  substrate: z.string().trim().max(1200).nullable().default(null),
  fertilization: z.string().trim().max(1200).nullable().default(null),
  pruning: z.string().trim().max(1200).nullable().default(null),
  propagation: z.string().trim().max(1200).nullable().default(null),
  flowering: z.string().trim().max(1200).nullable().default(null),

  size: sizeEnum,
  growthRate: growthEnum,
  difficulty: difficultyEnum,

  toxicityHumans: toxicityEnum.default('UNKNOWN'),
  toxicityDogs: toxicityEnum.default('UNKNOWN'),
  toxicityCats: toxicityEnum.default('UNKNOWN'),
  toxicityNote: z.string().trim().max(1200).nullable().default(null),

  commonProblems: z.string().trim().max(2000).nullable().default(null),
  commonPests: z.string().trim().max(2000).nullable().default(null),
  commonMistakes: z.string().trim().max(2000).nullable().default(null),
  curiosity: z.string().trim().max(1200).nullable().default(null),

  isNative: z.boolean().default(false),
  isAirPurifying: z.boolean().default(false),

  categorySlugs: z.array(z.string().min(1)).default([]),
  environments: z.array(environmentEnum).min(1, 'Escolha ao menos um ambiente.'),

  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  dataQuality: z
    .enum(['SEED_UNREVIEWED', 'COMMUNITY', 'REVIEWED'])
    .default('SEED_UNREVIEWED'),

  sources: z.array(plantSourceSchema).default([]),
  images: z.array(plantImageSchema).default([]),
});

export const plantFormWithRulesSchema = plantFormSchema
  .refine(
    (data) =>
      data.tempMinC === null ||
      data.tempMaxC === null ||
      data.tempMinC <= data.tempMaxC,
    { message: 'A temperatura mínima não pode ser maior que a máxima.', path: ['tempMinC'] },
  )
  .refine(
    (data) =>
      data.status !== 'PUBLISHED' ||
      data.dataQuality !== 'SEED_UNREVIEWED' ||
      data.sources.length > 0,
    {
      message:
        'Para publicar uma planta é preciso ao menos uma fonte ou marcá-la como revisada.',
      path: ['sources'],
    },
  );

export type PlantFormInput = z.infer<typeof plantFormSchema>;

/** Filtros da página Explorar. Tudo o que vem da URL passa por aqui. */
export const plantSearchSchema = z.object({
  q: z.string().trim().max(80).default(''),
  ambiente: z.array(environmentEnum).default([]),
  luz: z.array(lightEnum).default([]),
  agua: z.array(waterEnum).default([]),
  porte: z.array(sizeEnum).default([]),
  dificuldade: z.array(difficultyEnum).default([]),
  categoria: z.array(z.string().min(1)).default([]),
  petFriendly: z.boolean().default(false),
  criancas: z.boolean().default(false),
  nativas: z.boolean().default(false),
  ordenar: z.enum(['relevancia', 'nome', 'facilidade', 'recentes']).default('relevancia'),
  pagina: z.coerce.number().int().min(1).max(500).default(1),
});

export type PlantSearchInput = z.infer<typeof plantSearchSchema>;
