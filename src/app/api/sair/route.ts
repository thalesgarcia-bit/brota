import { NextResponse, type NextRequest } from 'next/server';

import { encerrarSessao } from '@/lib/auth/sign-out';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Nomes que o Auth.js usa, com e sem o prefixo de HTTPS e com os pedaços. */
const COOKIE_DE_SESSAO = /^(__Secure-|__Host-)?authjs\./;

/**
 * Sair do BROTA.
 *
 * Isto é uma rota, e não uma ação de servidor, de propósito. Uma ação de
 * servidor devolve a resposta pelo caminho do React, e nesse caminho o pedido
 * de apagar o cookie vinha se perdendo: o cabeçalho esvaziava, mas bastava
 * atualizar a página para a conta voltar. Aqui o formulário faz um envio comum
 * do navegador; a resposta é um redirecionamento de verdade, com os cabeçalhos
 * que apagam o cookie escritos nela mesma. Não há intermediário para perder.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Só aceita o pedido vindo do próprio BROTA.
  const origem = request.headers.get('origin');
  if (origem) {
    try {
      if (new URL(origem).origin !== request.nextUrl.origin) {
        return new NextResponse('Origem inválida.', { status: 403 });
      }
    } catch {
      return new NextResponse('Origem inválida.', { status: 403 });
    }
  }

  // Se houver sessão registrada no banco, o Auth.js a encerra. Se falhar, os
  // cookies abaixo encerram a sessão de qualquer jeito.
  try {
    await encerrarSessao();
  } catch {
    // segue
  }

  const resposta = NextResponse.redirect(new URL('/', request.nextUrl.origin), 303);

  for (const cookie of request.cookies.getAll()) {
    if (COOKIE_DE_SESSAO.test(cookie.name)) {
      resposta.cookies.set(cookie.name, '', { path: '/', maxAge: 0 });
    }
  }

  // Nada nesta resposta pode ser reaproveitado do cache.
  resposta.headers.set('Cache-Control', 'no-store, must-revalidate');

  return resposta;
}
