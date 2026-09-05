import { z } from 'zod';

export const PLANT_ORGANS = [
  { value: 'leaf', label: 'Folha' },
  { value: 'flower', label: 'Flor' },
  { value: 'fruit', label: 'Fruto' },
  { value: 'bark', label: 'Casca ou tronco' },
  { value: 'habit', label: 'Planta inteira' },
  { value: 'auto', label: 'Não sei dizer' },
] as const;

export const identifyRequestSchema = z.object({
  imageUrl: z.string().min(1, 'Envie uma foto.'),
  organ: z
    .enum(['leaf', 'flower', 'fruit', 'bark', 'habit', 'auto'])
    .default('auto'),
  note: z.string().trim().max(500).nullable().default(null),
});

export const escalateIdentificationSchema = z.object({
  requestId: z.string().cuid(),
  note: z.string().trim().max(500).nullable().default(null),
});

export const resolveIdentificationSchema = z.object({
  requestId: z.string().cuid(),
  action: z.enum([
    'link_existing',
    'request_new_photo',
    'mark_inadequate',
    'close',
    'start_review',
  ]),
  plantId: z.string().cuid().nullable().default(null),
  adminNotes: z.string().trim().max(1000).nullable().default(null),
});

export type IdentifyRequestInput = z.infer<typeof identifyRequestSchema>;
