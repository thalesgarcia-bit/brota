import { describe, expect, it } from 'vitest';

import { assertValidImage, detectImageMime } from '@/domain/storage/validate';
import { UploadError } from '@/domain/storage/types';

/**
 * O upload valida pelo conteúdo do arquivo, não pela extensão nem pelo
 * Content-Type. A imagem chega comprimida do navegador, mas nada do que vem
 * do cliente é considerado confiável: estes testes garantem que um arquivo
 * renomeado para .jpg não passe.
 */

function withHeader(bytes: number[]): Buffer {
  return Buffer.concat([Buffer.from(bytes), Buffer.alloc(64)]);
}

const JPEG = withHeader([0xff, 0xd8, 0xff, 0xe0]);
const PNG = withHeader([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const WEBP = Buffer.concat([
  Buffer.from('RIFF', 'ascii'),
  Buffer.from([0, 0, 0, 0]),
  Buffer.from('WEBP', 'ascii'),
  Buffer.alloc(64),
]);

describe('detecção de formato', () => {
  it('reconhece JPEG, PNG e WebP pela assinatura', () => {
    expect(detectImageMime(JPEG)).toBe('image/jpeg');
    expect(detectImageMime(PNG)).toBe('image/png');
    expect(detectImageMime(WEBP)).toBe('image/webp');
  });

  it('recusa conteúdo que não é imagem', () => {
    const script = Buffer.from('<?php echo "oi"; ?>'.padEnd(64, ' '), 'utf8');
    expect(detectImageMime(script)).toBeNull();
  });

  it('recusa arquivo pequeno demais para ter assinatura', () => {
    expect(detectImageMime(Buffer.from([0xff, 0xd8]))).toBeNull();
  });
});

describe('validação de upload', () => {
  it('aceita imagem dentro do limite', () => {
    expect(assertValidImage(JPEG, 1024 * 1024)).toBe('image/jpeg');
  });

  it('recusa arquivo acima do limite', () => {
    expect(() => assertValidImage(JPEG, 8)).toThrowError(UploadError);
  });

  it('recusa executável renomeado como imagem', () => {
    const fake = Buffer.from('MZ'.padEnd(64, '\0'), 'binary');
    expect(() => assertValidImage(fake, 1024 * 1024)).toThrowError(UploadError);
  });
});
