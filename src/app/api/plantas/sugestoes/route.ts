import { NextResponse } from 'next/server';

import { suggestPlants } from '@/server/services/plants';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const term = new URL(request.url).searchParams.get('q') ?? '';

  if (term.trim().length < 2) {
    return NextResponse.json([], {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const results = await suggestPlants(term.slice(0, 60));

  return NextResponse.json(results, {
    headers: { 'Cache-Control': 'public, max-age=60' },
  });
}
