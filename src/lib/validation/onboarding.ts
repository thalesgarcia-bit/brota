import { z } from 'zod';

/**
 * Questionário do Perfil Verde.
 * Cada campo alimenta diretamente um critério do motor de recomendação —
 * nenhuma pergunta existe apenas para preencher tela.
 */

export const onboardingSchema = z.object({
  housing: z.enum(['HOUSE', 'APARTMENT', 'FARM', 'OTHER'], {
    errorMap: () => ({ message: 'Escolha onde você mora.' }),
  }),
  placements: z
    .array(
      z.enum([
        'INDOOR',
        'OUTDOOR',
        'BALCONY',
        'GARDEN',
        'WINDOW',
        'OFFICE_BEDROOM',
      ]),
    )
    .min(1, 'Escolha ao menos um lugar.'),
  placementsUnsure: z.boolean().default(false),
  light: z
    .enum(['FULL_SUN', 'PARTIAL_SUN', 'BRIGHT_INDIRECT', 'LOW_LIGHT'])
    .nullable(),
  lightUnsure: z.boolean().default(false),
  careTime: z.enum(['DAILY', 'FEW_TIMES_WEEK', 'WEEKLY', 'MINIMAL'], {
    errorMap: () => ({ message: 'Escolha com que frequência você consegue cuidar.' }),
  }),
  experience: z.enum(['NONE', 'BEGINNER', 'INTERMEDIATE', 'EXPERIENCED'], {
    errorMap: () => ({ message: 'Escolha seu nível de experiência.' }),
  }),
  goals: z.array(z.string().min(1)).min(1, 'Escolha ao menos um objetivo.').max(10),
  preferences: z.array(z.string().min(1)).max(12).default([]),
  hasDogs: z.boolean().default(false),
  hasCats: z.boolean().default(false),
  hasOtherPets: z.boolean().default(false),
  hasSmallKids: z.boolean().default(false),
  climate: z.enum(['HOT', 'MILD', 'COLD', 'DRY', 'HUMID', 'UNSURE']).default('UNSURE'),
  space: z.enum(['TINY', 'SMALL', 'MEDIUM', 'LARGE'], {
    errorMap: () => ({ message: 'Escolha o tamanho do espaço.' }),
  }),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

/** Objetivos e preferências são listas fechadas, versionadas aqui. */
export const GOAL_OPTIONS = [
  { value: 'decoracao', label: 'Decoração' },
  { value: 'flores', label: 'Flores' },
  { value: 'aromaticas', label: 'Plantas aromáticas' },
  { value: 'horta', label: 'Horta' },
  { value: 'temperos', label: 'Temperos' },
  { value: 'plantas-grandes', label: 'Plantas grandes' },
  { value: 'plantas-pequenas', label: 'Plantas pequenas' },
  { value: 'ornamental', label: 'Puramente ornamental' },
  { value: 'aprender', label: 'Aprender jardinagem' },
  { value: 'biodiversidade', label: 'Biodiversidade' },
] as const;

export const PREFERENCE_OPTIONS = [
  { value: 'folhagens', label: 'Folhagens' },
  { value: 'flores', label: 'Flores' },
  { value: 'cactos', label: 'Cactos' },
  { value: 'suculentas', label: 'Suculentas' },
  { value: 'trepadeiras', label: 'Trepadeiras' },
  { value: 'ervas', label: 'Ervas' },
  { value: 'frutiferas', label: 'Frutíferas' },
  { value: 'nativas', label: 'Plantas nativas' },
  { value: 'sem-preferencia', label: 'Sem preferência' },
] as const;
