export type StoredImage = {
  /** Caminho público servido pela aplicação ou pelo CDN. */
  url: string;
  /** Miniatura usada em listas e no feed. */
  thumbnailUrl: string;
  width: number;
  height: number;
  bytes: number;
};

export type StoreImageInput = {
  /** Imagem já comprimida e convertida para WebP pelo navegador. */
  buffer: Buffer;
  /** Miniatura, quando o cliente conseguiu gerá-la. */
  thumbnail?: Buffer;
  width?: number;
  height?: number;
  /** Nome original, guardado apenas para registro. */
  originalName: string;
  /** Pasta lógica: "posts", "plants", "avatars", "garden", "identifications". */
  folder: string;
};

export interface StorageProvider {
  readonly name: string;
  storeImage(input: StoreImageInput): Promise<StoredImage>;
  remove(url: string): Promise<void>;
}

export type UploadErrorCode =
  | 'too_large'
  | 'invalid_type'
  | 'corrupted'
  | 'write_failed';

export class UploadError extends Error {
  readonly code: UploadErrorCode;

  constructor(code: UploadErrorCode, message: string) {
    super(message);
    this.name = 'UploadError';
    this.code = code;
  }
}

export const UPLOAD_ERROR_MESSAGES: Record<UploadErrorCode, string> = {
  too_large: 'Essa imagem é grande demais. Envie um arquivo menor.',
  invalid_type: 'Só aceitamos imagens JPEG, PNG, WebP ou HEIC.',
  corrupted: 'Não conseguimos ler essa imagem. Tente outro arquivo.',
  write_failed: 'Não conseguimos salvar a imagem agora. Tente novamente.',
};
