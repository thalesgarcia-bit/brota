import { z } from 'zod';

/**
 * Validação das variáveis de ambiente no arranque.
 * Falhar aqui é melhor do que falhar em produção com um valor ausente.
 */

const booleanish = z
  .enum(['true', 'false', '1', '0', ''])
  .transform((value) => value === 'true' || value === '1');

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),

  AUTH_SECRET: z
    .string()
    .min(16, 'AUTH_SECRET precisa ter ao menos 16 caracteres'),
  AUTH_URL: z.string().url().optional(),
  AUTH_TRUST_HOST: booleanish.default('true'),

  PLANT_ID_PROVIDER: z.enum(['plantnet', 'none']).default('none'),
  PLANTNET_API_KEY: z.string().default(''),
  PLANTNET_PROJECT: z.string().default('all'),
  PLANT_ID_CONFIDENCE_THRESHOLD: z.coerce.number().min(0).max(1).default(0.35),
  PLANT_ID_ALLOW_MOCK: booleanish.default('false'),

  PLACES_PROVIDER: z.enum(['osm', 'none']).default('osm'),
  OVERPASS_API_URL: z.string().url().default('https://overpass-api.de/api/interpreter'),
  NOMINATIM_API_URL: z.string().url().default('https://nominatim.openstreetmap.org'),
  OSM_USER_AGENT: z.string().default('BROTA/0.1'),

  STORAGE_PROVIDER: z.enum(['local', 'supabase']).default('local'),
  STORAGE_LOCAL_DIR: z.string().default('./public/uploads'),
  STORAGE_PUBLIC_PREFIX: z.string().default('/uploads'),
  MAX_UPLOAD_MB: z.coerce.number().int().positive().max(50).default(8),

  SUPABASE_URL: z.string().default(''),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default(''),
  SUPABASE_STORAGE_BUCKET: z.string().default('brota'),

  SEED_ADMIN_EMAIL: z.string().email().default('admin@brota.local'),
  SEED_ADMIN_PASSWORD: z.string().min(8).default('brota-admin-2026'),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
});

type ServerEnv = z.infer<typeof serverSchema>;
type ClientEnv = z.infer<typeof clientSchema>;

function parseServerEnv(): ServerEnv {
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(
      `Variáveis de ambiente inválidas ou ausentes:\n${issues}\n\n` +
        'Copie o arquivo .env.example para .env.local e preencha os valores.',
    );
  }
  return parsed.data;
}

let cachedServerEnv: ServerEnv | null = null;

/** Somente para código que roda no servidor. */
export function serverEnv(): ServerEnv {
  cachedServerEnv ??= parseServerEnv();
  return cachedServerEnv;
}

export const clientEnv: ClientEnv = clientSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

/**
 * Estado de configuração dos serviços externos.
 * A interface usa isto para dizer a verdade ao usuário em vez de simular.
 */
export type IntegrationStatus = {
  configured: boolean;
  provider: string;
  reason?: string;
};

export function plantIdentificationStatus(): IntegrationStatus {
  const env = serverEnv();
  if (env.PLANT_ID_PROVIDER === 'none') {
    return {
      configured: false,
      provider: 'none',
      reason: 'Nenhum provedor de identificação configurado.',
    };
  }
  if (env.PLANT_ID_PROVIDER === 'plantnet' && !env.PLANTNET_API_KEY) {
    return {
      configured: false,
      provider: 'plantnet',
      reason: 'A chave PLANTNET_API_KEY não foi definida.',
    };
  }
  return { configured: true, provider: env.PLANT_ID_PROVIDER };
}

export function placesStatus(): IntegrationStatus {
  const env = serverEnv();
  if (env.PLACES_PROVIDER === 'none') {
    return {
      configured: false,
      provider: 'none',
      reason: 'Nenhum provedor de mapas configurado.',
    };
  }
  return { configured: true, provider: env.PLACES_PROVIDER };
}
