import type {
  CriterionResult,
  GreenProfileSnapshot,
  PlantSnapshot,
  RecommendationWarning,
  ScoredPlant,
} from './types';

/* ===========================================================================
 * MOTOR DE RECOMENDAÇÃO
 *
 * Camada pura: sem Prisma, sem React, sem acesso à rede. Recebe o Perfil Verde
 * e uma espécie e devolve pontuação ponderada com a explicação de cada critério.
 *
 * Princípio: nenhum percentual é exibido sem o motivo que o produziu.
 * =========================================================================== */

/** Pesos relativos. A soma não precisa ser 100; a normalização é feita no fim. */
export const CRITERION_WEIGHTS = {
  light: 22,
  water: 16,
  experience: 14,
  space: 12,
  environment: 12,
  climate: 8,
  preferences: 10,
  goals: 6,
} as const;

/* --------------------------------------------------------------------------
 * Escalas ordinais
 * ------------------------------------------------------------------------ */

const LIGHT_SCALE = {
  LOW_LIGHT: 0,
  BRIGHT_INDIRECT: 1,
  PARTIAL_SUN: 2,
  FULL_SUN: 3,
} as const;

const WATER_DEMAND = {
  VERY_LOW: 0,
  LOW: 1,
  MODERATE: 2,
  HIGH: 3,
} as const;

const CARE_CAPACITY = {
  MINIMAL: 0,
  WEEKLY: 1,
  FEW_TIMES_WEEK: 2,
  DAILY: 3,
} as const;

const EXPERIENCE_SCALE = {
  NONE: 0,
  BEGINNER: 1,
  INTERMEDIATE: 2,
  EXPERIENCED: 3,
} as const;

/** Experiência mínima confortável para cada nível de dificuldade. */
const DIFFICULTY_DEMAND = {
  EASY: 0,
  MEDIUM: 1.5,
  HARD: 2.5,
} as const;

const SPACE_CAPACITY = {
  TINY: 0,
  SMALL: 1,
  MEDIUM: 2,
  LARGE: 3,
} as const;

/** Espaço mínimo confortável para cada porte. */
const SIZE_DEMAND = {
  SMALL: 0,
  MEDIUM: 1,
  LARGE: 2.5,
} as const;

const LIGHT_LABELS: Record<keyof typeof LIGHT_SCALE, string> = {
  LOW_LIGHT: 'pouca luz natural',
  BRIGHT_INDIRECT: 'bastante claridade indireta',
  PARTIAL_SUN: 'sol direto por algumas horas',
  FULL_SUN: 'sol direto por várias horas',
};

const WATER_LABELS: Record<keyof typeof WATER_DEMAND, string> = {
  VERY_LOW: 'quase não precisa de rega',
  LOW: 'precisa de pouca rega',
  MODERATE: 'precisa de rega regular',
  HIGH: 'precisa de rega frequente',
};

const CARE_LABELS: Record<keyof typeof CARE_CAPACITY, string> = {
  MINIMAL: 'você prefere plantas que quase não pedem atenção',
  WEEKLY: 'você cuida das plantas uma vez por semana',
  FEW_TIMES_WEEK: 'você cuida das plantas algumas vezes por semana',
  DAILY: 'você cuida das plantas todos os dias',
};

const SPACE_LABELS: Record<keyof typeof SPACE_CAPACITY, string> = {
  TINY: 'um espaço muito pequeno',
  SMALL: 'um espaço pequeno',
  MEDIUM: 'um espaço médio',
  LARGE: 'um espaço grande',
};

const SIZE_LABELS = {
  SMALL: 'porte pequeno',
  MEDIUM: 'porte médio',
  LARGE: 'porte grande',
} as const;

const ENVIRONMENT_LABELS = {
  INDOOR: 'área interna',
  OUTDOOR: 'área externa',
  BALCONY: 'varanda',
  GARDEN: 'jardim',
  WINDOW: 'janela',
  OFFICE_BEDROOM: 'escritório ou quarto',
} as const;

