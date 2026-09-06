import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  UploadError,
  type StorageProvider,
  type StoreImageInput,
  type StoredImage,
} from './types';

/**
 * Armazenamento em disco — para desenvolvimento local.
 *
 * Em produção o disco do servidor é apagado a cada publicação, então este
 * adapter serve apenas na sua máquina. O `SupabaseStorageProvider` é quem
 * atende o site publicado.
 *
 * A imagem chega aqui já comprimida e convertida para WebP pelo navegador:
 * o servidor apenas confere e grava.
 */
export class LocalStorageProvider implements StorageProvider {
  readonly name = 'local';

  private readonly baseDir: string;
  private readonly publicPrefix: string;

  constructor(options: { baseDir: string; publicPrefix: string }) {
    this.baseDir = path.resolve(process.cwd(), options.baseDir);
    this.publicPrefix = options.publicPrefix.replace(/\/$/, '');
  }

  async storeImage(input: StoreImageInput): Promise<StoredImage> {
    const now = new Date();
    const relativeDir = path.join(
      input.folder,
      String(now.getFullYear()),
      String(now.getMonth() + 1).padStart(2, '0'),
    );
    const targetDir = path.join(this.baseDir, relativeDir);

    try {
      await mkdir(targetDir, { recursive: true });
    } catch (error) {
      throw new UploadError('write_failed', (error as Error).message);
    }

    const id = randomUUID();
    const fileName = `${id}.webp`;
    const thumbName = `${id}-thumb.webp`;

    try {
      await writeFile(path.join(targetDir, fileName), input.buffer);
      if (input.thumbnail) {
        await writeFile(path.join(targetDir, thumbName), input.thumbnail);
      }
    } catch (error) {
      throw new UploadError('write_failed', (error as Error).message);
    }

    const publicDir = `${this.publicPrefix}/${relativeDir.split(path.sep).join('/')}`;

    return {
      url: `${publicDir}/${fileName}`,
      thumbnailUrl: input.thumbnail
        ? `${publicDir}/${thumbName}`
        : `${publicDir}/${fileName}`,
      width: input.width ?? 0,
      height: input.height ?? 0,
      bytes: input.buffer.byteLength,
    };
  }

  async remove(url: string): Promise<void> {
    if (!url.startsWith(`${this.publicPrefix}/`)) return;

    const relative = url.slice(this.publicPrefix.length + 1);
    // Impede que um caminho manipulado escape do diretório de uploads.
    const target = path.resolve(this.baseDir, relative);
    if (!target.startsWith(this.baseDir)) return;

    await unlink(target).catch(() => undefined);
    await unlink(target.replace(/\.webp$/, '-thumb.webp')).catch(() => undefined);
  }
}
