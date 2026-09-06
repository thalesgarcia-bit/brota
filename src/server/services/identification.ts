import 'server-only';

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import type { IdentificationStatus } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import { serverEnv } from '@/lib/env';
import {
  getPlantIdentificationProvider,
  identificationThreshold,
  IdentificationError,
  type IdentificationResultDTO,
  type PlantOrgan,
} from '@/domain/identification';
import { findPlantByScientificName } from '@/server/services/plants';

/* ===========================================================================
 * FLUXO DE IDENTIFICAÇÃO
 *
 * upload → provedor → candidatos → confiança → base local → resultado
 *                                        ↓ abaixo do limiar
 *                                  fila administrativa
 * =========================================================================== */

/** Lê do armazenamento local a imagem já processada, para enviar ao provedor. */
async function loadStoredImage(publicUrl: string): Promise<Blob> {
  const env = serverEnv();
  const prefix = env.STORAGE_PUBLIC_PREFIX.replace(/\/$/, '');

  if (!publicUrl.startsWith(`${prefix}/`)) {
    throw new IdentificationError('image_rejected', 'Caminho de imagem inválido.');
  }

  const relative = publicUrl.slice(prefix.length + 1);
  const baseDir = path.resolve(process.cwd(), env.STORAGE_LOCAL_DIR);
  const target = path.resolve(baseDir, relative);

  // Impede que um caminho manipulado escape do diretório de uploads.
  if (!target.startsWith(baseDir)) {
    throw new IdentificationError('image_rejected', 'Caminho de imagem inválido.');
  }

  const buffer = await readFile(target);
  return new Blob([new Uint8Array(buffer)], { type: 'image/webp' });
}

export type IdentificationOutcome = {
  requestId: string;
  status: 'identified' | 'low_confidence' | 'no_results';
  topScore: number | null;
  candidates: {
    scientificName: string;
    commonNames: string[];
    family: string | null;
    score: number;
    plantSlug: string | null;
    referenceImageUrl: string | null;
  }[];
  remainingRequests: number | null;
};

export async function runIdentification(input: {
  userId: string;
  imageUrl: string;
  organ: PlantOrgan;
  note: string | null;
}): Promise<IdentificationOutcome> {
  const provider = getPlantIdentificationProvider();
  const threshold = identificationThreshold();

  const request = await prisma.identificationRequest.create({
    data: {
      userId: input.userId,
      imageUrl: input.imageUrl,
      organ: input.organ,
      note: input.note,
      status: 'AWAITING_PROVIDER',
      providerName: provider.name,
    },
  });

  let result: IdentificationResultDTO;
  try {
    const image = await loadStoredImage(input.imageUrl);
    result = await provider.identify({
      image,
      fileName: 'planta.webp',
      organ: input.organ,
      maxResults: 5,
    });
  } catch (error) {
    // O pedido não some quando o provedor falha: vai para a fila da equipe.
    await prisma.identificationRequest.update({
      where: { id: request.id },
      data: {
        status: 'AWAITING_REVIEW',
        adminNotes:
          error instanceof IdentificationError
            ? `Falha do provedor (${error.code}): ${error.message}`
            : 'Falha inesperada ao consultar o provedor.',
      },
    });
    throw error;
  }

  // Cruza cada candidato com a base local pelo nome científico.
  const candidates = await Promise.all(
    result.candidates.map(async (candidate, index) => {
      const local = await findPlantByScientificName(candidate.scientificName);
      return {
        ...candidate,
        rank: index + 1,
        plantId: local?.id ?? null,
        plantSlug: local?.slug ?? null,
      };
    }),
  );

  if (candidates.length > 0) {
    await prisma.identificationCandidate.createMany({
      data: candidates.map((candidate) => ({
        requestId: request.id,
        rank: candidate.rank,
        scientificName: candidate.scientificName,
        commonNames: candidate.commonNames,
        family: candidate.family,
        score: candidate.score,
        plantId: candidate.plantId,
      })),
    });
  }

  const topScore = result.topScore;
  const confident = topScore !== null && topScore >= threshold;

  await prisma.identificationRequest.update({
    where: { id: request.id },
    data: {
      status: confident ? 'RESOLVED_BY_PROVIDER' : 'AWAITING_REVIEW',
      topScore,
      providerRaw: result.raw as object,
      resolvedPlantId: confident ? (candidates[0]?.plantId ?? null) : null,
    },
  });

  return {
    requestId: request.id,
    status:
      candidates.length === 0
        ? 'no_results'
        : confident
          ? 'identified'
          : 'low_confidence',
    topScore,
    candidates: candidates.map((candidate) => ({
      scientificName: candidate.scientificName,
      commonNames: candidate.commonNames,
      family: candidate.family,
      score: candidate.score,
      plantSlug: candidate.plantSlug,
      referenceImageUrl: candidate.referenceImageUrl ?? null,
    })),
    remainingRequests: result.remainingRequests ?? null,
  };
}

export async function listPendingIdentifications(status?: IdentificationStatus) {
  return prisma.identificationRequest.findMany({
    where: status
      ? { status }
      : { status: { in: ['AWAITING_REVIEW', 'IN_REVIEW', 'NEEDS_MORE_INFO'] } },
    orderBy: { createdAt: 'asc' },
    include: {
      user: { select: { profile: { select: { username: true, displayName: true } } } },
      candidates: { orderBy: { rank: 'asc' } },
    },
  });
}

export async function getIdentificationRequest(id: string) {
  return prisma.identificationRequest.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, profile: { select: { username: true, displayName: true } } } },
      candidates: { orderBy: { rank: 'asc' }, include: { plant: { select: { slug: true } } } },
      resolvedPlant: { select: { slug: true, scientificName: true } },
      resolvedBy: { select: { profile: { select: { displayName: true } } } },
    },
  });
}
