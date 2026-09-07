/* ===========================================================================
 * ESTADO DE FORMULÁRIO
 *
 * Este arquivo NÃO leva a diretiva 'use server' — e é justamente esse o
 * motivo de ele existir.
 *
 * Um módulo marcado com 'use server' só pode exportar funções assíncronas.
 * Quando ele exporta qualquer outra coisa, o Next não envia o valor para o
 * navegador: envia uma referência ao servidor no lugar dela. O formulário
 * então começa com um estado que não é um estado de verdade e, no envio,
 * devolve essa referência quebrada — a requisição falha antes de a ação
 * chegar a rodar.
 *
 * Por isso o tipo e o valor inicial moram aqui, num módulo comum.
 * =========================================================================== */

export type FormState = {
  status: 'idle' | 'error' | 'success';
  message?: string;
  fieldErrors?: Record<string, string>;
};

export const INITIAL_FORM_STATE: FormState = { status: 'idle' };

/** Formulário de espécie no painel: mesma forma, nome próprio por clareza. */
export type PlantFormState = FormState;

export const INITIAL_PLANT_FORM_STATE: PlantFormState = { status: 'idle' };
