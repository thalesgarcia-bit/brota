import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getPlacesProvider, PlacesError, PLACES_ERROR_MESSAGES } from '@/domain/places';

export const runtime = 'nodejs';

const searchSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  raio: z.coerce.number().int().min(500).max(50_000).default(5000),
  categorias: z.string().optional(),
});

const geocodeSchema = z.object({
  endereco: z.string().min(2).max(120),
});

/**
 * Consulta de estabelecimentos e geocodificação.
 * A chamada ao provedor externo acontece no servidor: o navegador do usuário
 * nunca fala direto com a Overpass, o que protege a política de uso e permite
 * cache do lado do servidor.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  try {
    const provider = getPlacesProvider();

    if (params.has('endereco')) {
      const parsed = geocodeSchema.safeParse({ endereco: params.get('endereco') });
      if (!parsed.success) {
        return NextResponse.json({ error: 'Busca inválida.' }, { status: 400 });
      }
      const results = await provider.geocode(parsed.data.endereco);
      return NextResponse.json({ results });
    }

    const parsed = searchSchema.safeParse({
      lat: params.get('lat'),
      lon: params.get('lon'),
      raio: params.get('raio') ?? undefined,
      categorias: params.get('categorias') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Informe uma localização válida.' },
        { status: 400 },
      );
    }

    const categories = parsed.data.categorias
      ? (parsed.data.categorias.split(',').filter(Boolean) as never[])
      : undefined;

    const places = await provider.search({
      latitude: parsed.data.lat,
      longitude: parsed.data.lon,
      radius: parsed.data.raio,
      ...(categories ? { categories } : {}),
    });

    return NextResponse.json(
      { places, attribution: provider.attribution },
      { headers: { 'Cache-Control': 'public, max-age=600' } },
    );
  } catch (error) {
    if (error instanceof PlacesError) {
      const status =
        error.code === 'not_configured'
          ? 503
          : error.code === 'rate_limited'
            ? 429
            : 502;
      return NextResponse.json(
        { error: PLACES_ERROR_MESSAGES[error.code], code: error.code },
        { status },
      );
    }
    throw error;
  }
}
