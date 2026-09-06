import { describe, expect, it } from 'vitest';

import {
  compatibilityLabel,
  CRITERION_WEIGHTS,
  rankPlantsForProfile,
  scorePlantForProfile,
} from '@/domain/recommendation/engine';
import type {
  GreenProfileSnapshot,
  PlantSnapshot,
} from '@/domain/recommendation/types';

/* ===========================================================================
 * O motor de recomendação é o coração do produto. Estes testes existem para
 * garantir que ele continue coerente e — sobretudo — que nunca deixe de avisar
 * sobre toxicidade.
 * =========================================================================== */

const apartmentProfile: GreenProfileSnapshot = {
  placements: ['INDOOR', 'WINDOW'],
  light: 'BRIGHT_INDIRECT',
  lightUnsure: false,
  careTime: 'WEEKLY',
  experience: 'BEGINNER',
  goals: ['decoracao'],
  preferences: ['folhagens'],
  hasDogs: false,
  hasCats: false,
  hasSmallKids: false,
  climate: 'MILD',
  space: 'SMALL',
};

function makePlant(overrides: Partial<PlantSnapshot> = {}): PlantSnapshot {
  return {
    id: 'plant-1',
    slug: 'planta-teste',
    scientificName: 'Testus plantus',
    primaryCommonName: 'Planta de teste',
    light: 'BRIGHT_INDIRECT',
    water: 'LOW',
    humidity: 'MEDIUM',
    size: 'SMALL',
    growthRate: 'MODERATE',
    difficulty: 'EASY',
    tempMinC: 10,
    tempMaxC: 32,
    toxicityHumans: 'NONE',
    toxicityDogs: 'NONE',
    toxicityCats: 'NONE',
    isNative: false,
    environments: ['INDOOR', 'WINDOW'],
    categorySlugs: ['folhagens'],
    hasFlowering: false,
    ...overrides,
  };
}

describe('pontuação', () => {
  it('dá nota alta para a espécie que casa com o perfil', () => {
    const result = scorePlantForProfile(apartmentProfile, makePlant());
    expect(result.score).toBeGreaterThanOrEqual(90);
  });

  it('mantém a pontuação entre 0 e 100', () => {
    const bad = scorePlantForProfile(
      apartmentProfile,
      makePlant({
        light: 'FULL_SUN',
        water: 'HIGH',
        size: 'LARGE',
        difficulty: 'HARD',
        environments: ['GARDEN'],
        categorySlugs: ['cactos'],
        toxicityCats: 'SEVERE',
        toxicityDogs: 'SEVERE',
      }),
    );

    expect(bad.score).toBeGreaterThanOrEqual(0);
    expect(bad.score).toBeLessThanOrEqual(100);
  });

  it('penaliza mais a falta de luz do que o excesso', () => {
    const tooLittle = scorePlantForProfile(
      { ...apartmentProfile, light: 'LOW_LIGHT' },
      makePlant({ light: 'PARTIAL_SUN' }),
    );
    const tooMuch = scorePlantForProfile(
      { ...apartmentProfile, light: 'PARTIAL_SUN' },
      makePlant({ light: 'LOW_LIGHT' }),
    );

    expect(tooMuch.score).toBeGreaterThan(tooLittle.score);
  });

  it('rebaixa espécies exigentes para quem tem pouco tempo', () => {
    const lowMaintenance = scorePlantForProfile(
      apartmentProfile,
      makePlant({ water: 'VERY_LOW' }),
    );
    const thirsty = scorePlantForProfile(
      apartmentProfile,
      makePlant({ water: 'HIGH' }),
    );

    expect(lowMaintenance.score).toBeGreaterThan(thirsty.score);
  });
});

