import { z } from 'zod';

import {
  IdentificationError,
  type IdentificationInput,
  type IdentificationResultDTO,
  type PlantIdentificationProvider,
} from './types';

/* ===========================================================================
 * ADAPTER — Pl@ntNet
 *
 * API pública mantida por CIRAD, INRAE, IRD e Inria. Chave gratuita para uso
 * educacional em https://my.plantnet.org.
 *
 * O contrato abaixo é validado em tempo de execução: se a API mudar de formato,
 * o erro aparece de forma explícita em vez de virar dado silenciosamente errado.
 * Use `npm run check:plantnet -- caminho/da/foto.jpg` para conferir o contrato
 * com uma foto real antes de subir para produção.
 * =========================================================================== */

const API_BASE = 'https://my-api.plantnet.org/v2/identify';

const taxonSchema = z
  .object({
    scientificNameWithoutAuthor: z.string().optional(),
    scientificName: z.string().optional(),
  })
  .passthrough();

const resultSchema = z
  .object({
    score: z.number(),
    species: z
      .object({
        scientificNameWithoutAuthor: z.string(),
        scientificNameAuthorship: z.string().optional(),
        scientificName: z.string().optional(),
        commonNames: z.array(z.string()).optional(),
        genus: taxonSchema.optional(),
        family: taxonSchema.optional(),
      })
      .passthrough(),
    gbif: z.object({ id: z.union([z.string(), z.number()]) }).partial().optional(),
    images: z
      .array(
        z
          .object({
            url: z
              .object({ s: z.string().optional(), m: z.string().optional() })
              .partial()
              .optional(),
          })
          .passthrough(),
      )
      .optional(),
  })
  .passthrough();

const responseSchema = z
  .object({
    results: z.array(resultSchema),
    bestMatch: z.string().optional(),
    remainingIdentificationRequests: z.number().optional(),
  })
  .passthrough();

export type PlantNetOptions = {
  apiKey: string;
  /** Flora consultada: "all", "weurope", "canada"... */
  project: string;
  language?: string;
};

export class PlantNetProvider implements PlantIdentificationProvider {
  readonly name = 'plantnet';

  private readonly options: PlantNetOptions;

  constructor(options: PlantNetOptions) {
    this.options = options;
  }

  isConfigured(): boolean {
    return this.options.apiKey.trim().length > 0;
  }

  async identify(input: IdentificationInput): Promise<IdentificationResultDTO> {
    if (!this.isConfigured()) {
      throw new IdentificationError(
        'not_configured',
        'PLANTNET_API_KEY não configurada.',
      );
    }

    const url = new URL(`${API_BASE}/${this.options.project}`);
    url.searchParams.set('api-key', this.options.apiKey);
    url.searchParams.set('include-related-images', 'true');
    url.searchParams.set('no-reject', 'false');
    url.searchParams.set('nb-results', String(input.maxResults ?? 5));
    url.searchParams.set('lang', this.options.language ?? 'pt');

    const form = new FormData();
    form.append('images', input.image, input.fileName);
    form.append('organs', input.organ);

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        body: form,
        // A identificação é interativa: não vale a pena esperar meio minuto.
        signal: AbortSignal.timeout(25_000),
      });
    } catch (error) {
      throw new IdentificationError(
        'network',
        `Falha de rede ao consultar o Pl@ntNet: ${(error as Error).message}`,
      );
    }

    if (!response.ok) {
      throw mapHttpError(response.status, await safeText(response));
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new IdentificationError(
        'unexpected_response',
        'O Pl@ntNet devolveu um corpo que não é JSON.',
        response.status,
      );
    }

    const parsed = responseSchema.safeParse(payload);
    if (!parsed.success) {
      throw new IdentificationError(
        'unexpected_response',
        `Formato inesperado na resposta do Pl@ntNet: ${parsed.error.issues
          .map((issue) => issue.path.join('.'))
          .join(', ')}`,
        response.status,
      );
    }

    const candidates = parsed.data.results.map((result) => ({
      scientificName: result.species.scientificNameWithoutAuthor,
      commonNames: result.species.commonNames ?? [],
      family: result.species.family?.scientificNameWithoutAuthor ?? null,
      genus: result.species.genus?.scientificNameWithoutAuthor ?? null,
      score: result.score,
      gbifId: result.gbif?.id !== undefined ? String(result.gbif.id) : null,
      referenceImageUrl:
        result.images?.[0]?.url?.m ?? result.images?.[0]?.url?.s ?? null,
    }));

    return {
      provider: this.name,
      candidates,
      topScore: candidates[0]?.score ?? null,
      raw: payload,
      remainingRequests: parsed.data.remainingIdentificationRequests ?? null,
    };
  }
}

function mapHttpError(status: number, body: string): IdentificationError {
  switch (status) {
    case 400:
      return new IdentificationError(
        'image_rejected',
        `Pl@ntNet recusou a requisição: ${body.slice(0, 200)}`,
        status,
      );
    case 401:
    case 403:
      return new IdentificationError(
        'invalid_key',
        'Chave do Pl@ntNet inválida ou sem permissão.',
        status,
      );
    case 404:
      return new IdentificationError(
        'no_results',
        'Nenhuma espécie compatível encontrada.',
        status,
      );
    case 413:
      return new IdentificationError(
        'image_rejected',
        'A imagem enviada é grande demais para o serviço.',
        status,
      );
    case 429:
      return new IdentificationError(
        'quota_exceeded',
        'Limite de consultas do Pl@ntNet atingido.',
        status,
      );
    default:
      return new IdentificationError(
        'unknown',
        `Pl@ntNet respondeu ${status}: ${body.slice(0, 200)}`,
        status,
      );
  }
}

async function safeText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return '';
  }
}
