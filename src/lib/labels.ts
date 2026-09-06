import type {
  CareTime,
  ClimateKind,
  DataQuality,
  Difficulty,
  DiaryEntryType,
  EnvironmentKind,
  ExperienceLevel,
  GrowthRate,
  HousingType,
  HumidityLevel,
  IdentificationStatus,
  LightRequirement,
  PostType,
  ReportReason,
  ReportStatus,
  SizeCategory,
  SpaceSize,
  SuggestionStatus,
  ToxicityLevel,
  WaterFrequency,
} from '@prisma/client';

import type { IconName } from '@/components/ui/icon';

/* ===========================================================================
 * RÓTULOS
 * Toda tradução de enum para texto humano mora aqui. Nenhum componente
 * escreve "Sol pleno" por conta própria — assim a linguagem do produto
 * permanece a mesma em todas as telas.
 * =========================================================================== */

export const LIGHT: Record<
  LightRequirement,
  { label: string; short: string; level: number; icon: IconName; help: string }
> = {
  FULL_SUN: {
    label: 'Sol direto por várias horas',
    short: 'Sol pleno',
    level: 4,
    icon: 'sun',
    help: 'O sol bate na planta por quatro horas ou mais por dia.',
  },
  PARTIAL_SUN: {
    label: 'Sol direto por algumas horas',
    short: 'Meia-sombra',
    level: 3,
    icon: 'cloudSun',
    help: 'Duas a quatro horas de sol, geralmente pela manhã ou no fim da tarde.',
  },
  BRIGHT_INDIRECT: {
    label: 'Bastante claridade indireta',
    short: 'Luz indireta',
    level: 2,
    icon: 'cloudSun',
    help: 'Ambiente claro, mas o sol não bate direto na folha.',
  },
  LOW_LIGHT: {
    label: 'Pouca luz natural',
    short: 'Sombra',
    level: 1,
    icon: 'moon',
    help: 'Longe de janelas, como corredores e cômodos internos.',
  },
};

export const WATER: Record<
  WaterFrequency,
  { label: string; short: string; level: number; help: string }
> = {
  HIGH: {
    label: 'Rega frequente',
    short: 'Muita água',
    level: 4,
    help: 'Substrato sempre levemente úmido.',
  },
  MODERATE: {
    label: 'Rega regular',
    short: 'Água moderada',
    level: 3,
    help: 'Regue quando os primeiros centímetros do substrato secarem.',
  },
  LOW: {
    label: 'Pouca rega',
    short: 'Pouca água',
    level: 2,
    help: 'Deixe boa parte do substrato secar entre as regas.',
  },
  VERY_LOW: {
    label: 'Quase não precisa de rega',
    short: 'Muito pouca água',
    level: 1,
    help: 'Só regue quando o substrato estiver completamente seco.',
  },
};

export const DIFFICULTY: Record<
  Difficulty,
  { label: string; level: number; tone: 'success' | 'warning' | 'danger' }
> = {
  EASY: { label: 'Fácil', level: 1, tone: 'success' },
  MEDIUM: { label: 'Média', level: 2, tone: 'warning' },
  HARD: { label: 'Exigente', level: 3, tone: 'danger' },
};

export const SIZE: Record<SizeCategory, { label: string; help: string }> = {
  SMALL: { label: 'Pequeno', help: 'Até cerca de 40 cm.' },
  MEDIUM: { label: 'Médio', help: 'De 40 cm a 1,5 m.' },
  LARGE: { label: 'Grande', help: 'Acima de 1,5 m.' },
};

export const GROWTH: Record<GrowthRate, string> = {
  SLOW: 'Lento',
  MODERATE: 'Moderado',
  FAST: 'Rápido',
};

export const HUMIDITY: Record<HumidityLevel, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
};

export const ENVIRONMENT: Record<
  EnvironmentKind,
  { label: string; icon: IconName }
> = {
  INDOOR: { label: 'Área interna', icon: 'home' },
  OUTDOOR: { label: 'Área externa', icon: 'sun' },
  BALCONY: { label: 'Varanda', icon: 'cloudSun' },
  GARDEN: { label: 'Jardim', icon: 'sprout' },
  WINDOW: { label: 'Janela', icon: 'grid' },
  OFFICE_BEDROOM: { label: 'Escritório ou quarto', icon: 'book' },
};

export const TOXICITY: Record<
  ToxicityLevel,
  { label: string; tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }
> = {
  NONE: { label: 'Não tóxica', tone: 'success' },
  MILD: { label: 'Levemente tóxica', tone: 'warning' },
  MODERATE: { label: 'Moderadamente tóxica', tone: 'warning' },
  SEVERE: { label: 'Tóxica', tone: 'danger' },
  UNKNOWN: { label: 'Informação não confirmada', tone: 'info' },
};

export const DATA_QUALITY: Record<
  DataQuality,
  { label: string; description: string; tone: 'neutral' | 'info' | 'success' }