describe('explicação', () => {
  it('nunca devolve uma recomendação sem motivo', () => {
    const results = [
      scorePlantForProfile(apartmentProfile, makePlant()),
      scorePlantForProfile(
        apartmentProfile,
        makePlant({
          light: 'FULL_SUN',
          water: 'HIGH',
          size: 'LARGE',
          difficulty: 'HARD',
          environments: ['GARDEN'],
          categorySlugs: [],
        }),
      ),
    ];

    for (const result of results) {
      expect(result.reasons.length).toBeGreaterThan(0);
      for (const reason of result.reasons) {
        expect(reason.trim().length).toBeGreaterThan(10);
      }
    }
  });

  it('descreve todos os oito critérios', () => {
    const result = scorePlantForProfile(apartmentProfile, makePlant());
    expect(result.criteria).toHaveLength(Object.keys(CRITERION_WEIGHTS).length);
    for (const criterion of result.criteria) {
      expect(criterion.explanation.length).toBeGreaterThan(10);
      expect(criterion.score).toBeGreaterThanOrEqual(0);
      expect(criterion.score).toBeLessThanOrEqual(1);
    }
  });

  it('trata luminosidade desconhecida como critério neutro, não como erro', () => {
    const result = scorePlantForProfile(
      { ...apartmentProfile, light: null, lightUnsure: true },
      makePlant(),
    );
    const light = result.criteria.find((item) => item.key === 'light');
    expect(light?.score).toBeGreaterThan(0.5);
    expect(light?.score).toBeLessThan(1);
  });
});

describe('segurança botânica', () => {
  it('avisa sobre toxicidade mesmo quando o usuário não tem animais', () => {
    const result = scorePlantForProfile(
      apartmentProfile,
      makePlant({ toxicityCats: 'SEVERE' }),
    );
    expect(result.warnings.some((w) => w.message.includes('gatos'))).toBe(true);
  });

  it('derruba a pontuação de espécie tóxica em casa com gatos', () => {
    const plant = makePlant({ toxicityCats: 'SEVERE' });
    const withoutCats = scorePlantForProfile(apartmentProfile, plant);
    const withCats = scorePlantForProfile(
      { ...apartmentProfile, hasCats: true },
      plant,
    );

    expect(withCats.score).toBeLessThan(withoutCats.score * 0.5);
    expect(withCats.warnings.some((w) => w.severity === 'danger')).toBe(true);
  });

  it('declara a informação não confirmada em vez de omitir', () => {
    const result = scorePlantForProfile(
      { ...apartmentProfile, hasDogs: true },
      makePlant({ toxicityDogs: 'UNKNOWN' }),
    );
    expect(
      result.warnings.some((w) => w.message.includes('não confirmada')),
    ).toBe(true);
  });

  it('não gera aviso para espécie comprovadamente não tóxica', () => {
    const result = scorePlantForProfile(
      { ...apartmentProfile, hasCats: true, hasDogs: true, hasSmallKids: true },
      makePlant(),
    );
    expect(result.warnings).toHaveLength(0);
  });
});

describe('ordenação', () => {
  it('ordena da maior para a menor compatibilidade', () => {
    const plants = [
      makePlant({ id: 'a', slug: 'a', light: 'FULL_SUN', size: 'LARGE' }),
      makePlant({ id: 'b', slug: 'b' }),
      makePlant({ id: 'c', slug: 'c', water: 'HIGH', difficulty: 'HARD' }),
    ];

    const ranked = rankPlantsForProfile(apartmentProfile, plants);

    expect(ranked[0]?.plant.id).toBe('b');
    for (let index = 1; index < ranked.length; index += 1) {
      expect(ranked[index - 1]!.score).toBeGreaterThanOrEqual(ranked[index]!.score);
    }
  });

  it('respeita o limite pedido', () => {
    const plants = Array.from({ length: 40 }, (_, index) =>
      makePlant({ id: `p${index}`, slug: `p${index}` }),
    );
    expect(rankPlantsForProfile(apartmentProfile, plants, { limit: 5 })).toHaveLength(5);
  });
});

describe('rótulo de compatibilidade', () => {
  it('traduz o percentual em linguagem comum', () => {
    expect(compatibilityLabel(95).tone).toBe('excellent');
    expect(compatibilityLabel(75).tone).toBe('good');
    expect(compatibilityLabel(55).tone).toBe('fair');
    expect(compatibilityLabel(20).tone).toBe('low');
  });
});
