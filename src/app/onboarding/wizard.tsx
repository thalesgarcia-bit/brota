'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { BrotaMark } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { ChoiceCard } from '@/components/ui/choice';
import { Alert } from '@/components/ui/feedback';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils/cn';
import {
  GOAL_OPTIONS,
  PREFERENCE_OPTIONS,
  type OnboardingInput,
} from '@/lib/validation/onboarding';
import { completeOnboardingAction } from '@/server/actions/onboarding';
import type { IconName } from '@/components/ui/icon';

/* ===========================================================================
 * QUESTIONÁRIO DO PERFIL VERDE
 *
 * Uma pergunta por tela. Nada de vinte campos de uma vez.
 * Cada opção traz uma explicação em linguagem comum — o usuário não precisa
 * saber o que é "luz indireta" para responder corretamente.
 * =========================================================================== */

type Answers = {
  housing: OnboardingInput['housing'] | null;
  placements: OnboardingInput['placements'];
  light: OnboardingInput['light'];
  lightUnsure: boolean;
  careTime: OnboardingInput['careTime'] | null;
  experience: OnboardingInput['experience'] | null;
  goals: string[];
  preferences: string[];
  hasDogs: boolean;
  hasCats: boolean;
  hasOtherPets: boolean;
  hasSmallKids: boolean;
  climate: OnboardingInput['climate'];
  space: OnboardingInput['space'] | null;
};

const INITIAL: Answers = {
  housing: null,
  placements: [],
  light: null,
  lightUnsure: false,
  careTime: null,
  experience: null,
  goals: [],
  preferences: [],
  hasDogs: false,
  hasCats: false,
  hasOtherPets: false,
  hasSmallKids: false,
  climate: 'UNSURE',
  space: null,
};

type Option = {
  value: string;
  label: string;
  description?: string;
  icon?: IconName;
};

const HOUSING_OPTIONS: Option[] = [
  { value: 'HOUSE', label: 'Casa', icon: 'home' },
  { value: 'APARTMENT', label: 'Apartamento', icon: 'grid' },
  { value: 'FARM', label: 'Chácara ou sítio', icon: 'sun' },
  { value: 'OTHER', label: 'Outro', icon: 'mapPin' },
];

const PLACEMENT_OPTIONS: Option[] = [
  { value: 'INDOOR', label: 'Área interna', description: 'Sala, cozinha, corredor.', icon: 'home' },
  { value: 'WINDOW', label: 'Janela', description: 'Peitoril ou bem perto do vidro.', icon: 'grid' },
  { value: 'BALCONY', label: 'Varanda', description: 'Coberta ou descoberta.', icon: 'cloudSun' },
  { value: 'OUTDOOR', label: 'Área externa', description: 'Quintal, laje, terraço.', icon: 'sun' },
  { value: 'GARDEN', label: 'Jardim', description: 'Direto na terra.', icon: 'sprout' },
  { value: 'OFFICE_BEDROOM', label: 'Escritório ou quarto', description: 'Mesa, estante, cabeceira.', icon: 'book' },
];

const LIGHT_OPTIONS: Option[] = [
  {
    value: 'FULL_SUN',
    label: 'Sol direto por várias horas',
    description: 'O sol bate na planta por quatro horas ou mais.',
    icon: 'sun',
  },
  {
    value: 'PARTIAL_SUN',
    label: 'Sol direto por algumas horas',
    description: 'Duas a quatro horas, geralmente de manhã ou no fim da tarde.',
    icon: 'cloudSun',
  },
  {
    value: 'BRIGHT_INDIRECT',
    label: 'Bastante claridade indireta',
    description: 'Lugar claro, mas o sol não bate direto na folha.',
    icon: 'cloudSun',
  },
  {
    value: 'LOW_LIGHT',
    label: 'Pouca luz natural',
    description: 'Longe de janelas, como corredores e cômodos internos.',
    icon: 'moon',
  },
];

const CARE_OPTIONS: Option[] = [
  { value: 'DAILY', label: 'Todos os dias', icon: 'droplet' },
  { value: 'FEW_TIMES_WEEK', label: 'Algumas vezes por semana', icon: 'calendar' },
  { value: 'WEEKLY', label: 'Uma vez por semana', icon: 'clock' },
  {
    value: 'MINIMAL',
    label: 'Prefiro plantas que quase não precisam de cuidados',
    icon: 'leaf',
  },
];