/* --------------------------------------------------------------------------
 * Utilidades
 * ------------------------------------------------------------------------ */

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/* --------------------------------------------------------------------------
 * Critérios
 * ------------------------------------------------------------------------ */

function scoreLight(
  profile: GreenProfileSnapshot,
  plant: PlantSnapshot,
): CriterionResult {
  const base = {
    key: 'light' as const,
    label: 'Luminosidade',
    weight: CRITERION_WEIGHTS.light,
  };

  if (profile.lightUnsure || profile.light === null) {
    return {
      ...base,
      score: 0.65,
      positive: false,
      explanation:
        'Você ainda não sabe a luminosidade do seu espaço, então esse critério ficou neutro. ' +
        'Vale conferir a luz do lugar para afinar as recomendações.',
    };
  }

  const user = LIGHT_SCALE[profile.light];
  const needed = LIGHT_SCALE[plant.light];
  const diff = user - needed;

  // Luz a mais penaliza menos do que luz a menos, exceto para espécies de sombra.
  const score =
    diff === 0
      ? 1
      : diff > 0
        ? clamp01(1 - 0.25 * diff)
        : clamp01(1 - 0.4 * Math.abs(diff));

  const explanation =
    diff === 0
      ? `Você tem ${LIGHT_LABELS[profile.light]} e essa espécie precisa exatamente disso.`
      : diff > 0
        ? `Seu espaço tem mais luz do que essa espécie costuma pedir (${LIGHT_LABELS[plant.light]}). Um pouco de sombra resolve.`
        : `Essa espécie pede ${LIGHT_LABELS[plant.light]} e o seu espaço tem ${LIGHT_LABELS[profile.light]}.`;

  return { ...base, score, positive: score >= 0.75, explanation };
}

function scoreWater(
  profile: GreenProfileSnapshot,
  plant: PlantSnapshot,
): CriterionResult {
  const base = {
    key: 'water' as const,
    label: 'Rotina de cuidado',
    weight: CRITERION_WEIGHTS.water,
  };

  const capacity = CARE_CAPACITY[profile.careTime];
  const demand = WATER_DEMAND[plant.water];
  const gap = demand - capacity;

  const score = gap <= 0 ? 1 : clamp01(1 - 0.35 * gap);

  const explanation =
    gap <= 0
      ? `Como ${CARE_LABELS[profile.careTime]}, a rotina dessa espécie cabe no seu dia a dia: ela ${WATER_LABELS[plant.water]}.`
      : `Essa espécie ${WATER_LABELS[plant.water]}, o que pede mais atenção do que a rotina que você indicou.`;

  return { ...base, score, positive: score >= 0.75, explanation };
}

function scoreExperience(
  profile: GreenProfileSnapshot,
  plant: PlantSnapshot,
): CriterionResult {
  const base = {
    key: 'experience' as const,
    label: 'Experiência',
    weight: CRITERION_WEIGHTS.experience,
  };

  const experience = EXPERIENCE_SCALE[profile.experience];
  const demand = DIFFICULTY_DEMAND[plant.difficulty];
  const gap = demand - experience;

  const score = gap <= 0 ? 1 : clamp01(1 - 0.35 * gap);

  const explanation =
    gap <= 0
      ? plant.difficulty === 'EASY'
        ? 'É uma espécie fácil de cuidar e perdoa esquecimentos — boa para começar com confiança.'
        : 'A dificuldade dessa espécie está dentro do que você já sabe fazer.'
      : 'É uma espécie mais exigente do que o seu nível atual. Dá para tentar, mas com atenção redobrada.';

  return { ...base, score, positive: score >= 0.75, explanation };
}

