import {
  IdentificationError,
  type IdentificationInput,
  type IdentificationResultDTO,
  type PlantIdentificationProvider,
} from './types';

/**
 * Provedor de desenvolvimento.
 *
 * Existe apenas para permitir trabalhar na interface sem consumir cota da API.
 * Recusa-se a funcionar fora de desenvolvimento: em produção o sistema informa
 * honestamente que a identificação está indisponível em vez de devolver uma
 * espécie inventada.
 */
export class MockIdentificationProvider implements PlantIdentificationProvider {
  readonly name = 'mock';

  isConfigured(): boolean {
    return process.env.NODE_ENV !== 'production';
  }

  async identify(input: IdentificationInput): Promise<IdentificationResultDTO> {
    if (process.env.NODE_ENV === 'production') {
      throw new IdentificationError(
        'not_configured',
        'O provedor simulado nunca é usado em produção.',
      );
    }

    // Determinístico pelo tamanho do arquivo: permite testar tanto o caminho de
    // alta confiança quanto o de baixa confiança que abre a fila administrativa.
    const size = input.image.size;
    const lowConfidence = size % 2 === 0;

    const candidates = lowConfidence
      ? [
          {
            scientificName: 'Philodendron hederaceum',
            commonNames: ['Filodendro'],
            family: 'Araceae',
            genus: 'Philodendron',
            score: 0.21,
            gbifId: null,
            referenceImageUrl: null,
          },
        ]
      : [
          {
            scientificName: 'Monstera deliciosa',
            commonNames: ['Costela-de-adão'],
            family: 'Araceae',
            genus: 'Monstera',
            score: 0.87,
            gbifId: null,
            referenceImageUrl: null,
          },
          {
            scientificName: 'Monstera adansonii',
            commonNames: ['Monstera-esqueleto'],
            family: 'Araceae',
            genus: 'Monstera',
            score: 0.06,
            gbifId: null,
            referenceImageUrl: null,
          },
        ];

    return {
      provider: this.name,
      candidates,
      topScore: candidates[0]?.score ?? null,
      raw: { mock: true, note: 'Resposta simulada — apenas em desenvolvimento.' },
      remainingRequests: null,
    };
  }
}