const EXPERIENCE_OPTIONS: Option[] = [
  { value: 'NONE', label: 'Nunca cuidei de uma planta', icon: 'sprout' },
  { value: 'BEGINNER', label: 'Iniciante', description: 'Já tive algumas.', icon: 'leaf' },
  { value: 'INTERMEDIATE', label: 'Intermediário', description: 'Conheço o básico e acerto na maioria.', icon: 'flower' },
  { value: 'EXPERIENCED', label: 'Experiente', description: 'Cuido de várias espécies há tempo.', icon: 'star' },
];

const SPACE_OPTIONS: Option[] = [
  { value: 'TINY', label: 'Muito pequeno', description: 'Um cantinho, uma prateleira.' },
  { value: 'SMALL', label: 'Pequeno', description: 'Cabe um ou dois vasos médios.' },
  { value: 'MEDIUM', label: 'Médio', description: 'Uma varanda ou um canto amplo.' },
  { value: 'LARGE', label: 'Grande', description: 'Quintal, jardim, área livre.' },
];

const CLIMATE_OPTIONS: Option[] = [
  { value: 'HOT', label: 'Muito quente', icon: 'sun' },
  { value: 'MILD', label: 'Ameno', icon: 'cloudSun' },
  { value: 'COLD', label: 'Frio', icon: 'moon' },
  { value: 'DRY', label: 'Seco', icon: 'thermometer' },
  { value: 'HUMID', label: 'Úmido', icon: 'droplet' },
  { value: 'UNSURE', label: 'Não sei', icon: 'info' },
];