function scoreSpace(
  profile: GreenProfileSnapshot,
  plant: PlantSnapshot,
): CriterionResult {
  const base = {
    key: 'space' as const,
    label: 'Espaço',
    weight: CRITERION_WEIGHTS.space,
  };

  const capacity = SPACE_CAPACITY[profile.space];
  const demand = SIZE_DEMAND[plant.size];
  const gap = demand - capacity;

  const score = gap <= 0 ? 1 : clamp01(1 - 0.4 * gap);

  const explanation =
    gap <= 0
      ? `Cabe bem em ${SPACE_LABELS[profile.space]}: é uma planta de ${SIZE_LABELS[plant.size]}.`
      : `É uma planta de ${SIZE_LABELS[plant.size]} e você indicou ${SPACE_LABELS[profile.space]}. Ela pode ficar apertada.`;

  return { ...base, score, positive: score >= 0.75, explanation };
}

function scoreEnvironment(
  profile: GreenProfileSnapshot,
  plant: PlantSnapshot,
): CriterionResult {
  const base = {
    key: 'environment' as const,
    label: 'Ambiente',
    weight: CRITERION_WEIGHTS.environment,
  };

  if (profile.placements.length === 0) {
    return {
      ...base,
      score: 0.65,
      positive: false,
      explanation: 'Você ainda não definiu onde a planta vai ficar.',
    };
  }

  const matches = profile.placements.filter((placement) =>
    plant.environments.includes(placement),
  );

  if (matches.length > 0) {
    const names = matches
      .map((match) => ENVIRONMENT_LABELS[match])
      .slice(0, 2)
      .join(' e ');
    return {
      ...base,
      score: 1,
      positive: true,
      explanation: `Vai bem em ${names}, que é onde você pretende colocá-la.`,
    };
  }

  const plantPlaces = plant.environments
    .map((environment) => ENVIRONMENT_LABELS[environment])
    .slice(0, 2)
    .join(' e ');

  return {
    ...base,
    score: 0.25,
    positive: false,
    explanation: `Essa espécie se dá melhor em ${plantPlaces}, diferente do lugar que você escolheu.`,
  };
}

function scoreClimate(
  profile: GreenProfileSnapshot,
  plant: PlantSnapshot,
): CriterionResult {
  const base = {
    key: 'climate' as const,
    label: 'Clima',
    weight: CRITERION_WEIGHTS.climate,
  };

  if (profile.climate === 'UNSURE') {
    return {
      ...base,
      score: 0.7,
      positive: false,
      explanation: 'Sem informação de clima, esse critério ficou neutro.',
    };
  }

  let score = 0.8;
  let explanation = 'O clima que você descreveu é compatível com essa espécie.';

  if (profile.climate === 'HUMID') {
    score = plant.humidity === 'HIGH' ? 1 : plant.humidity === 'MEDIUM' ? 0.8 : 0.5;
    explanation =
      plant.humidity === 'LOW'
        ? 'Essa espécie prefere ar mais seco do que o ambiente úmido que você descreveu.'
        : 'Gosta de umidade, e o seu ambiente é úmido.';
  } else if (profile.climate === 'DRY') {
    score = plant.humidity === 'LOW' ? 1 : plant.humidity === 'MEDIUM' ? 0.75 : 0.45;
    explanation =
      plant.humidity === 'HIGH'
        ? 'Essa espécie pede bastante umidade no ar, o que exige atenção em ambiente seco.'
        : 'Tolera bem o ar seco que você descreveu.';
  } else if (profile.climate === 'COLD') {
    const minimum = plant.tempMinC;
    score = minimum === null ? 0.7 : minimum <= 8 ? 1 : minimum <= 12 ? 0.7 : 0.4;
    explanation =
      minimum !== null && minimum > 12
        ? `Essa espécie sofre abaixo de ${minimum} °C, e você indicou clima frio.`
        : 'Aguenta bem as temperaturas mais baixas que você descreveu.';
  } else if (profile.climate === 'HOT') {
    const maximum = plant.tempMaxC;
    score = maximum === null ? 0.7 : maximum >= 32 ? 1 : maximum >= 28 ? 0.75 : 0.45;
    explanation =
      maximum !== null && maximum < 28
        ? 'Essa espécie prefere temperaturas mais amenas do que o clima que você descreveu.'
        : 'Lida bem com o calor do seu ambiente.';
  }

  return { ...base, score, positive: score >= 0.75, explanation };
}

