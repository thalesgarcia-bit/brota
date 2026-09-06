'use server';

import { revalidatePath } from 'next/cache';
import type { Role } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import { assertPermission, AuthorizationError } from '@/lib/auth/session';
import { hashPassword } from '@/lib/auth/password';
import {
  handleReportSchema,
  reviewSuggestionSchema,
} from '@/lib/validation/community';

type Result = { ok: boolean; message: string };

/* ===========================================================================
 * REVISÃO DE SUGESTÕES
 * SUGESTÃO → REVISÃO → APROVAÇÃO → PUBLICAÇÃO
 * Cada passo registra quem sugeriu, o que mudou, o valor anterior, o valor
 * novo, quem aprovou e quando.
 * =========================================================================== */

/** Campos de texto que a aprovação pode aplicar diretamente ao registro. */
const APPLICABLE_FIELDS = new Set([
  'description',
  'substrate',
  'fertilization',
  'pruning',
  'propagation',
  'flowering',
  'commonProblems',
  'commonPests',
  'commonMistakes',
  'curiosity',
  'toxicityNote',
]);

export async function reviewSuggestionAction(payload: unknown): Promise<Result> {
  let staff;
  try {
    staff = await assertPermission('admin:review_suggestions');
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, message: error.message };
    }
    throw error;
  }

  const parsed = reviewSuggestionSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, message: 'Dados inválidos.' };

  const { id, decision, reviewNote, applyToPlant } = parsed.data;

  const suggestion = await prisma.plantSuggestion.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      plantId: true,
      field: true,
      currentValue: true,
      suggestedValue: true,
      status: true,
      plant: { select: { slug: true, scientificName: true } },
    },
  });

  if (!suggestion) return { ok: false, message: 'Sugestão não encontrada.' };
  if (suggestion.status !== 'PENDING') {
    return { ok: false, message: 'Esta sugestão já foi revisada.' };
  }

  const approved = decision === 'APPROVED';

  await prisma.plantSuggestion.update({
    where: { id },
    data: {
      status: decision,
      reviewedById: staff.id,
      reviewedAt: new Date(),
      reviewNote,
    },
  });

  // Aplica a mudança ao registro oficial, quando pedido e possível.
  let applied = false;
  if (
    approved &&
    applyToPlant &&
    suggestion.plantId &&
    APPLICABLE_FIELDS.has(suggestion.field)
  ) {
    await prisma.plant.update({
      where: { id: suggestion.plantId },
      data: {
        [suggestion.field]: suggestion.suggestedValue,
        dataQuality: 'COMMUNITY',
      },
    });
    applied = true;
  }

  await prisma.auditLog.create({
    data: {
      actorId: staff.id,
      action: approved ? 'suggestion.approve' : 'suggestion.reject',
      entityType: 'PlantSuggestion',
      entityId: id,
      before: {
        field: suggestion.field,
        value: suggestion.currentValue,
        status: 'PENDING',
      },
      after: {
        field: suggestion.field,
        value: approved ? suggestion.suggestedValue : suggestion.currentValue,
        status: decision,
        appliedToPlant: applied,
      },
    },
  });

  await prisma.notification.create({
    data: {
      userId: suggestion.userId,
      type: approved ? 'SUGGESTION_APPROVED' : 'SUGGESTION_REJECTED',
      title: approved
        ? 'Sua sugestão foi aprovada'
        : 'Sua sugestão não foi aplicada',
      body:
        reviewNote ??
        (approved
          ? 'Obrigado por ajudar a base do BROTA a crescer.'
          : 'A equipe avaliou a sugestão e decidiu não aplicá-la desta vez.'),
      linkUrl: suggestion.plant ? `/plantas/${suggestion.plant.slug}` : '/explorar',
    },
  });

  if (approved) {
    const achievement = await prisma.achievement.findUnique({
      where: { slug: 'colaborador' },
      select: { id: true },
    });
    if (achievement) {
      await prisma.userAchievement
        .create({
          data: { userId: suggestion.userId, achievementId: achievement.id },
        })
        .catch(() => undefined);
    }
  }

  revalidatePath('/admin/sugestoes');
  if (suggestion.plant) revalidatePath(`/plantas/${suggestion.plant.slug}`);

  return {
    ok: true,
    message: approved
      ? applied
        ? 'Sugestão aprovada e aplicada à ficha da espécie.'
        : 'Sugestão aprovada. Aplique manualmente se for o caso.'
      : 'Sugestão recusada e usuário avisado.',
  };
}

