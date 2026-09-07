'use server';

import { revalidatePath } from 'next/cache';

import { prisma } from '@/lib/db/prisma';
import { assertPermission, AuthorizationError } from '@/lib/auth/session';
import { createSuggestionSchema } from '@/lib/validation/community';
import type { FormState } from './form-state';

type ToggleResult = {
  ok: boolean;
  active: boolean;
  message?: string;
};

/** Salvar / remover dos salvos. */
export async function toggleSavePlantAction(
  plantId: string,
): Promise<ToggleResult> {
  try {
    const user = await assertPermission('post:save');

    const existing = await prisma.savedItem.findFirst({
      where: { userId: user.id, plantId },
      select: { id: true },
    });

    if (existing) {
      await prisma.savedItem.delete({ where: { id: existing.id } });
      await prisma.recommendationFeedback.create({
        data: { userId: user.id, plantId, action: 'DISMISSED' },
      });
      revalidatePath('/salvos');
      return { ok: true, active: false, message: 'Removida dos salvos.' };
    }

    await prisma.savedItem.create({
      data: { userId: user.id, kind: 'PLANT', plantId },
    });
    await prisma.recommendationFeedback.create({
      data: { userId: user.id, plantId, action: 'SAVED' },
    });

    revalidatePath('/salvos');
    return { ok: true, active: true, message: 'Salva na sua lista.' };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, active: false, message: error.message };
    }
    throw error;
  }
}

/** Adiciona a espécie ao Meu Jardim com um apelido inicial. */
export async function addPlantToGardenAction(
  plantId: string,
  nickname: string,
): Promise<ToggleResult> {
  try {
    const user = await assertPermission('garden:manage');

    const plant = await prisma.plant.findUnique({
      where: { id: plantId },
      select: { id: true, commonNames: { where: { isPrimary: true }, take: 1 } },
    });

    if (!plant) {
      return { ok: false, active: false, message: 'Espécie não encontrada.' };
    }

    const label =
      nickname.trim() || plant.commonNames[0]?.name || 'Minha planta';

    await prisma.userPlant.create({
      data: { userId: user.id, plantId, nickname: label.slice(0, 60) },
    });

    await prisma.recommendationFeedback.create({
      data: { userId: user.id, plantId, action: 'ADDED_TO_GARDEN' },
    });

    await grantAchievement(user.id, 'primeiro-broto');

    revalidatePath('/jardim');
    return { ok: true, active: true, message: 'Adicionada ao seu jardim.' };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, active: false, message: error.message };
    }
    throw error;
  }
}

/** Sugestão de correção ou acréscimo na base botânica. */
export async function createSuggestionAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  let user;
  try {
    user = await assertPermission('plant:suggest');
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { status: 'error', message: error.message };
    }
    throw error;
  }

  const parsed = createSuggestionSchema.safeParse({
    plantId: formData.get('plantId'),
    field: formData.get('field'),
    suggestedValue: formData.get('suggestedValue'),
    justification: formData.get('justification') || null,
    sourceUrl: formData.get('sourceUrl') || null,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? 'form');
      fieldErrors[key] ??= issue.message;
    }
    return { status: 'error', message: 'Confira os campos.', fieldErrors };
  }

  const plant = await prisma.plant.findUnique({
    where: { id: parsed.data.plantId },
    select: {
      id: true,
      description: true,
      substrate: true,
      fertilization: true,
      pruning: true,
      propagation: true,
      flowering: true,
      commonProblems: true,
      commonPests: true,
      commonMistakes: true,
      curiosity: true,
      toxicityNote: true,
    },
  });

  if (!plant) {
    return { status: 'error', message: 'Espécie não encontrada.' };
  }

  const currentValue =
    (plant as unknown as Record<string, string | null>)[parsed.data.field] ?? null;

  await prisma.plantSuggestion.create({
    data: {
      plantId: parsed.data.plantId,
      userId: user.id,
      field: parsed.data.field,
      currentValue,
      suggestedValue: parsed.data.suggestedValue,
      justification: parsed.data.justification,
      sourceUrl: parsed.data.sourceUrl,
    },
  });

  return {
    status: 'success',
    message:
      'Sugestão enviada. A equipe vai revisar antes de publicar — você recebe um aviso quando isso acontecer.',
  };
}

/** Concede uma conquista, sem duplicar nem falhar o fluxo principal. */
export async function grantAchievement(
  userId: string,
  slug: string,
): Promise<void> {
  const achievement = await prisma.achievement.findUnique({
    where: { slug },
    select: { id: true, name: true },
  });
  if (!achievement) return;

  const existing = await prisma.userAchievement.findUnique({
    where: {
      userId_achievementId: { userId, achievementId: achievement.id },
    },
  });
  if (existing) return;

  await prisma.userAchievement.create({
    data: { userId, achievementId: achievement.id },
  });

  await prisma.notification.create({
    data: {
      userId,
      type: 'ACHIEVEMENT',
      title: `Conquista desbloqueada: ${achievement.name}`,
      linkUrl: '/perfil',
    },
  });
}
