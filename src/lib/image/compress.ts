/* ===========================================================================
 * COMPRESSÃO DE IMAGEM NO NAVEGADOR
 *
 * A foto é redimensionada e convertida para WebP antes de sair do aparelho.
 * Três motivos:
 *
 *  1. Um celular manda foto de 6 MB. Depois disto, vai com 200 KB — diferença
 *     enorme em rede de escola e em dado móvel de aluno.
 *  2. O servidor não precisa de biblioteca nativa de imagem, o que permite
 *     hospedar em qualquer plataforma, inclusive nas que não rodam código
 *     nativo.
 *  3. A orientação EXIF é resolvida aqui: foto tirada na vertical não chega
 *     deitada.
 *
 * O servidor continua validando o conteúdo do arquivo — nada do que vem do
 * navegador é considerado confiável.
 * =========================================================================== */

export type CompressedImage = {
  full: Blob;
  thumbnail: Blob;
  width: number;
  height: number;
};

export type CompressOptions = {
  maxSize?: number;
  thumbnailSize?: number;
  quality?: number;
};

const DEFAULTS = {
  maxSize: 1600,
  thumbnailSize: 480,
  quality: 0.82,
} as const;

export class ImageCompressionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageCompressionError';
  }
}

/** Lê o arquivo respeitando a orientação registrada pela câmera. */
async function decode(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    // Navegadores sem suporte à opção ainda decodificam a imagem.
    try {
      return await createImageBitmap(file);
    } catch {
      throw new ImageCompressionError(
        'Não conseguimos ler essa imagem. Tente outro arquivo.',
      );
    }
  }
}

function scaled(
  bitmap: ImageBitmap,
  maxSize: number,
): { width: number; height: number } {
  const largest = Math.max(bitmap.width, bitmap.height);
  if (largest <= maxSize) {
    return { width: bitmap.width, height: bitmap.height };
  }
  const ratio = maxSize / largest;
  return {
    width: Math.round(bitmap.width * ratio),
    height: Math.round(bitmap.height * ratio),
  };
}

async function render(
  bitmap: ImageBitmap,
  width: number,
  height: number,
  quality: number,
  cover: boolean,
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new ImageCompressionError('Seu navegador não conseguiu processar a imagem.');
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  if (cover) {
    // Recorte centralizado, para a miniatura sair quadrada sem distorcer.
    const scale = Math.max(width / bitmap.width, height / bitmap.height);
    const drawWidth = bitmap.width * scale;
    const drawHeight = bitmap.height * scale;
    context.drawImage(
      bitmap,
      (width - drawWidth) / 2,
      (height - drawHeight) / 2,
      drawWidth,
      drawHeight,
    );
  } else {
    context.drawImage(bitmap, 0, 0, width, height);
  }

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/webp', quality);
  });

  if (!blob) {
    throw new ImageCompressionError('Não conseguimos converter a imagem.');
  }

  return blob;
}

export async function compressImage(
  file: File,
  options: CompressOptions = {},
): Promise<CompressedImage> {
  const maxSize = options.maxSize ?? DEFAULTS.maxSize;
  const thumbnailSize = options.thumbnailSize ?? DEFAULTS.thumbnailSize;
  const quality = options.quality ?? DEFAULTS.quality;

  const bitmap = await decode(file);

  try {
    const { width, height } = scaled(bitmap, maxSize);

    const full = await render(bitmap, width, height, quality, false);
    const thumbnail = await render(
      bitmap,
      thumbnailSize,
      thumbnailSize,
      0.72,
      true,
    );

    return { full, thumbnail, width, height };
  } finally {
    bitmap.close();
  }
}

/** Envia a imagem já comprimida para a aplicação. */
export async function uploadImage(
  file: File,
  folder: string,
): Promise<{ url: string; thumbnailUrl: string; width: number; height: number }> {
  const compressed = await compressImage(file);

  const body = new FormData();
  body.append('file', compressed.full, 'foto.webp');
  body.append('thumbnail', compressed.thumbnail, 'foto-thumb.webp');
  body.append('folder', folder);
  body.append('width', String(compressed.width));
  body.append('height', String(compressed.height));

  const response = await fetch('/api/upload', { method: 'POST', body });
  const payload = (await response.json()) as {
    url?: string;
    thumbnailUrl?: string;
    width?: number;
    height?: number;
    error?: string;
  };

  if (!response.ok || !payload.url) {
    throw new ImageCompressionError(
      payload.error ?? 'Não conseguimos enviar a imagem.',
    );
  }

  return {
    url: payload.url,
    thumbnailUrl: payload.thumbnailUrl ?? payload.url,
    width: payload.width ?? compressed.width,
    height: payload.height ?? compressed.height,
  };
}