/* ===========================================================================
 * DENÚNCIAS
 * =========================================================================== */

export async function handleReportAction(payload: unknown): Promise<Result> {
  let staff;
  try {
    staff = await assertPermission('moderation:handle_reports');
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, message: error.message };
    }
    throw error;
  }

  const parsed = handleReportSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, message: 'Dados inválidos.' };

  const { id, decision, action, resolution } = parsed.data;

  const report = await prisma.report.findUnique({
    where: { id },
    select: { id: true, targetType: true, targetId: true, status: true },
  });

  if (!report) return { ok: false, message: 'Denúncia não encontrada.' };

  if (action !== 'none') {
    const status = action === 'hide_content' ? 'HIDDEN_BY_MODERATION' : 'REMOVED_BY_AUTHOR';

    if (report.targetType === 'POST') {
      await prisma.post.update({ where: { id: report.targetId }, data: { status } });
    } else if (report.targetType === 'COMMENT') {
      await prisma.comment.update({
        where: { id: report.targetId },
        data: { status },
      });
    }

    await prisma.moderationAction.create({
      data: {
        moderatorId: staff.id,
        targetType: report.targetType,
        targetId: report.targetId,
        action,
        reason: resolution,
      },
    });
  }

  await prisma.report.update({
    where: { id },
    data: {
      status: decision,
      handledById: staff.id,
      handledAt: new Date(),
      resolution,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: staff.id,
      action: 'report.handle',
      entityType: 'Report',
      entityId: id,
      before: { status: report.status },
      after: { status: decision, action },
    },
  });

  revalidatePath('/admin/denuncias');
  revalidatePath('/feed');

  return { ok: true, message: 'Denúncia tratada.' };
}

/* ===========================================================================
 * USUÁRIOS
 * =========================================================================== */

export async function changeUserRoleAction(
  userId: string,
  role: Role,
): Promise<Result> {
  let staff;
  try {
    staff = await assertPermission('admin:manage_users');
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, message: error.message };
    }
    throw error;
  }

  if (userId === staff.id) {
    return { ok: false, message: 'Você não pode alterar o seu próprio papel.' };
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, deletedAt: true },
  });

  if (!target || target.deletedAt) {
    return { ok: false, message: 'Usuário não encontrado.' };
  }

  await prisma.user.update({ where: { id: userId }, data: { role } });

  await prisma.auditLog.create({
    data: {
      actorId: staff.id,
      action: 'user.role_change',
      entityType: 'User',
      entityId: userId,
      before: { role: target.role },
      after: { role },
    },
  });

  revalidatePath('/admin/usuarios');
  return { ok: true, message: 'Papel atualizado.' };
}

/* ===========================================================================
 * MODERAÇÃO DIRETA DE CONTEÚDO
 * =========================================================================== */

export async function moderateContentAction(
  targetType: 'POST' | 'COMMENT',
  targetId: string,
  hide: boolean,
): Promise<Result> {
  let staff;
  try {
    staff = await assertPermission('moderation:hide_content');
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, message: error.message };
    }
    throw error;
  }

  const status = hide ? 'HIDDEN_BY_MODERATION' : 'PUBLISHED';

  if (targetType === 'POST') {
    await prisma.post.update({ where: { id: targetId }, data: { status } });
  } else {
    await prisma.comment.update({ where: { id: targetId }, data: { status } });
  }

  await prisma.moderationAction.create({
    data: {
      moderatorId: staff.id,
      targetType,
      targetId,
      action: hide ? 'hide' : 'restore',
    },
  });

  revalidatePath('/admin/publicacoes');
  revalidatePath('/admin/comentarios');
  revalidatePath('/feed');

  return { ok: true, message: hide ? 'Conteúdo ocultado.' : 'Conteúdo restaurado.' };
}

