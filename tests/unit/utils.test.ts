import { describe, expect, it } from 'vitest';

import { cn } from '@/lib/utils/cn';
import { coarsenCoordinate, haversineMeters } from '@/lib/utils/geo';
import { isReservedUsername, normalizeSearch, slugify } from '@/lib/utils/slug';
import { formatDistanceMeters, formatList, pluralize } from '@/lib/utils/format';

describe('slug', () => {
  it('remove acentos e normaliza', () => {
    expect(slugify('Costela-de-Adão')).toBe('costela-de-adao');
    expect(slugify('  Flor de Maio  ')).toBe('flor-de-maio');
    expect(slugify('Espada de São Jorge')).toBe('espada-de-sao-jorge');
  });

  it('não deixa hífens duplicados nem nas pontas', () => {
    expect(slugify('--Jiboia//verde--')).toBe('jiboiaverde');
  });

  it('normaliza termos de busca', () => {
    expect(normalizeSearch('Jibóia')).toBe('jiboia');
    expect(normalizeSearch('  MONSTERA  ')).toBe('monstera');
  });

  it('bloqueia nomes de usuário reservados', () => {
    expect(isReservedUsername('admin')).toBe(true);
    expect(isReservedUsername('Brota')).toBe(true);
    expect(isReservedUsername('denise')).toBe(false);
  });
});

describe('geo', () => {
  it('calcula distâncias plausíveis', () => {
    // Uberaba (MG) até Uberlândia (MG): cerca de 100 km em linha reta.
    const distance = haversineMeters(
      { lat: -19.7472, lon: -47.9381 },
      { lat: -18.9186, lon: -48.2772 },
    );
    expect(distance).toBeGreaterThan(90_000);
    expect(distance).toBeLessThan(110_000);
  });

  it('devolve zero para o mesmo ponto', () => {
    const point = { lat: -19.7472, lon: -47.9381 };
    expect(haversineMeters(point, point)).toBeCloseTo(0, 5);
  });

  it('reduz a precisão da coordenada para proteger a localização', () => {
    expect(coarsenCoordinate(-19.747233)).toBe(-19.75);
    expect(coarsenCoordinate(-47.938122)).toBe(-47.94);
  });
});

describe('formatação', () => {
  it('formata distâncias em português', () => {
    expect(formatDistanceMeters(450)).toBe('450 m');
    expect(formatDistanceMeters(1500)).toBe('1,5 km');
  });

  it('monta listas legíveis', () => {
    expect(formatList(['sol'])).toBe('sol');
    expect(formatList(['sol', 'sombra'])).toBe('sol e sombra');
    expect(formatList(['sol', 'sombra', 'vento'])).toBe('sol, sombra e vento');
  });

  it('pluraliza', () => {
    expect(pluralize(1, 'planta', 'plantas')).toBe('planta');
    expect(pluralize(2, 'planta', 'plantas')).toBe('plantas');
  });
});

describe('cn', () => {
  it('descarta valores falsos e resolve objetos', () => {
    expect(cn('a', false, undefined, 'b')).toBe('a b');
    expect(cn('a', { b: true, c: false })).toBe('a b');
    expect(cn(['a', ['b', 'c']])).toBe('a b c');
  });
});
