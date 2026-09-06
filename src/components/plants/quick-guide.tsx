import type { Difficulty, LightRequirement, WaterFrequency } from '@/generated/prisma/client';

import { LevelMeter } from '@/components/ui/meter';
import { DIFFICULTY, LIGHT, WATER } from '@/lib/labels';

/**
 * "Guia rápido" da página da espécie.
 * Cada medidor traz o rótulo por extenso — a barra é reforço visual, não a
 * única forma de ler a informação.
 */
export function QuickGuide({
  light,
  water,
  difficulty,
}: {
  light: LightRequirement;
  water: WaterFrequency;
  difficulty: Difficulty;
}) {
  return (
    <div className="rounded-lg border border-ink-200 bg-white p-4 sm:p-5">
      <h2 className="text-base font-semibold">Guia rápido</h2>

      <div className="mt-4 space-y-4">
        <LevelMeter
          icon={LIGHT[light].icon}
          label="Luz"
          level={LIGHT[light].level}
          levelLabel={LIGHT[light].short}
        />
        <LevelMeter
          icon="droplet"
          label="Água"
          level={WATER[water].level}
          levelLabel={WATER[water].short}
        />
        <LevelMeter
          icon="sprout"
          label="Dificuldade"
          level={DIFFICULTY[difficulty].level}
          max={3}
          levelLabel={DIFFICULTY[difficulty].label}
        />
      </div>

      <dl className="mt-4 space-y-1.5 border-t border-ink-100 pt-4 text-sm">
        <div className="flex gap-2">
          <dt className="text-ink-500">Luminosidade:</dt>
          <dd className="text-ink-800">{LIGHT[light].label}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-ink-500">Rega:</dt>
          <dd className="text-ink-800">{WATER[water].help}</dd>
        </div>
      </dl>
    </div>
  );
}
