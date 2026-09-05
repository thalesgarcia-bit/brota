import type { OnboardingInput } from '@/lib/validation/onboarding';
import type { GreenProfileSnapshot } from './types';

/* ===========================================================================
 * PERFIL VERDE
 * Traduz as respostas do onboarding em um retrato curto e humano do usuário.
 * O rótulo não é enfeite: ele resume, em uma frase, o que o motor levou em conta.
 * =========================================================================== */

export type GreenProfileResult = {
  key: string;
  label: string;
  summary: string;
};

const LIGHT_PHRASES = {
  FULL_SUN: 'sol direto durante boa parte do dia',
  PARTIAL_SUN: 'algumas horas de sol direto',
  BRIGHT_INDIRECT: 'boa claridade indireta',
  LOW_LIGHT: 'pouca luz natural',
} as const;

const SPACE_PHRASES = {
  TINY: 'muito pouco espaço',
  SMALL: 'pouco espaço',
  MEDIUM: 'espaço médio',
  LARGE: 'bastante espaço',
} as const;

const CARE_PHRASES = {
  DAILY: 'consegue cuidar todos os dias',
  FEW_TIMES_WEEK: 'cuida algumas vezes por semana',
  WEEKLY: 'cuida uma vez por semana',
  MINIMAL: 'prefere espécies de baixa manutenção',
} as const;

export function computeGreenProfile(answers: OnboardingInput): GreenProfileResult {
  const { housing, placements, careTime, experience, space, light, lightUnsure } =
    answers;

  const isIndoorOnly =
    placements.length > 0 &&
    placements.every((placement) =>
      ['INDOOR', 'WINDOW', 'OFFICE_BEDROOM'].includes(placement),
    );
  const hasOutdoor = placements.some((placement) =>
    ['OUTDOOR', 'GARDEN'].includes(placement),
  );
  const wantsFood = answers.goals.some((goal) =>
    ['horta', 'temperos', 'aromaticas'].includes(goal),
  );
  const lowMaintenance = careTime === 'MINIMAL' || careTime === 'WEEKLY';

  let key = 'cultivador-curioso';
  let label = 'Cultivador Curioso';

  if (wantsFood && hasOutdoor) {
    key = 'horticultor-de-quintal';
    label = 'Horticultor de Quintal';
  } else if (wantsFood) {
    key = 'horta-de-janela';
    label = 'Horta de Janela';
  } else if (housing === 'APARTMENT' && isIndoorOnly) {
    key = 'jardineiro-de-apartamento';
    label = 'Jardineiro de Apartamento';
  } else if (housing === 'FARM' || (hasOutdoor && space === 'LARGE')) {
    key = 'guardiao-de-jardim';
    label = 'Guardião de Jardim';
  } else if (lowMaintenance && experience === 'NONE') {
    key = 'primeiro-broto';
    label = 'Primeiro Broto';
  } else if (experience === 'EXPERIENCED') {
    key = 'colecionador-verde';
    label = 'Colecionador Verde';
  } else if (isIndoorOnly) {
    key = 'jardineiro-de-interiores';
    label = 'Jardineiro de Interiores';
  }

  const lightPhrase = lightUnsure || light === null
    ? 'ainda está descobrindo a luz do seu espaço'
    : `tem ${LIGHT_PHRASES[light]}`;

  const parts = [
    `Você ${lightPhrase}`,
    `${SPACE_PHRASES[space]}`,
    `e ${CARE_PHRASES[careTime]}`,
  ];

  const summary = `${parts.join(', ')}.`;

  return { key, label, summary };
}

/** Converte o registro persistido no recorte que o motor consome. */
export function toSnapshot(profile: {
  placements: GreenProfileSnapshot['placements'];
  light: GreenProfileSnapshot['light'];
  lightUnsure: boolean;
  careTime: GreenProfileSnapshot['careTime'];
  experience: GreenProfileSnapshot['experience'];
  goals: string[];
  preferences: string[];
  hasDogs: boolean;
  hasCats: boolean;
  hasSmallKids: boolean;
  climate: GreenProfileSnapshot['climate'];
  space: GreenProfileSnapshot['space'];
}): GreenProfileSnapshot {
  return {
    placements: profile.placements,
    light: profile.light,
    lightUnsure: profile.lightUnsure,
    careTime: profile.careTime,
    experience: profile.experience,
    goals: profile.goals,
    preferences: profile.preferences,
    hasDogs: profile.hasDogs,
    hasCats: profile.hasCats,
    hasSmallKids: profile.hasSmallKids,
    climate: profile.climate,
    space: profile.space,
  };
}
