/* ===========================================================================
 * CAMADA DE IDENTIFICAÇÃO POR IMAGEM
 *
 * A aplicação nunca chama um serviço de IA diretamente. Toda identificação
 * passa por esta interface, o que permite trocar o provedor (Pl@ntNet, modelo
 * multimodal, modelo próprio) sem tocar em nenhuma página.
 * =========================================================================== */

export type PlantOrgan = 'leaf' | 'flower' | 'fruit' | 'bark' | 'habit' | 'auto';

export type IdentificationCandidateDTO = {
  /** Nome científico sem autoria, ex.: "Monstera deliciosa". */
  scientificName: string;
  commonNames: string[];
  family: string | null;
  genus: string | null;
  /** Confiança de 0 a 1, conforme devolvido pelo provedor. */
  score: number;
  /** Identificadores externos úteis para conferência manual. */
  gbifId?: string | null;
  referenceImageUrl?: string | null;
};

export type IdentificationResultDTO = {
  provider: string;
  candidates: IdentificationCandidateDTO[];
  /** Maior confiança entre os candidatos, ou null quando não houve resultado. */
  topScore: number | null;
  /** Resposta bruta, guardada para auditoria e reprocessamento futuro. */
  raw: unknown;
  /** Cota restante informada pelo provedor, quando disponível. */
  remainingRequests?: number | null;
};

export type IdentificationInput = {
  /** Conteúdo binário da imagem já validado e comprimido. */
  image: Blob;
  fileName: string;
  organ: PlantOrgan;
  /** Quantidade máxima de candidatos desejada. */
  maxResults?: number;
};

export interface PlantIdentificationProvider {
  readonly name: string;
  /** Informa se o provedor está pronto para uso (chave presente etc.). */
  isConfigured(): boolean;
  identify(input: IdentificationInput): Promise<IdentificationResultDTO>;
}

/* --------------------------------------------------------------------------
 * Erros — mapeados para mensagens humanas na interface
 * ------------------------------------------------------------------------ */

export type IdentificationErrorCode =
  | 'not_configured'
  | 'invalid_key'
  | 'quota_exceeded'
  | 'image_rejected'
  | 'no_results'
  | 'network'
  | 'unexpected_response'
  | 'unknown';

export class IdentificationError extends Error {
  readonly code: IdentificationErrorCode;
  readonly status?: number;

  constructor(code: IdentificationErrorCode, message: string, status?: number) {
    super(message);
    this.name = 'IdentificationError';
    this.code = code;
    this.status = status;
  }
}

export const IDENTIFICATION_ERROR_MESSAGES: Record<
  IdentificationErrorCode,
  string
> = {
  not_configured:
    'Identificação automática temporariamente indisponível. O serviço ainda não foi configurado.',
  invalid_key:
    'Identificação automática temporariamente indisponível. Houve um problema na configuração do serviço.',
  quota_exceeded:
    'O serviço de identificação atingiu o limite de consultas por hoje. Tente novamente mais tarde.',
  image_rejected:
    'Não conseguimos ler essa imagem. Tente uma foto mais nítida, com a planta bem enquadrada.',
  no_results:
    'Não encontramos nenhuma espécie compatível com essa foto.',
  network:
    'Não conseguimos falar com o serviço de identificação agora. Verifique sua conexão e tente novamente.',
  unexpected_response:
    'O serviço de identificação respondeu de um jeito que não esperávamos. A equipe foi avisada.',
  unknown: 'Algo deu errado na identificação. Tente novamente em instantes.',
};
