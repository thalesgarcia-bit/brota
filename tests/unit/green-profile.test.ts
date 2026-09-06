import { describe, expect, it } from 'vitest';

import { computeGreenProfile } from '@/domain/recommendation/green-profile';
import type { OnboardingInput } from '@/lib/validation/onboarding';

function answers(overrides: Partial<OnboardingInput> = {}): OnboardingInput {
  return {
    housing: 'APARTMENT',
    placements: ['INDOOR'],
    placementsUnsure: false,
    light: 'BRIGHT_INDIRECT',
    lightUnsure: false,
    careTime: 'WEEKLY',
    experience: 'BEGINNER',
    goals: ['decoracao'],
    preferences: [],
    hasDogs: false,
    hasCats: false,
    hasOtherPets: false,
    hasSmallKids: false,
    climate: 'MILD',
    space: 'SMALL',
    ...overrides,
  };
}

describe('perfil verde', () => {
  it('reconhece o jardineiro de apartamento', () => {
    const profile = computeGreenProfile(answers());
    expect(profile.key).toBe('jardineiro-de-apartamento');
    expect(profile.label).toBe('Jardineiro de Apartamento');
  });

  it('reconhece quem quer horta com área externa', () => {
    const profile = computeGreenProfile(
      answers({
        housing: 'HOUSE',
        placements: ['GARDEN', 'OUTDOOR'],
        goals: ['horta'],
      }),
    );
    expect(profile.key).toBe('horticultor-de-quintal');
  });

  it('reconhece a horta de janela', () => {
    const profile = computeGreenProfile(
      answers({ placements: ['WINDOW'], goals: ['temperos'] }),
    );
    expect(profile.key).toBe('horta-de-janela');
  });

  it('reconhece quem está começando do zero', () => {
    const profile = computeGreenProfile(
      answers({
        housing: 'HOUSE',
        placements: ['BALCONY'],
        careTime: 'MINIMAL',
        experience: 'NONE',
      }),
    );
    expect(profile.key).toBe('primeiro-broto');
  });

  it('sempre devolve um resumo em linguagem comum', () => {
    const profile = computeGreenProfile(answers({ lightUnsure: true, light: null }));
    expect(profile.summary).toContain('descobrindo');
    expect(profile.summary.endsWith('.')).toBe(true);
  });
});