function scorePreferences(
  profile: GreenProfileSnapshot,
  plant: PlantSnapshot,
): CriterionResult {
  const base = {
    key: 'preferences' as const,
    label: 'Preferências',
    weight: CRITERION_WEIGHTS.preferences,
  };

  const preferences = profile.preferences.filter(
    (preference) => preference !== 'sem-preferencia',
  );

  if (preferences.length === 0) {
    return {
      ...base,
      score: 0.7,
      positive: false,
      explanation: 'Você não indicou preferência de tipo, então isso não pesou.',
    };
  }

  const matched = preferences.filter((preference) =>
    plant.categorySlugs.includes(preference),
  );

  if (matched.length > 0) {
    return {
      ...base,
      score: 1,
      positive: true,
      explanation: `Está entre os tipos que você prefere (${matched.join(', ')}).`,
    };
  }

  return {
    ...base,
    score: 0.35,
    positive: false,
    explanation: 'Não está entre os tipos que você marcou como preferidos.',
  };
}

function scoreGoals(
  profile: GreenProfileSnapshot,
  plant: PlantSnapshot,
): CriterionResult {
  const base = {
    key: 'goals' as const,
    label: 'Objetivo',
    weight: CRITERION_WEIGHTS.goals,
  };

  if (profile.goals.length === 0) {
    return {
      ...base,
      score: 0.7,
      positive: false,
      explanation: 'Nenhum objetivo informado.',
    };
  }

  const satisfied: string[] = [];

  for (const goal of profile.goals) {
    switch (goal) {
      case 'flores':
        if (plant.hasFlowering || plant.categorySlugs.includes('flores')) {
          satisfied.push('flores');
        }
        break;
      case 'horta':
      case 'temperos':
      case 'aromaticas':
        if (
          plant.categorySlugs.includes('ervas') ||
          plant.categorySlugs.includes('horta') ||
          plant.categorySlugs.includes('frutiferas')
        ) {
          satisfied.push(goal);
        }
        break;
      case 'biodiversidade':
        if (plant.isNative) satisfied.push('biodiversidade');
        break;
      case 'plantas-grandes':
        if (plant.size === 'LARGE') satisfied.push('plantas-grandes');
        break;
      case 'plantas-pequenas':
        if (plant.size === 'SMALL') satisfied.push('plantas-pequenas');
        break;
      case 'aprender':
        if (plant.difficulty !== 'HARD') satisfied.push('aprender');
        break;
      case 'decoracao':
      case 'ornamental':
        satisfied.push(goal);
        break;
      default:
        break;
    }
  }

  if (satisfied.length > 0) {
    return {
      ...base,
      score: 1,
      positive: true,
      explanation: 'Atende ao que você quer alcançar com as suas plantas.',
    };
  }

  return {
    ...base,
    score: 0.4,
    positive: false,
    explanation: 'Não é a escolha mais direta para o objetivo que você indicou.',
  };
}

/* --------------------------------------------------------------------------
 * Segurança botânica — nunca escondida, sempre explícita
 * ------------------------------------------------------------------------ */

type SafetyResult = {
  multiplier: number;
  warnings: RecommendationWarning[];
};

