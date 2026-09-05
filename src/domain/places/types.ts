/* ===========================================================================
 * CAMADA DE LUGARES ("Onde comprar")
 *
 * A aplicação não conhece o OpenStreetMap: conhece esta interface. Trocar por
 * Google Places ou por uma base própria é implementar outro adapter.
 *
 * Regra do projeto: nenhum estabelecimento é inventado. Se o provedor não
 * estiver configurado ou não devolver nada, a interface diz exatamente isso.
 * =========================================================================== */

export type PlaceCategory =
  | 'florist'
  | 'garden_centre'
  | 'plant_nursery'
  | 'doityourself'
  | 'market';

export type Place = {
  id: string;
  name: string;
  category: PlaceCategory;
  latitude: number;
  longitude: number;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  website: string | null;
  openingHours: string | null;
  /** Metros a partir do ponto consultado. */
  distanceMeters: number | null;
  /** Origem do dado, exibida como crédito na interface. */
  attribution: string;
};

export type PlaceSearchInput = {
  latitude: number;
  longitude: number;
  /** Raio em metros. */
  radius: number;
  categories?: PlaceCategory[];
  limit?: number;
};

export type GeocodeResult = {
  displayName: string;
  latitude: number;
  longitude: number;
  city: string | null;
  state: string | null;
};

export interface PlacesProvider {
  readonly name: string;
  readonly attribution: string;
  isConfigured(): boolean;
  search(input: PlaceSearchInput): Promise<Place[]>;
  geocode(query: string): Promise<GeocodeResult[]>;
}

export type PlacesErrorCode =
  | 'not_configured'
  | 'network'
  | 'rate_limited'
  | 'unexpected_response'
  | 'unknown';

export class PlacesError extends Error {
  readonly code: PlacesErrorCode;

  constructor(code: PlacesErrorCode, message: string) {
    super(message);
    this.name = 'PlacesError';
    this.code = code;
  }
}

export const PLACES_ERROR_MESSAGES: Record<PlacesErrorCode, string> = {
  not_configured:
    'O mapa ainda não foi configurado neste ambiente. Defina PLACES_PROVIDER no arquivo .env.',
  network:
    'Não conseguimos carregar os estabelecimentos agora. Verifique sua conexão e tente novamente.',
  rate_limited:
    'O serviço de mapas está recebendo muitas consultas no momento. Tente novamente em alguns segundos.',
  unexpected_response:
    'O serviço de mapas respondeu de forma inesperada. Tente novamente.',
  unknown: 'Algo deu errado ao buscar os estabelecimentos.',
};

export const PLACE_CATEGORY_LABELS: Record<PlaceCategory, string> = {
  florist: 'Floricultura',
  garden_centre: 'Garden center',
  plant_nursery: 'Viveiro',
  doityourself: 'Loja de jardinagem',
  market: 'Feira ou mercado',
};
