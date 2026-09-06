import 'server-only';

import { serverEnv } from '@/lib/env';
import { LocalStorageProvider } from './local';
import { SupabaseStorageProvider } from './supabase';
import type { StorageProvider } from './types';

export * from './types';
export { assertValidImage, detectImageMime } from './validate';

let cached: StorageProvider | null = null;

/**
 * Resolve o armazenamento ativo.
 *
 * Nenhuma página conhece o adapter concreto — trocar Supabase por S3, R2 ou
 * outro serviço é escrever uma classe nova aqui dentro.
 */
export function getStorageProvider(): StorageProvider {
  if (cached) return cached;

  const env = serverEnv();

  if (env.STORAGE_PROVIDER === 'supabase') {
    cached = new SupabaseStorageProvider({
      url: env.SUPABASE_URL,
      serviceKey: env.SUPABASE_SERVICE_ROLE_KEY,
      bucket: env.SUPABASE_STORAGE_BUCKET,
    });
    return cached;
  }

  cached = new LocalStorageProvider({
    baseDir: env.STORAGE_LOCAL_DIR,
    publicPrefix: env.STORAGE_PUBLIC_PREFIX,
  });

  return cached;
}

export function maxUploadBytes(): number {
  return serverEnv().MAX_UPLOAD_MB * 1024 * 1024;
}

/** Estado do armazenamento, exibido no painel administrativo. */
export function storageStatus(): {
  configured: boolean;
  provider: string;
  reason?: string;
} {
  const env = serverEnv();

  if (env.STORAGE_PROVIDER === 'supabase') {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return {
        configured: false,
        provider: 'supabase',
        reason:
          'Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para que as fotos sejam guardadas.',
      };
    }
    return { configured: true, provider: 'supabase' };
  }

  return {
    configured: true,
    provider: 'local',
    reason:
      'As fotos estão sendo gravadas no disco do servidor. Isso funciona na sua máquina, mas no site publicado elas são apagadas a cada atualização — use o Supabase em produção.',
  };
}
