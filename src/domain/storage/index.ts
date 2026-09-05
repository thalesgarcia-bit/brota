import 'server-only';

import { serverEnv } from '@/lib/env';
import { LocalStorageProvider } from './local';
import type { StorageProvider } from './types';

export * from './types';
export { assertValidImage, detectImageMime } from './validate';

let cached: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (cached) return cached;

  const env = serverEnv();

  cached = new LocalStorageProvider({
    baseDir: env.STORAGE_LOCAL_DIR,
    publicPrefix: env.STORAGE_PUBLIC_PREFIX,
  });

  return cached;
}

export function maxUploadBytes(): number {
  return serverEnv().MAX_UPLOAD_MB * 1024 * 1024;
}
