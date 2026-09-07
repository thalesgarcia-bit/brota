import 'server-only';
import { cookies } from 'next/headers';

import { signOut } from '@/lib/auth';

/** Nomes que o Auth.js usa, com e sem o prefixo de HTTPS e com os pedaços. */
const COOKIE_DE_SESSAO = /^(__Secure-|__Host-)?authjs\./;

/**
 * Encerra a sessão e apaga o cookie de verdade.
 *
 * O `signOut` pede ao navegador que apague o cookie na própria resposta, mas
 * quando essa resposta sai como redirecionamento o pedido se perdia: a pessoa
 * via o cabeçalho vazio e, ao clicar em "Entrar", reentrava sozinha na conta —
 * a sessão nunca tinha acabado. Aqui os cookies são vencidos um a um, incluindo
 * os pedaços que o Auth.js cria quando o token não cabe em um cookie só.
 *
 * Quem chama continua responsável pelo `redirect` — assim cada lugar decide
 * para onde a pessoa vai depois.
 */
export async function encerrarSessao(): Promise<void> {
  await signOut({ redirect: false });

  const pote = await cookies();
  for (const cookie of pote.getAll()) {
    if (COOKIE_DE_SESSAO.test(cookie.name)) {
      pote.set(cookie.name, '', { path: '/', maxAge: 0 });
    }
  }
}
