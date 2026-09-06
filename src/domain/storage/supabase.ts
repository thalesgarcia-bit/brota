import { randomUUID } from 'node:crypto';

import {
  UploadError,
  type StorageProvider,
  type StoreImageInput,
  type StoredImage,
} from './types';

/* ===========================================================================
 * ADAPTER — Supabase Storage
 *
 * Usa a API REST diretamente, sem o SDK: são quarenta linhas contra mais uma
 * dependência no pacote — e, num servidor sem sistema de arquivos permanente,
 * cada quilobyte do bundle conta.
 *
 * A chave usada aqui é a `service_role`, que ignora as políticas de acesso do
 * Supabase. Ela vive apenas no servidor, jamais no navegador.
 * =========================================================================== */

export type SupabaseStorageOptions = {
  /** Ex.: https://abcdefgh.supabase.co */
  url: string;
  serviceKey: string;
  bucket: string;
};

export class SupabaseStorageProvider implements StorageProvider {
  readonly name = 'supabase';

  private readonly options: SupabaseStorageOptions;

  constructor(options: SupabaseStorageOptions) {
    this.options = {
      ...options,
      url: options.url.replace(/\/$/, ''),
    };
  }

  private objectUrl(objectPath: string): string {
    return `${this.options.url}/storage/v1/object/${this.options.bucket}/${objectPath}`;
  }

  private publicUrl(objectPath: string): string {
    return `${this.options.url}/storage/v1/object/public/${this.options.bucket}/${objectPath}`;
  }

  private async put(objectPath: string, body: Buffer): Promise<void> {
    let response: Response;

    try {
      response = await fetch(this.objectUrl(objectPath), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.options.serviceKey}`,
          'Content-Type': 'image/webp',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'x-upsert': 'true',
        },
        body: new Uint8Array(body),
        signal: AbortSignal.timeout(30_000),
      });
    } catch (error) {
      throw new UploadError(
        'write_failed',
        `Falha de rede ao enviar para o Supabase: ${(error as Error).message}`,
      );
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new UploadError(
        'write_failed',
        `Supabase Storage respondeu ${response.status}: ${detail.slice(0, 200)}`,
      );
    }
  }

  async storeImage(input: StoreImageInput): Promise<StoredImage> {
    const now = new Date();
    const id = randomUUID();
    const prefix = [
      input.folder,
      String(now.getFullYear()),
      String(now.getMonth() + 1).padStart(2, '0'),
    ].join('/');

    const fullPath = `${prefix}/${id}.webp`;
    const thumbPath = `${prefix}/${id}-thumb.webp`;

    await this.put(fullPath, input.buffer);
    if (input.thumbnail) await this.put(thumbPath, input.thumbnail);

    return {
      url: this.publicUrl(fullPath),
      thumbnailUrl: input.thumbnail
        ? this.publicUrl(thumbPath)
        : this.publicUrl(fullPath),
      width: input.width ?? 0,
      height: input.height ?? 0,
      bytes: input.buffer.byteLength,
    };
  }

  async remove(url: string): Promise<void> {
    const marker = `/storage/v1/object/public/${this.options.bucket}/`;
    const at = url.indexOf(marker);
    if (at === -1) return;

    const objectPath = url.slice(at + marker.length);

    for (const target of [objectPath, objectPath.replace(/\.webp$/, '-thumb.webp')]) {
      await fetch(this.objectUrl(target), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${this.options.serviceKey}` },
      }).catch(() => undefined);
    }
  }
}
