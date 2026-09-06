'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { prisma } from '@/lib/db/prisma';
import { requireUser } from '@/lib/auth/session';
import { onboardingSchema } from '@/lib/validation/onboarding';
import { computeGreenProfile, toSnapshot } from '@/domain/recommendation/green-profile';
import { rankPlantsForProfile } from '@/domain/recommendation/engine';
import { loadPlantSnapshots } from '@/server/services/plants';

/**
 * Conclui o questionário do Perfil Verde e já calcula as recomendações.
 *
 * O cálculo acontece aqui, uma vez, e é persistido: assim a lista é estável
 * entre visitas e podemos medir o que o usuário fez com cada indicação.
 */
export async function completeOnboardingAction(
  payload: unknown,
): Promise<{ ok: boolean; message?: string }> {
  const user = await requireUser();

  const parsed = onboardingSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? 'Confira as respostas.',
    };
  }

  const answers = parsed.data;
  const computed = computeGreenProfile(answers);

  const data = {
    housing: answers.housing,
    placements: answers.placements,
    light: answers.lightUnsure ? null : answers.light,
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
    profileKey: computed.key,
    profileLabel: computed.label,
    profileSummary: computed.summary,
  };

  await prisma.greenProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...data },
    update: data,
  });

  await regenerateRecommendations(user.id);

  revalidatePath('/recomendacoes');
  revalidatePath('/feed');

  return { ok: true };
}

/** Recalcula e persiste as recomendações do usuário. */
export async function regenerateRecommendations(userId: string): Promise<number> {
  const profile = await prisma.greenProfile.findUnique({ where: { userId } });
  if (!profile) return 0;

  const plants = await loadPlantSnapshots();
  const ranked = rankPlantsForProfile(toSnapshot(profile), plants, { limit: 30 });

  await prisma.$transaction([
    prisma.recommendation.deleteMany({ where: { userId } }),
    prisma.recommendation.createMany({
      data: ranked.map((item) => ({
        userId,
        plantId: item.plant.id,
        score: item.score,
        reasons: item.reasons,
        warnings: item.warnings,
      })),
    }),
  ]);

  return ranked.length;
}

export async function regenerateMyRecommendationsAction(): Promise<void> {
  const user = await requireUser();
  await regenerateRecommendations(user.id);
  revalidatePath('/recomendacoes');
  redirect('/recomendacoes');
}
