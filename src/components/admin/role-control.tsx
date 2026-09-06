'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Role } from '@prisma/client';

import { Select } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { ROLE_LABELS } from '@/lib/auth/rbac';
import { changeUserRoleAction } from '@/server/actions/admin';

export function RoleControl({
  userId,
  role,
  disabled,
}: {
  userId: string;
  role: Role;
  disabled?: boolean;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <>
      <label htmlFor={`papel-${userId}`} className="sr-only">
        Papel do usuário
      </label>
      <Select
        id={`papel-${userId}`}
        value={role}
        disabled={disabled || pending}
        className="h-9 w-auto text-xs"
        onChange={(event) => {
          const next = event.target.value as Role;
          startTransition(async () => {
            const result = await changeUserRoleAction(userId, next);
            notify(result.message, result.ok ? 'success' : 'error');
            router.refresh();
          });
        }}
      >
        {Object.entries(ROLE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
    </>
  );
}
