'use server';

import { revalidatePath } from 'next/cache';

import { prisma } from '@/lib/db/prisma';
import {
  assertPermission,
  AuthorizationError,
} from '@/lib/auth/session';
import {
  IdentificationError,
  IDENTIFICATION_ERROR_MESSAGES,
} from '@/domain/identification';
import {
  escalateIdentificationSchema,
  identifyRequestSchema,
  resolveIdentificationSchema,
} from '@/lib/validation/identification';
import {
  runIdentification,
  type IdentificationOutcome,
} from '@/server/services/identification';
import { grantAchievement } from './plants';

type IdentifyResponse =
  | { ok: true; outcome: IdentificationOutcome }
  | { ok: false; message: string; code?: string };

export async function identifyPlantAction(
  payload: unknown,
): Promise<IdentifyResponse> {
  let user;
  try {
    user = await assertPermission('identification:create');
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, message: error.message };
    }
    throw error;
  }

  const parsed = identifyRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? 'Envie uma foto válida.',
    };
  }

  try {
    const outcome = await runIdentification({
      userId: user.id,
      imageUrl: parsed.data.imageUrl,
      organ: parsed.data.organ,
      note: parsed.data.note,
    });

    await grantAchievement(user.id, 'identificador');

    return { ok: true, outcome };
  } catch (error) {
    if (error instanceof IdentificationError) {
      return {
        ok: false,
        code: error.code,
        message: IDENTIFICATION_ERROR_MESSAGES[error.code],
      };
    }
    throw error;
  }
}

/** O usuário decide mandar o caso para a análise da equipe e da comunidade. */
export async function escalateIdentificationAction(
  payload: unknown,
): Promise<{ ok: boolean; message: string }> {
  let user;
  try {
    user = await assertPermission('identification:create');
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, message: error.message };
    }
    throw error;
  }

  const parsed = escalateIdentificationSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, message: 'Pedido inválido.' };
  }

  const request = await prisma.identificationRequest.findFirst({
    where: { id: parsed.data.requestId, userId: user.id },
    select: { id: true },
  });

  if (!request) {
    return { ok: false, message: 'Pedido de identificação não encontrado.' };
  }

  await prisma.identificationRequest.update({
    where: { id: request.id },
    data: {
      status: 'AWAITING_REVIEW',
      note: parsed.data.note,
    },
  });

  revalidatePath('/admin/identificacoes');

  return {
    ok: true,
    message:
      'Enviado para análise. Você recebe um aviso assim que a equipe concluir.',
  };
}

/** Resolução pelo administrador ou moderador. */
export async function resolveIdentificationAction(
  payload: unknown,
): Promise<{ ok: boolean; message: string }> {
  let staff;
  try {
    staff = await assertPermission('admin:review_identifications');
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, message: error.message };
    }
    throw error;
  }

  const parsed = resolveIdentificationSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, message: 'Dados inválidos.' };
  }

  const { requestId, action, plantId, adminNotes } = parsed.data;

  const request = await prisma.identificationRequest.findUnique({
    where: { id: requestId },
    select: { id: true, userId: true, status: true },
  });

  if (!request) return { ok: false, message: 'Pedido não encontrado.' };

  const before = { status: request.status };

  if (action === 'start_review') {
    await prisma.identificationRequest.update({
      where: { id: requestId },
      data: { status: 'IN_REVIEW', resolvedById: staff.id },
    });
    await writeAudit(staff.id, requestId, before, { status: 'IN_REVIEW' });
    revalidatePath('/admin/identificacoes');
    return { ok: true, message: 'Marcado como em análise.' };
  }

  if (action === 'link_existing') {
    if (!plantId) {
      return { ok: false, message: 'Escolha a espécie para vincular.' };
    }

    const plant = await prisma.plant.findUnique({
      where: { id: plantId },
      select: {
        slug: true,
        scientificName: true,
        commonNames: { where: { isPrimary: true }, take: 1 },
      },
    });

    if (!plant) return { ok: false, message: 'Espécie não encontrada.' };

    await prisma.$transaction([
      prisma.identificationRequest.update({
        where: { id: requestId },
        data: {
          status: 'IDENTIFIED',
          resolvedPlantId: plantId,
          resolvedById: staff.id,
          resolvedAt: new Date(),
          adminNotes,
        },
      }),
      prisma.notification.create({
        data: {
          userId: request.userId,
          type: 'IDENTIFICATION_RESOLVED',
          title: 'Sua planta foi identificada',
          body: `A equipe identificou como ${plant.commonNames[0]?.name ?? plant.scientificName}.`,
          linkUrl: `/plantas/${plant.slug}`,
        },
      }),
    ]);

    await writeAudit(staff.id, requestId, before, { status: 'IDENTIFIED', plantId });
    revalidatePath('/admin/identificacoes');
    return { ok: true, message: 'Identificação concluída e usuário avisado.' };
  }

  const statusByAction = {
    request_new_photo: 'NEEDS_MORE_INFO',
    mark_inadequate: 'INADEQUATE_IMAGE',
    close: 'CLOSED',
  } as const;

  const nextStatus = statusByAction[action];

  const notificationByAction: Record<string, { title: string; body: string }> = {
    request_new_photo: {
      title: 'Precisamos de outra foto',
      body:
        adminNotes ??
        'A equipe pediu uma nova fotografia, com a planta mais bem enquadrada e com boa luz.',
    },
    mark_inadequate: {
      title: 'Não conseguimos usar essa imagem',
      body:
        adminNotes ??
        'A imagem enviada não permite identificar a espécie. Você pode tentar de novo com outra foto.',
    },
    close: {
      title: 'Pedido de identificação encerrado',
      body: adminNotes ?? 'A equipe encerrou este pedido.',
    },
  };

  await prisma.$transaction([
    prisma.identificationRequest.update({
      where: { id: requestId },
      data: {
        status: nextStatus,
        resolvedById: staff.id,
        resolvedAt: new Date(),
        adminNotes,
      },
    }),
    prisma.notification.create({
      data: {
        userId: request.userId,
        type: 'IDENTIFICATION_RESOLVED',
        title: notificationByAction[action]!.title,
        body: notificationByAction[action]!.body,
        linkUrl: '/identificar',
      },
    }),
  ]);

  await writeAudit(staff.id, requestId, before, { status: nextStatus });
  revalidatePath('/admin/identificacoes');

  return { ok: true, message: 'Pedido atualizado e usuário avisado.' };
}

async function writeAudit(
  actorId: string,
  entityId: string,
  before: object,
  after: object,
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId,
      action: 'identification.resolve',
      entityType: 'IdentificationRequest',
      entityId,
      before,
      after,
    },
  });
}