/* ===========================================================================
 * QUALIDADE DA BASE BOTÂNICA
 * =========================================================================== */

export async function setPlantDataQualityAction(
  plantId: string,
  quality: 'SEED_UNREVIEWED' | 'COMMUNITY' | 'REVIEWED',
): Promise<Result> {
  let staff;
  try {
    staff = await assertPermission('admin:manage_plants');
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, message: error.message };
    }
    throw error;
  }

  const plant = await prisma.plant.findUnique({
    where: { id: plantId },
    select: { dataQuality: true, slug: true, _count: { select: { sources: true } } },
  });

  if (!plant) return { ok: false, message: 'Espécie não encontrada.' };

  if (quality === 'REVIEWED' && plant._count.sources === 0) {
    return {
      ok: false,
      message:
        'Não é possível marcar como revisada sem ao menos uma fonte cadastrada.',
    };
  }

  await prisma.plant.update({
    where: { id: plantId },
    data: { dataQuality: quality },
  });

  await prisma.auditLog.create({
    data: {
      actorId: staff.id,
      action: 'plant.quality_change',
      entityType: 'Plant',
      entityId: plantId,
      before: { dataQuality: plant.dataQuality },
      after: { dataQuality: quality },
    },
  });

  revalidatePath('/admin/plantas');
  revalidatePath(`/plantas/${plant.slug}`);

  return { ok: true, message: 'Situação da ficha atualizada.' };
}

/**
 * Redefine a senha de um usuário e devolve uma senha temporária.
 *
 * Por que isto existe: o BROTA ainda não tem provedor de e-mail configurado,
 * então o link de recuperação não chega a ninguém. Num contexto escolar isso
 * seria um bloqueio real — aluno que esquece a senha ficaria sem acesso.
 *
 * Aqui o professor gera uma senha temporária, entrega em mãos e o aluno troca
 * depois em Configurações. A senha aparece uma única vez na tela: no banco só
 * fica o hash, como qualquer outra.
 */
export async function resetUserPasswordAction(
  userId: string,
): Promise<Result & { temporaryPassword?: string }> {
  let staff;
  try {
    staff = await assertPermission('admin:manage_users');
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, message: error.message };
    }
    throw error;
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, deletedAt: true, role: true },
  });

  if (!target || target.deletedAt) {
    return { ok: false, message: 'Usuário não encontrado.' };
  }

  // Outro administrador não tem a senha redefinida por aqui — seria uma porta
  // fácil demais para tomar a conta de quem tem mais poder.
  if (target.role === 'ADMIN' && target.id !== staff.id) {
    return {
      ok: false,
      message:
        'Contas de administrador não podem ter a senha redefinida por outro administrador.',
    };
  }

  const temporaryPassword = generateTemporaryPassword();

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(temporaryPassword) },
  });

  await prisma.notification.create({
    data: {
      userId,
      type: 'ADMIN_NOTICE',
      title: 'Sua senha foi redefinida',
      body: 'A equipe gerou uma senha temporária para você. Troque por uma senha sua em Configurações.',
      linkUrl: '/configuracoes',
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: staff.id,
      action: 'user.password_reset',
      entityType: 'User',
      entityId: userId,
      after: { by: staff.id },
    },
  });

  revalidatePath('/admin/usuarios');

  return {
    ok: true,
    message: 'Senha redefinida. Anote agora — ela não aparece de novo.',
    temporaryPassword,
  };
}

/**
 * Senha temporária fácil de ditar em voz alta: duas palavras e três dígitos,
 * sem caracteres que se confundem ao ler.
 */
function generateTemporaryPassword(): string {
  const words = [
    'broto', 'folha', 'raiz', 'flor', 'seiva', 'caule', 'fruto', 'semente',
    'jardim', 'verde', 'orvalho', 'cacto', 'musgo', 'poda', 'vaso', 'terra',
  ];

  const pick = () => words[Math.floor(Math.random() * words.length)] as string;
  const digits = String(Math.floor(Math.random() * 900) + 100);

  return `${pick()}-${pick()}${digits}`;
}
