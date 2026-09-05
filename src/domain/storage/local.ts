import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

import {
  UploadError,
  type StorageProvider,
  type StoreImageInput,
  type StoredImage,
} from './types';

/**
 * Armazenamento em disco para desenvolvimento e para instalações pequenas.
 *
 * A interface StorageProvider isola o resto do sistema: trocar por S3,
 * Cloudflare R2 ou um CDN é escrever outro adapter, sem tocar nas páginas.
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
      // rotate() aplica a orientação EXIF antes de redimensionar: sem isso,
      // fotos tiradas na vertical chegam deitadas.
      const pipeline = sharp(input.buffer, { failOn: 'error' }).rotate();
      const metadata = await pipeline.metadata();

      const full = await pipeline
        .clone()
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer({ resolveWithObject: true });

      const thumb = await pipeline
        .clone()
        .resize({ width: 480, height: 480, fit: 'cover', position: 'attention' })
        .webp({ quality: 72 })
        .toBuffer();

      await writeFile(path.join(targetDir, fileName), full.data);
      await writeFile(path.join(targetDir, thumbName), thumb);

      const publicDir = `${this.publicPrefix}/${relativeDir.split(path.sep).join('/')}`;

      return {
        url: `${publicDir}/${fileName}`,
        thumbnailUrl: `${publicDir}/${thumbName}`,
        width: full.info.width ?? metadata.width ?? 0,
        height: full.info.height ?? metadata.height ?? 0,
        bytes: full.data.byteLength,
      };
    } catch (error) {
      if (error instanceof UploadError) throw error;
      throw new UploadError('corrupted', (error as Error).message);
    }
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
