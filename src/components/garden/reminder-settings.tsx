'use client';

import { useState, useTransition } from 'react';

import { Switch } from '@/components/ui/choice';
import { Select } from '@/components/ui/input';
import { Alert } from '@/components/ui/feedback';
import { useToast } from '@/components/ui/toast';
import { saveReminderAction } from '@/server/actions/garden';

type ReminderKind = 'WATERING' | 'FERTILIZING' | 'PRUNING' | 'REPOTTING' | 'CHECKUP';

type Reminder = {
  kind: ReminderKind;
  enabled: boolean;
  intervalDays: number;
  preferredHour: number;
};

const KINDS: { kind: ReminderKind; label: string; defaultInterval: number }[] = [
  { kind: 'CHECKUP', label: 'Verificar a umidade do substrato', defaultInterval: 4 },
  { kind: 'FERTILIZING', label: 'Adubação', defaultInterval: 30 },
  { kind: 'PRUNING', label: 'Poda', defaultInterval: 90 },
  { kind: 'REPOTTING', label: 'Troca de vaso', defaultInterval: 365 },
];

/**
 * Lembretes.
 *
 * Nunca "regue toda terça-feira": a rega depende de condições reais. O lembrete
 * convida a observar — quem decide é a pessoa, olhando o substrato.
 */
export function ReminderSettings({
  userPlantId,
  reminders,
}: {
  userPlantId: string;
  reminders: Reminder[];
}) {
  const { notify } = useToast();
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<Record<string, Reminder>>(() => {
    const map: Record<string, Reminder> = {};
    for (const item of KINDS) {
      const existing = reminders.find((reminder) => reminder.kind === item.kind);
      map[item.kind] = existing ?? {
        kind: item.kind,
        enabled: false,
        intervalDays: item.defaultInterval,
        preferredHour: 9,
      };
    }
    return map;
  });

  function save(kind: ReminderKind, next: Reminder) {
    setState((current) => ({ ...current, [kind]: next }));
    startTransition(async () => {
      const result = await saveReminderAction({ userPlantId, ...next });
      if (!result.ok) notify(result.message, 'error');
    });
  }

  return (
    <div className="rounded-lg border border-ink-200 bg-white p-4">
      <h2 className="text-base font-semibold">Lembretes</h2>

      <Alert tone="info" className="mt-3">
        O BROTA não manda regar em dia fixo. Ele lembra você de{' '}
        <strong>conferir</strong> — quem decide é você, olhando a planta.
      </Alert>

      <div className="mt-4 space-y-4">
        {KINDS.map((item) => {
          const reminder = state[item.kind]!;
          return (
            <div key={item.kind}>
              <Switch
                id={`reminder-${item.kind}`}
                label={item.label}
                checked={reminder.enabled}
                disabled={pending}
                onChange={(event) =>
                  save(item.kind, {
                    ...reminder,
                    enabled: event.currentTarget.checked,
                  })
                }
              />

              {reminder.enabled ? (
                <div className="mt-2 flex items-center gap-2 pl-0.5">
                  <label
                    htmlFor={`interval-${item.kind}`}
                    className="text-xs text-ink-500"
                  >
                    A cada
                  </label>
                  <Select
                    id={`interval-${item.kind}`}
                    value={String(reminder.intervalDays)}
                    disabled={pending}
                    onChange={(event) =>
                      save(item.kind, {
                        ...reminder,
                        intervalDays: Number(event.target.value),
                      })
                    }
                    className="h-9 w-auto text-xs"
                  >
                    {[2, 3, 4, 7, 14, 30, 60, 90, 180, 365].map((days) => (
                      <option key={days} value={days}>
                        {days === 1 ? '1 dia' : `${days} dias`}
                      </option>
                    ))}
                  </Select>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <p className="mt-4 border-t border-ink-100 pt-3 text-xs text-ink-500">
        As notificações chegam quando você instala o BROTA no celular e autoriza
        os avisos do navegador.
      </p>
    </div>
  );
}
