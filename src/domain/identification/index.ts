import 'server-only';

import { serverEnv } from '@/lib/env';
import { MockIdentificationProvider } from './mock';
import { PlantNetProvider } from './plantnet';
import {
  IdentificationError,
  type PlantIdentificationProvider,
} from './types';

export * from './types';

let cached: PlantIdentificationProvider | null = null;

/**
 * Resolve o provedor ativo a partir da configuração.
 * Nenhuma página conhece o provedor concreto — apenas esta função.
 */
export function getPlantIdentificationProvider(): PlantIdentificationProvider {
  if (cached) return cached;

  const env = serverEnv();

  if (env.PLANT_ID_PROVIDER === 'plantnet' && env.PLANTNET_API_KEY) {
    cached = new PlantNetProvider({
      apiKey: env.PLANTNET_API_KEY,
      project: env.PLANTNET_PROJECT,
      language: 'pt',
    });
    return cached;
  }

  if (env.PLANT_ID_ALLOW_MOCK && env.NODE_ENV !== 'production') {
    cached = new MockIdentificationProvider();
    return cached;
  }

  throw new IdentificationError(
    'not_configured',
    'Nenhum provedor de identificação configurado.',
  );
}

export function identificationThreshold(): number {
  return serverEnv().PLANT_ID_CONFIDENCE_THRESHOLD;
}

/** Linguagem de probabilidade — nunca de certeza. */
export function confidencePhrase(score: number, name: string): string {
  if (score >= 0.7) return `Provavelmente é uma ${name}`;
  if (score >= 0.45) return `Pode ser uma ${name}`;
  return `A espécie mais compatível parece ser ${name}`;
}
