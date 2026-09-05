import { z } from 'zod';

import { haversineMeters } from '@/lib/utils/geo';
import {
  PLACE_CATEGORY_LABELS,
  PlacesError,
  type GeocodeResult,
  type Place,
  type PlaceCategory,
  type PlaceSearchInput,
  type PlacesProvider,
} from './types';

/* ===========================================================================
 * ADAPTER — OpenStreetMap (Overpass + Nominatim)
 *
 * Dados reais, colaborativos e sem chave de API. Em contrapartida, os endpoints
 * públicos têm limite de uso: em produção com volume, aponte OVERPASS_API_URL
 * para uma instância própria.
 * =========================================================================== */

const overpassElementSchema = z
  .object({
    type: z.string(),
    id: z.number(),
    lat: z.number().optional(),
    lon: z.number().optional(),
    center: z.object({ lat: z.number(), lon: z.number() }).optional(),
    tags: z.record(z.string()).optional(),
  })
  .passthrough();

const overpassResponseSchema = z
  .object({ elements: z.array(overpassElementSchema) })
  .passthrough();

const nominatimItemSchema = z
  .object({
    display_name: z.string(),
    lat: z.string(),
    lon: z.string(),
    address: z.record(z.string()).optional(),
  })
  .passthrough();

const CATEGORY_FILTERS: Record<PlaceCategory, string[]> = {
  florist: ['["shop"="florist"]'],
  garden_centre: ['["shop"="garden_centre"]'],
  plant_nursery: ['["landuse"="plant_nursery"]', '["shop"="nursery"]'],
  doityourself: ['["shop"="doityourself"]["garden_centre"="yes"]'],
  market: ['["amenity"="marketplace"]'],
};

const DEFAULT_CATEGORIES: PlaceCategory[] = [
  'florist',
  'garden_centre',
  'plant_nursery',
];

export type OsmProviderOptions = {
  overpassUrl: string;
  nominatimUrl: string;
  userAgent: string;
};

export class OpenStreetMapPlacesProvider implements PlacesProvider {
  readonly name = 'osm';
  readonly attribution = '© colaboradores do OpenStreetMap';

  private readonly options: OsmProviderOptions;

  constructor(options: OsmProviderOptions) {
    this.options = options;
  }

  isConfigured(): boolean {
    return Boolean(this.options.overpassUrl && this.options.nominatimUrl);
  }

  async search(input: PlaceSearchInput): Promise<Place[]> {
    const categories = input.categories?.length
      ? input.categories
      : DEFAULT_CATEGORIES;
    const radius = Math.min(Math.max(input.radius, 500), 50_000);

    const clauses = categories
      .flatMap((category) => CATEGORY_FILTERS[category])
      .flatMap((filter) => [
        `node${filter}(around:${radius},${input.latitude},${input.longitude});`,
        `way${filter}(around:${radius},${input.latitude},${input.longitude});`,
      ])
      .join('\n  ');

    const query = `[out:json][timeout:25];\n(\n  ${clauses}\n);\nout center tags ${
      input.limit ?? 60
    };`;

    let response: Response;
    try {
      response = await fetch(this.options.overpassUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': this.options.userAgent,
        },
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(30_000),
        next: { revalidate: 60 * 30 },
      });
    } catch (error) {
      throw new PlacesError(
        'network',
        `Falha ao consultar o Overpass: ${(error as Error).message}`,
      );
    }

    if (response.status === 429 || response.status === 504) {
      throw new PlacesError('rate_limited', 'Overpass ocupado no momento.');
    }
    if (!response.ok) {
      throw new PlacesError('unknown', `Overpass respondeu ${response.status}.`);
    }

    const parsed = overpassResponseSchema.safeParse(await response.json());
    if (!parsed.success) {
      throw new PlacesError(
        'unexpected_response',
        'Formato inesperado na resposta do Overpass.',
      );
    }

    const origin = { lat: input.latitude, lon: input.longitude };

    return parsed.data.elements
      .map((element) => toPlace(element, origin, this.attribution))
      .filter((place): place is Place => place !== null)
      .sort(
        (a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity),
      );
  }

  async geocode(query: string): Promise<GeocodeResult[]> {
    const url = new URL('/search', this.options.nominatimUrl);
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('limit', '5');
    url.searchParams.set('accept-language', 'pt-BR');
    url.searchParams.set('countrycodes', 'br');

    let response: Response;
    try {
      response = await fetch(url, {
        headers: { 'User-Agent': this.options.userAgent },
        signal: AbortSignal.timeout(15_000),
        next: { revalidate: 60 * 60 * 24 },
      });
    } catch (error) {
      throw new PlacesError(
        'network',
        `Falha ao consultar o Nominatim: ${(error as Error).message}`,
      );
    }

    if (response.status === 429) {
      throw new PlacesError('rate_limited', 'Nominatim ocupado no momento.');
    }
    if (!response.ok) {
      throw new PlacesError('unknown', `Nominatim respondeu ${response.status}.`);
    }

    const parsed = z.array(nominatimItemSchema).safeParse(await response.json());
    if (!parsed.success) {
      throw new PlacesError(
        'unexpected_response',
        'Formato inesperado na resposta do Nominatim.',
      );
    }

    return parsed.data.map((item) => ({
      displayName: item.display_name,
      latitude: Number(item.lat),
      longitude: Number(item.lon),
      city:
        item.address?.city ??
        item.address?.town ??
        item.address?.village ??
        item.address?.municipality ??
        null,
      state: item.address?.state ?? null,
    }));
  }
}

function toPlace(
  element: z.infer<typeof overpassElementSchema>,
  origin: { lat: number; lon: number },
  attribution: string,
): Place | null {
  const tags = element.tags ?? {};
  const latitude = element.lat ?? element.center?.lat;
  const longitude = element.lon ?? element.center?.lon;

  if (latitude === undefined || longitude === undefined) return null;

  const category = detectCategory(tags);
  if (!category) return null;

  const name = tags['name']?.trim();
  // Sem nome não há o que mostrar ao usuário — descartamos em vez de inventar.
  if (!name) return null;

  const street = tags['addr:street'];
  const number = tags['addr:housenumber'];
  const address = street ? [street, number].filter(Boolean).join(', ') : null;

  return {
    id: `${element.type}/${element.id}`,
    name,
    category,
    latitude,
    longitude,
    address,
    city: tags['addr:city'] ?? null,
    state: tags['addr:state'] ?? null,
    phone: tags['phone'] ?? tags['contact:phone'] ?? null,
    website: tags['website'] ?? tags['contact:website'] ?? null,
    openingHours: tags['opening_hours'] ?? null,
    distanceMeters: Math.round(
      haversineMeters(origin, { lat: latitude, lon: longitude }),
    ),
    attribution,
  };
}

function detectCategory(tags: Record<string, string>): PlaceCategory | null {
  if (tags['shop'] === 'florist') return 'florist';
  if (tags['shop'] === 'garden_centre') return 'garden_centre';
  if (tags['shop'] === 'nursery' || tags['landuse'] === 'plant_nursery') {
    return 'plant_nursery';
  }
  if (tags['shop'] === 'doityourself') return 'doityourself';
  if (tags['amenity'] === 'marketplace') return 'market';
  return null;
}

export { PLACE_CATEGORY_LABELS };
