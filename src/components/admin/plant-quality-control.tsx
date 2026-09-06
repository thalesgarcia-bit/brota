'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { DataQuality } from '@/generated/prisma/client';

import { Select } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { DATA_QUALITY } from '@/lib/labels';
import { setPlantDataQualityAction } from '@/server/actions/admin';

/** Alterna a situação editorial da ficha, com a regra de fonte obrigatória. */
export function PlantQualityControl({
  plantId,
  quality,
  hasSources,
}: {
  plantId: string;
  quality: DataQuality;
  hasSources: boolean;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <>
      <label htmlFor={`qualidade-${plantId}`} className="sr-only">
        Situação editorial da ficha
      </label>
      <Select
        id={`qualidade-${plantId}`}
        value={quality}
        disabled={pending}
        className="h-9 w-auto text-xs"
        onChange={(event) => {
          const next = event.target.value as DataQuality;
          startTransition(async () => {
            const result = await setPlantDataQualityAction(plantId, next);
            notify(result.message, result.ok ? 'success' : 'error');
            router.refresh();
          });
        }}
      >
        {Object.entries(DATA_QUALITY).map(([value, info]) => (
          <option
            key={value}
            value={value}
            disabled={value === 'REVIEWED' && !hasSources}
          >
            {info.label}
          </option>
        ))}
      </Select>
    </>
  );
}