function evaluateSafety(
  profile: GreenProfileSnapshot,
  plant: PlantSnapshot,
): SafetyResult {
  const warnings: RecommendationWarning[] = [];
  let multiplier = 1;

  const applyToxicity = (
    level: PlantSnapshot['toxicityCats'],
    subject: string,
    relevant: boolean,
  ) => {
    if (level === 'NONE') return;

    if (level === 'UNKNOWN') {
      if (relevant) {
        warnings.push({
          severity: 'info',
          message: `Não há confirmação sobre a toxicidade desta espécie para ${subject}. Informação não confirmada.`,
        });
      }
      return;
    }

    const severityText =
      level === 'SEVERE'
        ? 'Tóxica'
        : level === 'MODERATE'
          ? 'Moderadamente tóxica'
          : 'Levemente tóxica';

    warnings.push({
      severity: level === 'SEVERE' ? 'danger' : 'attention',
      message: `${severityText} para ${subject}.`,
    });

    if (!relevant) return;

    if (level === 'SEVERE') multiplier *= 0.3;
    else if (level === 'MODERATE') multiplier *= 0.65;
    else multiplier *= 0.9;
  };

  applyToxicity(plant.toxicityCats, 'gatos', profile.hasCats);
  applyToxicity(plant.toxicityDogs, 'cães', profile.hasDogs);
  applyToxicity(
    plant.toxicityHumans,
    'crianças pequenas',
    profile.hasSmallKids,
  );

  return { multiplier, warnings };
}

/* --------------------------------------------------------------------------
 * Ponto de entrada
 * ------------------------------------------------------------------------ */

export function scorePlantForProfile(
  profile: GreenProfileSnapshot,
  plant: PlantSnapshot,
): ScoredPlant {
  const criteria: CriterionResult[] = [
    scoreLight(profile, plant),
    scoreWater(profile, plant),
    scoreExperience(profile, plant),
    scoreSpace(profile, plant),
    scoreEnvironment(profile, plant),
    scoreClimate(profile, plant),
    scorePreferences(profile, plant),
    scoreGoals(profile, plant),
  ];

  const totalWeight = criteria.reduce((sum, item) => sum + item.weight, 0);
  const weighted = criteria.reduce(
    (sum, item) => sum + item.weight * item.score,
    0,
  );

  const safety = evaluateSafety(profile, plant);
  const rawScore = (weighted / totalWeight) * safety.multiplier * 100;
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  const reasons = criteria
    .filter((item) => item.positive)
    .sort((a, b) => b.weight * b.score - a.weight * a.score)
    .slice(0, 3)
    .map((item) => item.explanation);

  const attentionPoints = criteria
    .filter((item) => item.score < 0.6)
    .sort((a, b) => a.score * a.weight - b.score * b.weight)
    .slice(0, 2)
    .map((item) => item.explanation);

  // Uma recomendação sem nenhuma razão positiva não deve existir na interface.
  if (reasons.length === 0) {
    reasons.push(
      'Esta espécie apareceu por proximidade geral com o seu perfil, mas veja os pontos de atenção antes de decidir.',
    );
  }

  return {
    plant,
    score,
    criteria,
    reasons,
    attentionPoints,
    warnings: safety.warnings,
  };
}

export function rankPlantsForProfile(
  profile: GreenProfileSnapshot,
  plants: PlantSnapshot[],
  options: { limit?: number; minimumScore?: number } = {},
): ScoredPlant[] {
  const { limit = 24, minimumScore = 0 } = options;

  return plants
    .map((plant) => scorePlantForProfile(profile, plant))
    .filter((result) => result.score >= minimumScore)
    .sort((a, b) => b.score - a.score || a.plant.slug.localeCompare(b.plant.slug))
    .slice(0, limit);
}

/** Rótulo qualitativo do percentual, para não depender só do número. */
export function compatibilityLabel(score: number): {
  label: string;
  tone: 'excellent' | 'good' | 'fair' | 'low';
} {
  if (score >= 85) return { label: 'Combinação excelente', tone: 'excellent' };
  if (score >= 70) return { label: 'Boa combinação', tone: 'good' };
  if (score >= 50) return { label: 'Combinação razoável', tone: 'fair' };
  return { label: 'Pouco compatível', tone: 'low' };
}
