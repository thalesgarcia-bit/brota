import type {
  ClimateKind,
  Difficulty,
  EnvironmentKind,
  ExperienceLevel,
  GrowthRate,
  HumidityLevel,
  CareTime,
  LightRequirement,
  SizeCategory,
  SpaceSize,
  ToxicityLevel,
  WaterFrequency,
} from '@/generated/prisma/client';

/** Recorte do Perfil Verde que o motor precisa. Nada além disso. */
export type GreenProfileSnapshot = {
  placements: EnvironmentKind[];
  light: LightRequirement | null;
  lightUnsure: boolean;
  careTime: CareTime;
  experience: ExperienceLevel;
  goals: string[];
  preferences: string[];
  hasDogs: boolean;
  hasCats: boolean;
  hasSmallKids: boolean;
  climate: ClimateKind;
  space: SpaceSize;
};

/** Recorte da espécie que o motor precisa. */
export type PlantSnapshot = {
  id: string;
  slug: string;
  scientificName: string;
  primaryCommonName: string;
  light: LightRequirement;
  water: WaterFrequency;
  humidity: HumidityLevel;
  size: SizeCategory;
  growthRate: GrowthRate;
  difficulty: Difficulty;
  tempMinC: number | null;
  tempMaxC: number | null;
  toxicityHumans: ToxicityLevel;
  toxicityDogs: ToxicityLevel;
  toxicityCats: ToxicityLevel;
  isNative: boolean;
  environments: EnvironmentKind[];
  categorySlugs: string[];
  hasFlowering: boolean;
};

export type CriterionKey =
  | 'light'
  | 'water'
  | 'experience'
  | 'space'
  | 'environment'
  | 'climate'
  | 'preferences'
  | 'goals';

export type CriterionResult = {
  key: CriterionKey;
  label: string;
  weight: number;
  /** 0 a 1. */
  score: number;
  /** Frase em linguagem comum explicando por que este critério pontuou assim. */
  explanation: string;
  positive: boolean;
};

export type RecommendationWarning = {
  severity: 'info' | 'attention' | 'danger';
  message: string;
};

export type ScoredPlant = {
  plant: PlantSnapshot;
  /** 0 a 100. */
  score: number;
  criteria: CriterionResult[];
  /** Motivos exibidos ao usuário. Nunca mostrar o percentual sem eles. */
  reasons: string[];
  attentionPoints: string[];
  warnings: RecommendationWarning[];
};
