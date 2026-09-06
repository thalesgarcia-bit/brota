'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { moderateContentAction } from '@/server/actions/admin';

export function ModerationToggle({
  targetType,
  targetId,
  hidden,
}: {
  targetType: 'POST' | 'COMMENT';
  targetId: string;
  hidden: boolean;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant={hidden ? 'outline' : 'ghost'}
      iconLeft={hidden ? 'eye' : 'eyeOff'}
      loading={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await moderateContentAction(targetType, targetId, !hidden);
          notify(result.message, result.ok ? 'success' : 'error');
          if (result.ok) router.refresh();
        })
      }
    >
      {hidden ? 'Restaurar' : 'Ocultar'}
    </Button>
  );
}
