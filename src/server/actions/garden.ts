'use server';

import { revalidatePath } from 'next/cache';

import { prisma } from '@/lib/db/prisma';
import { assertPermission, AuthorizationError } from '@/lib/auth/session';
import {
  createDiaryEntrySchema,
  createUserPlantSchema,
  reminderSchema,
  updateUserPlantSchema,
} from '@/lib/validation/garden';
import type { FormState } from './account';
import { grantAchievement } from './plants';

function fieldErrors(error: {
  issues: { path: (string | number)[]; message: string }[];
}): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    result[key] ??= issue.message;
  }
  return result;
}

/** Garante que a planta pertence a quem está pedindo a alteração. */
async function ownedUserPlant(userId: string, userPlantId: string) {
  return prisma.userPlant.findFirst({
    where: { id: userPlantId, userId },
    select: { id: true },
  });
}

export async function createUserPlantAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  let user;
  try {
    user = await assertPermission('garden:manage');
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { status: 'error', message: error.message };
    }
    throw error;
  }

  const parsed = createUserPlantSchema.safeParse({
    nickname: formData.get('nickname'),
    plantId: formData.get('plantId') || null,
    customSpeciesName: formData.get('customSpeciesName') || null,
    photoUrl: formData.get('photoUrl') || null,
    acquiredAt: formData.get('acquiredAt') || null,
    location: formData.get('location') || null,
    lightExposure: formData.get('lightExposure') || null,
    notes: formData.get('notes') || null,
  });

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Confira os campos destacados.',
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  const created = await prisma.userPlant.create({
    data: { userId: user.id, ...parsed.data },
    select: { id: true },
  });

  if (parsed.data.plantId) {
    await prisma.recommendationFeedback.create({
      data: {
        userId: user.id,
        plantId: parsed.data.plantId,
        action: 'ADDED_TO_GARDEN',
      },
    });
  }

  await grantAchievement(user.id, 'primeiro-broto');
  await checkNativeGuardian(user.id);

  revalidatePath('/jardim');
  return {
    status: 'success',
    message: 'Planta adicionada ao seu jardim.',
    fieldErrors: { id: created.id },
  };
}

export async function updateUserPlantAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  let user;
  try {
    user = await assertPermission('garden:manage');
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { status: 'error', message: error.message };
    }
    throw error;
  }

  const parsed = updateUserPlantSchema.safeParse({
    id: formData.get('id'),
    nickname: formData.get('nickname') ?? undefined,
    location: formData.get('location') ?? undefined,
    lightExposure: formData.get('lightExposure') || null,
    notes: formData.get('notes') ?? undefined,
    photoUrl: formData.get('photoUrl') ?? undefined,
  });

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Confira os campos destacados.',
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  const { id, ...data } = parsed.data;

  if (!(await ownedUserPlant(user.id, id))) {
    return { status: 'error', message: 'Planta não encontrada no seu jardim.' };
  }

  await prisma.userPlant.update({ where: { id }, data });

  revalidatePath('/jardim');
  revalidatePath(`/jardim/${id}`);
  return { status: 'success', message: 'Alterações salvas.' };
}

export async function removeUserPlantAction(
  userPlantId: string,
): Promise<{ ok: boolean; message: string }> {
  try {
    const user = await assertPermission('garden:manage');

    if (!(await ownedUserPlant(user.id, userPlantId))) {
      return { ok: false, message: 'Planta não encontrada no seu jardim.' };
    }

    await prisma.userPlant.delete({ where: { id: userPlantId } });
    revalidatePath('/jardim');
    return { ok: true, message: 'Planta removida do seu jardim.' };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, message: error.message };
    }
    throw error;
  }
}

/** Registro no Diário Verde. */
export async function createDiaryEntryAction(
  payload: unknown,
): Promise<{ ok: boolean; message: string }> {
  try {
    const user = await assertPermission('garden:manage');

    const parsed = createDiaryEntrySchema.safeParse(payload);
    if (!parsed.success) {
      return {
        ok: false,
        message: parsed.error.issues[0]?.message ?? 'Dados inválidos.',
      };
    }

    if (!(await ownedUserPlant(user.id, parsed.data.userPlantId))) {
      return { ok: false, message: 'Planta não encontrada no seu jardim.' };
    }

    await prisma.diaryEntry.create({ data: parsed.data });

    // A rega mais recente fica também na planta, para os lembretes.
    if (parsed.data.type === 'WATERING') {
      await prisma.userPlant.update({
        where: { id: parsed.data.userPlantId },
        data: { lastWateredAt: parsed.data.occurredAt },
      });
    }

    const entries = await prisma.diaryEntry.count({
      where: { userPlant: { userId: user.id } },
    });
    if (entries >= 10) await grantAchievement(user.id, 'jardineiro-iniciante');

    revalidatePath(`/jardim/${parsed.data.userPlantId}`);
    revalidatePath('/jardim');

    return { ok: true, message: 'Registro adicionado ao Diário Verde.' };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, message: error.message };
    }
    throw error;
  }
}

export async function saveReminderAction(
  payload: unknown,
): Promise<{ ok: boolean; message: string }> {
  try {
    const user = await assertPermission('garden:manage');

    const parsed = reminderSchema.safeParse(payload);
    if (!parsed.success) {
      return { ok: false, message: 'Dados inválidos.' };
    }

    if (!(await ownedUserPlant(user.id, parsed.data.userPlantId))) {
      return { ok: false, message: 'Planta não encontrada no seu jardim.' };
    }

    const { userPlantId, kind, ...rest } = parsed.data;

    await prisma.reminderPreference.upsert({
      where: { userPlantId_kind: { userPlantId, kind } },
      create: { userPlantId, kind, ...rest },
      update: rest,
    });

    revalidatePath(`/jardim/${userPlantId}`);
    return { ok: true, message: 'Lembrete atualizado.' };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, message: error.message };
    }
    throw error;
  }
}

/** Conquista concedida a quem cultiva três ou mais espécies nativas. */
async function checkNativeGuardian(userId: string): Promise<void> {
  const natives = await prisma.userPlant.count({
    where: { userId, isActive: true, plant: { isNative: true } },
  });
  if (natives >= 3) await grantAchievement(userId, 'guardiao-da-biodiversidade');
}
