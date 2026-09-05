import { UploadError } from './types';

/**
 * Validação de upload feita pelo conteúdo do arquivo, não pela extensão nem
 * pelo Content-Type informado pelo navegador — ambos são facilmente forjados.
 */

const SIGNATURES: { mime: string; test: (bytes: Buffer) => boolean }[] = [
  {
    mime: 'image/jpeg',
    test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    mime: 'image/png',
    test: (b) =>
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  {
    mime: 'image/webp',
    test: (b) =>
      b.subarray(0, 4).toString('ascii') === 'RIFF' &&
      b.subarray(8, 12).toString('ascii') === 'WEBP',
  },
  {
    mime: 'image/heic',
    test: (b) => {
      const brand = b.subarray(4, 12).toString('ascii');
      return brand.startsWith('ftyp') && /hei[cx]|mif1|msf1/.test(brand);
    },
  },
];

export function detectImageMime(buffer: Buffer): string | null {
  if (buffer.length < 16) return null;
  for (const signature of SIGNATURES) {
    if (signature.test(buffer)) return signature.mime;
  }
  return null;
}

export function assertValidImage(buffer: Buffer, maxBytes: number): string {
  if (buffer.length > maxBytes) {
    throw new UploadError(
      'too_large',
      `Arquivo com ${buffer.length} bytes excede o limite de ${maxBytes}.`,
    );
  }

  const mime = detectImageMime(buffer);
  if (!mime) {
    throw new UploadError(
      'invalid_type',
      'Assinatura de arquivo não corresponde a uma imagem suportada.',
    );
  }

  return mime;
}
