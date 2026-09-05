import 'server-only';

import { serverEnv } from '@/lib/env';
import { OpenStreetMapPlacesProvider } from './osm';
import { PlacesError, type PlacesProvider } from './types';

export * from './types';

let cached: PlacesProvider | null = null;

export function getPlacesProvider(): PlacesProvider {
  if (cached) return cached;

  const env = serverEnv();

  if (env.PLACES_PROVIDER === 'osm') {
    cached = new OpenStreetMapPlacesProvider({
      overpassUrl: env.OVERPASS_API_URL,
      nominatimUrl: env.NOMINATIM_API_URL,
      userAgent: env.OSM_USER_AGENT,
    });
    return cached;
  }

  throw new PlacesError('not_configured', 'Nenhum provedor de mapas configurado.');
}