export function OnboardingWizard() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Answers>(INITIAL);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function update<K extends keyof Answers>(key: K, value: Answers[K]) {
    setAnswers((current) => ({ ...current, [key]: value }));
    setError(null);
  }

  function toggleInList(key: 'placements' | 'goals' | 'preferences', value: string) {
    setAnswers((current) => {
      const list = current[key] as string[];
      const next = list.includes(value)
        ? list.filter((item) => item !== value)
        : [...list, value];
      return { ...current, [key]: next };
    });
    setError(null);
  }

  const steps = useMemo(
    () => [
      {
        id: 'housing',
        title: 'Onde você mora?',
        subtitle: 'Isso ajuda a entender o tipo de espaço disponível.',
        valid: answers.housing !== null,
        error: 'Escolha uma opção para continuar.',
        content: (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {HOUSING_OPTIONS.map((option) => (
              <ChoiceCard
                key={option.value}
                id={`housing-${option.value}`}
                name="housing"
                type="radio"
                label={option.label}
                icon={option.icon}
                checked={answers.housing === option.value}
                onChange={() => update('housing', option.value as Answers['housing'])}
              />
            ))}
          </div>
        ),
      },
      {
        id: 'placements',
        title: 'Onde a planta vai ficar?',
        subtitle: 'Pode escolher mais de um lugar.',
        valid: answers.placements.length > 0,
        error: 'Escolha ao menos um lugar.',
        content: (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {PLACEMENT_OPTIONS.map((option) => (
              <ChoiceCard
                key={option.value}
                id={`placement-${option.value}`}
                name="placements"
                type="checkbox"
                label={option.label}
                description={option.description}
                icon={option.icon}
                checked={answers.placements.includes(
                  option.value as Answers['placements'][number],
                )}
                onChange={() => toggleInList('placements', option.value)}
              />
            ))}
          </div>
        ),
      },
      {
        id: 'light',
        title: 'Como é a luz nesse lugar?',
        subtitle:
          'Dica: em um dia claro, ponha a mão a 30 cm da parede ao meio-dia. Sombra nítida significa luz forte; sombra fraca, pouca luz.',
        valid: answers.light !== null || answers.lightUnsure,
        error: 'Escolha uma opção ou marque que ainda não sabe.',
        content: (
          <div className="space-y-2.5">
            {LIGHT_OPTIONS.map((option) => (
              <ChoiceCard
                key={option.value}
                id={`light-${option.value}`}
                name="light"
                type="radio"
                label={option.label}
                description={option.description}
                icon={option.icon}
                checked={answers.light === option.value && !answers.lightUnsure}
                onChange={() => {
                  update('light', option.value as Answers['light']);
                  update('lightUnsure', false);
                }}
              />
            ))}
            <ChoiceCard
              id="light-unsure"
              name="light"
              type="radio"
              label="Ainda não sei"
              description="Sem problema. Vamos considerar esse critério como neutro."
              icon="info"
              checked={answers.lightUnsure}
              onChange={() => {
                update('lightUnsure', true);
                update('light', null);
              }}
            />
          </div>
        ),
      },
      {
        id: 'careTime',
        title: 'Com que frequência você consegue cuidar das plantas?',
        subtitle: 'Responda com sinceridade — a recomendação fica muito melhor.',
        valid: answers.careTime !== null,
        error: 'Escolha uma opção para continuar.',
        content: (
          <div className="space-y-2.5">
            {CARE_OPTIONS.map((option) => (
              <ChoiceCard
                key={option.value}
                id={`care-${option.value}`}
                name="careTime"
                type="radio"
                label={option.label}
                icon={option.icon}
                checked={answers.careTime === option.value}
                onChange={() => update('careTime', option.value as Answers['careTime'])}
              />
            ))}
          </div>
        ),
      },
      {
        id: 'experience',
        title: 'Qual é a sua experiência com plantas?',
        subtitle: 'Não existe resposta errada aqui.',
        valid: answers.experience !== null,
        error: 'Escolha uma opção para continuar.',
        content: (
          <div className="space-y-2.5">
            {EXPERIENCE_OPTIONS.map((option) => (
              <ChoiceCard
                key={option.value}
                id={`experience-${option.value}`}
                name="experience"
                type="radio"
                label={option.label}
                description={option.description}
                icon={option.icon}
                checked={answers.experience === option.value}
                onChange={() =>
                  update('experience', option.value as Answers['experience'])
                }
              />
            ))}
          </div>
        ),
      },
      {
        id: 'space',
        title: 'Quanto espaço você tem?',
        valid: answers.space !== null,
        error: 'Escolha uma opção para continuar.',
        content: (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {SPACE_OPTIONS.map((option) => (
              <ChoiceCard
                key={option.value}
                id={`space-${option.value}`}
                name="space"
                type="radio"
                label={option.label}
                description={option.description}
                checked={answers.space === option.value}
                onChange={() => update('space', option.value as Answers['space'])}
              />
            ))}
          </div>
        ),
      },
      {
        id: 'goals',
        title: 'O que você quer com as suas plantas?',
        subtitle: 'Escolha quantas fizerem sentido.',
        valid: answers.goals.length > 0,
        error: 'Escolha ao menos um objetivo.',
        content: (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {GOAL_OPTIONS.map((option) => (
              <ChoiceCard
                key={option.value}
                id={`goal-${option.value}`}
                name="goals"
                type="checkbox"
                label={option.label}
                checked={answers.goals.includes(option.value)}
                onChange={() => toggleInList('goals', option.value)}
              />
            ))}
          </div>
        ),
      },
      {
        id: 'household',
        title: 'Quem mora com você?',
        subtitle:
          'Muitas plantas comuns são tóxicas para cães, gatos e crianças pequenas. Com essa informação conseguimos avisar antes, não depois.',
        valid: true,
        error: '',
        content: (
          <div className="grid gap-2.5 sm:grid-cols-2">
            <ChoiceCard
              id="has-dogs"
              type="checkbox"
              label="Cães"
              icon="user"
              checked={answers.hasDogs}
              onChange={(event) => update('hasDogs', event.currentTarget.checked)}
            />
            <ChoiceCard
              id="has-cats"
              type="checkbox"
              label="Gatos"
              icon="user"
              checked={answers.hasCats}
              onChange={(event) => update('hasCats', event.currentTarget.checked)}
            />
            <ChoiceCard
              id="has-other-pets"
              type="checkbox"
              label="Outros animais"
              icon="users"
              checked={answers.hasOtherPets}
              onChange={(event) => update('hasOtherPets', event.currentTarget.checked)}
            />
            <ChoiceCard
              id="has-kids"
              type="checkbox"
              label="Crianças pequenas"
              icon="users"
              checked={answers.hasSmallKids}
              onChange={(event) => update('hasSmallKids', event.currentTarget.checked)}
            />
          </div>
        ),
      },
      {
        id: 'climate',
        title: 'Como é o clima onde você mora?',
        valid: true,
        error: '',
        content: (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {CLIMATE_OPTIONS.map((option) => (
              <ChoiceCard
                key={option.value}
                id={`climate-${option.value}`}
                name="climate"
                type="radio"
                label={option.label}
                icon={option.icon}
                checked={answers.climate === option.value}
                onChange={() => update('climate', option.value as Answers['climate'])}
              />
            ))}
          </div>
        ),
      },
      {
        id: 'preferences',
        title: 'Você tem preferência por algum tipo?',
        subtitle: 'Opcional. Se não tiver, siga em frente.',
        valid: true,
        error: '',
        content: (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {PREFERENCE_OPTIONS.map((option) => (
              <ChoiceCard
                key={option.value}
                id={`preference-${option.value}`}
                name="preferences"
                type="checkbox"
                label={option.label}
                checked={answers.preferences.includes(option.value)}
                onChange={() => toggleInList('preferences', option.value)}
              />
            ))}
          </div>
        ),
      },
    ],
    [answers],
  );

  const current = steps[step]!;
  const isLast = step === steps.length - 1;
  const progress = ((step + 1) / steps.length) * 100;

  function goNext() {
    if (!current.valid) {
      setError(current.error);
      return;
    }

    if (!isLast) {
      setStep((value) => value + 1);
      setError(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    startTransition(async () => {
      const result = await completeOnboardingAction({
        housing: answers.housing,
        placements: answers.placements,
        placementsUnsure: false,
        light: answers.light,
        lightUnsure: answers.lightUnsure,
        careTime: answers.careTime,
        experience: answers.experience,
        goals: answers.goals,
        preferences: answers.preferences,
        hasDogs: answers.hasDogs,
        hasCats: answers.hasCats,
        hasOtherPets: answers.hasOtherPets,
        hasSmallKids: answers.hasSmallKids,
        climate: answers.climate,
        space: answers.space,
      });

      if (!result.ok) {
        setError(result.message ?? 'Não foi possível salvar suas respostas.');
        return;
      }

      router.push('/recomendacoes?novo=1');
    });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-ink-25">
      <header className="border-b border-ink-100 bg-white pt-safe">
        <div className="mx-auto w-full max-w-2xl px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <BrotaMark size={26} />
              <span className="font-display font-semibold text-brand-900">BROTA</span>
            </span>
            <span className="text-sm text-ink-500" aria-live="polite">
              Pergunta {step + 1} de {steps.length}
            </span>
          </div>

          <div
            role="progressbar"
            aria-valuenow={step + 1}
            aria-valuemin={1}
            aria-valuemax={steps.length}
            aria-label="Progresso do questionário"
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-100"
          >
            <span
              className="block h-full rounded-full bg-brand-600 transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      <main id="conteudo" className="flex-1">
        <div className="mx-auto w-full max-w-2xl px-4 py-8 pb-32 sm:py-12">
          {step === 0 ? (
            <p className="mb-6 flex items-center gap-2 text-sm text-brand-800">
              <Icon name="sprout" size={17} />
              Vamos descobrir quais plantas combinam com você.
            </p>
          ) : null}

          <h1 className="text-2xl sm:text-3xl">{current.title}</h1>
          {'subtitle' in current && current.subtitle ? (
            <p className="mt-2.5 leading-relaxed text-ink-600">{current.subtitle}</p>
          ) : null}

          <div className="mt-7">{current.content}</div>

          {error ? (
            <Alert tone="danger" className="mt-5">
              {error}
            </Alert>
          ) : null}
        </div>
      </main>

      <footer className="fixed inset-x-0 bottom-0 border-t border-ink-200 bg-white pb-safe">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 py-4">
          <Button
            variant="ghost"
            iconLeft="arrowLeft"
            onClick={() => {
              if (step === 0) router.push('/feed');
              else setStep((value) => value - 1);
              setError(null);
            }}
            className={cn(step === 0 && 'text-ink-500')}
          >
            {step === 0 ? 'Depois' : 'Voltar'}
          </Button>

          <Button
            className="flex-1"
            size="lg"
            iconRight={isLast ? 'sparkle' : 'arrowRight'}
            loading={pending}
            onClick={goNext}
          >
            {isLast ? 'Ver minhas recomendações' : 'Continuar'}
          </Button>
        </div>
      </footer>
    </div>
  );
}
