import { NextResponse } from 'next/server';

import { assertPermission, AuthorizationError } from '@/lib/auth/session';
import {
  assertValidImage,
  getStorageProvider,
  maxUploadBytes,
  UploadError,
  UPLOAD_ERROR_MESSAGES,
} from '@/domain/storage';

export const runtime = 'nodejs';

const ALLOWED_FOLDERS = new Set([
  'posts',
  'garden',
  'avatars',
  'plants',
  'identifications',
]);

/**
 * Upload de imagem.
 *
 * A foto chega já comprimida e convertida para WebP pelo navegador, mas nada
 * disso é levado na palavra: aqui o arquivo é conferido pela assinatura
 * binária, não pela extensão nem pelo Content-Type informado pelo cliente.
 */
export async function POST(request: Request) {
  try {
    await assertPermission('post:create');
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    throw error;
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: 'Não conseguimos ler o arquivo enviado.' },
      { status: 400 },
    );
  }

  const file = formData.get('file');
  const thumbnailPart = formData.get('thumbnail');
  const folderRaw = String(formData.get('folder') ?? 'posts');
  const folder = ALLOWED_FOLDERS.has(folderRaw) ? folderRaw : 'posts';

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Envie um arquivo.' }, { status: 400 });
  }

  const limit = maxUploadBytes();
  if (file.size > limit) {
    return NextResponse.json(
      { error: UPLOAD_ERROR_MESSAGES.too_large },
      { status: 413 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const thumbnail =
    thumbnailPart instanceof File && thumbnailPart.size <= limit
      ? Buffer.from(await thumbnailPart.arrayBuffer())
      : undefined;

  const width = Number(formData.get('width')) || undefined;
  const height = Number(formData.get('height')) || undefined;

  try {
    assertValidImage(buffer, limit);
    if (thumbnail) assertValidImage(thumbnail, limit);

    const stored = await getStorageProvider().storeImage({
      buffer,
      thumbnail,
      width,
      height,
      originalName: file.name,
      folder,
    });

    return NextResponse.json(stored, { status: 201 });
  } catch (error) {
    if (error instanceof UploadError) {
      const status = error.code === 'too_large' ? 413 : 400;
      return NextResponse.json(
        { error: UPLOAD_ERROR_MESSAGES[error.code] },
        { status },
      );
    }
    throw error;
  }
}