> = {
  SEED_UNREVIEWED: {
    label: 'Conteúdo ainda não revisado',
    description:
      'Este registro faz parte da base inicial e ainda não passou pela revisão da equipe.',
    tone: 'info',
  },
  COMMUNITY: {
    label: 'Contribuição da comunidade',
    description: 'Informação sugerida por membros e aprovada pela moderação.',
    tone: 'neutral',
  },
  REVIEWED: {
    label: 'Revisado pela equipe',
    description: 'Informação conferida com as fontes listadas ao final da página.',
    tone: 'success',
  },
};

export const POST_TYPE: Record<
  PostType,
  { label: string; icon: IconName; tone: 'brand' | 'neutral' | 'info' | 'success' }
> = {
  MY_PLANT: { label: 'Minha planta', icon: 'sprout', tone: 'brand' },
  BEFORE_AFTER: { label: 'Antes e depois', icon: 'refresh', tone: 'neutral' },
  TIP: { label: 'Dica', icon: 'sparkle', tone: 'success' },
  QUESTION: { label: 'Dúvida', icon: 'message', tone: 'info' },
  IDENTIFICATION: { label: 'Identificação', icon: 'scan', tone: 'info' },
  ACHIEVEMENT: { label: 'Conquista', icon: 'star', tone: 'success' },
};

export const DIARY_TYPE: Record<
  DiaryEntryType,
  { label: string; icon: IconName }
> = {
  WATERING: { label: 'Rega', icon: 'droplet' },
  FERTILIZING: { label: 'Adubação', icon: 'sparkle' },
  PRUNING: { label: 'Poda', icon: 'scissors' },
  REPOTTING: { label: 'Troca de vaso', icon: 'pot' },
  RELOCATION: { label: 'Mudança de ambiente', icon: 'move' },
  FLOWERING: { label: 'Floração', icon: 'flower' },
  NEW_LEAF: { label: 'Nova folha', icon: 'leaf' },
  PEST: { label: 'Praga', icon: 'alert' },
  PHOTO: { label: 'Foto', icon: 'camera' },
  NOTE: { label: 'Observação', icon: 'note' },
};

export const HOUSING: Record<HousingType, string> = {
  HOUSE: 'Casa',
  APARTMENT: 'Apartamento',
  FARM: 'Chácara ou sítio',
  OTHER: 'Outro',
};

export const CARE_TIME: Record<CareTime, string> = {
  DAILY: 'Todos os dias',
  FEW_TIMES_WEEK: 'Algumas vezes por semana',
  WEEKLY: 'Uma vez por semana',
  MINIMAL: 'Prefiro plantas que quase não precisam de cuidados',
};

export const EXPERIENCE: Record<ExperienceLevel, string> = {
  NONE: 'Nunca cuidei',
  BEGINNER: 'Iniciante',
  INTERMEDIATE: 'Intermediário',
  EXPERIENCED: 'Experiente',
};

export const SPACE: Record<SpaceSize, string> = {
  TINY: 'Muito pequeno',
  SMALL: 'Pequeno',
  MEDIUM: 'Médio',
  LARGE: 'Grande',
};

export const CLIMATE: Record<ClimateKind, string> = {
  HOT: 'Muito quente',
  MILD: 'Ameno',
  COLD: 'Frio',
  DRY: 'Seco',
  HUMID: 'Úmido',
  UNSURE: 'Não sei',
};

export const IDENTIFICATION_STATUS: Record<
  IdentificationStatus,
  { label: string; tone: 'neutral' | 'info' | 'warning' | 'success' | 'danger' }
> = {
  AWAITING_PROVIDER: { label: 'Analisando', tone: 'neutral' },
  RESOLVED_BY_PROVIDER: { label: 'Identificada automaticamente', tone: 'success' },
  AWAITING_REVIEW: { label: 'Aguardando análise', tone: 'warning' },
  IN_REVIEW: { label: 'Em análise', tone: 'info' },
  NEEDS_MORE_INFO: { label: 'Precisa de mais informações', tone: 'warning' },
  IDENTIFIED: { label: 'Identificada', tone: 'success' },
  INADEQUATE_IMAGE: { label: 'Imagem inadequada', tone: 'danger' },
  CLOSED: { label: 'Encerrada', tone: 'neutral' },
};

export const SUGGESTION_STATUS: Record<
  SuggestionStatus,
  { label: string; tone: 'warning' | 'success' | 'danger' }
> = {
  PENDING: { label: 'Aguardando revisão', tone: 'warning' },
  APPROVED: { label: 'Aprovada', tone: 'success' },
  REJECTED: { label: 'Recusada', tone: 'danger' },
};

export const REPORT_REASON: Record<ReportReason, string> = {
  SPAM: 'Spam',
  OFFENSIVE: 'Conteúdo ofensivo',
  DANGEROUS_INFORMATION: 'Informação potencialmente perigosa',
  INAPPROPRIATE: 'Conteúdo inadequado',
  COPYRIGHT: 'Direitos autorais',
  OTHER: 'Outro',
};

export const REPORT_STATUS: Record<
  ReportStatus,
  { label: string; tone: 'warning' | 'info' | 'success' | 'neutral' }
> = {
  OPEN: { label: 'Aberta', tone: 'warning' },
  IN_REVIEW: { label: 'Em análise', tone: 'info' },
  RESOLVED: { label: 'Resolvida', tone: 'success' },
  DISMISSED: { label: 'Descartada', tone: 'neutral' },
};
