import { z } from 'zod';

export const createUserPlantSchema = z
  .object({
    nickname: z
      .string()
      .trim()
      .min(1, 'Dê um nome ou apelido para a planta.')
      .max(60),
    plantId: z.string().cuid().nullable().default(null),
    customSpeciesName: z.string().trim().max(120).nullable().default(null),
    photoUrl: z.string().max(500).nullable().default(null),
    acquiredAt: z.coerce.date().nullable().default(null),
    location: z.string().trim().max(80).nullable().default(null),
    lightExposure: z
      .enum(['FULL_SUN', 'PARTIAL_SUN', 'BRIGHT_INDIRECT', 'LOW_LIGHT'])
      .nullable()
      .default(null),
    notes: z.string().trim().max(2000).nullable().default(null),
  })
  .refine((data) => data.plantId !== null || Boolean(data.customSpeciesName), {
    message: 'Escolha uma espécie da base ou escreva o nome da sua planta.',
    path: ['plantId'],
  });

export const updateUserPlantSchema = z.object({
  id: z.string().cuid(),
  nickname: z.string().trim().min(1).max(60).optional(),
  plantId: z.string().cuid().nullable().optional(),
  customSpeciesName: z.string().trim().max(120).nullable().optional(),
  photoUrl: z.string().max(500).nullable().optional(),
  acquiredAt: z.coerce.date().nullable().optional(),
  location: z.string().trim().max(80).nullable().optional(),
  lightExposure: z
    .enum(['FULL_SUN', 'PARTIAL_SUN', 'BRIGHT_INDIRECT', 'LOW_LIGHT'])
    .nullable()
    .optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const DIARY_ENTRY_TYPES = [
  { value: 'WATERING', label: 'Rega', icon: 'droplet' },
  { value: 'FERTILIZING', label: 'Adubação', icon: 'sparkle' },
  { value: 'PRUNING', label: 'Poda', icon: 'scissors' },
  { value: 'REPOTTING', label: 'Troca de vaso', icon: 'pot' },
  { value: 'RELOCATION', label: 'Mudança de ambiente', icon: 'move' },
  { value: 'FLOWERING', label: 'Floração', icon: 'flower' },
  { value: 'NEW_LEAF', label: 'Nova folha', icon: 'leaf' },
  { value: 'PEST', label: 'Praga', icon: 'alert' },
  { value: 'PHOTO', label: 'Foto', icon: 'camera' },
  { value: 'NOTE', label: 'Observação', icon: 'note' },
] as const;

export const createDiaryEntrySchema = z.object({
  userPlantId: z.string().cuid(),
  type: z.enum([
    'WATERING',
    'FERTILIZING',
    'PRUNING',
    'REPOTTING',
    'RELOCATION',
    'FLOWERING',
    'NEW_LEAF',
    'PEST',
    'PHOTO',
    'NOTE',
  ]),
  note: z.string().trim().max(1000).nullable().default(null),
  photoUrl: z.string().max(500).nullable().default(null),
  occurredAt: z.coerce.date().default(() => new Date()),
});

export const reminderSchema = z.object({
  userPlantId: z.string().cuid(),
  kind: z.enum(['WATERING', 'FERTILIZING', 'PRUNING', 'REPOTTING', 'CHECKUP']),
  enabled: z.boolean(),
  intervalDays: z.coerce.number().int().min(1).max(365),
  preferredHour: z.coerce.number().int().min(0).max(23).default(9),
});

export type CreateUserPlantInput = z.infer<typeof createUserPlantSchema>;
export type CreateDiaryEntryInput = z.infer<typeof createDiaryEntrySchema>;
