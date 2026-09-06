import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ===========================================================================
 * ROTA TEMPORÁRIA DE DIAGNÓSTICO — REMOVER DEPOIS
 *
 * Existe para responder, em uma única visita, onde o login quebra no Worker.
 * Testa cada peça isoladamente e diz qual falhou, com a mensagem real.
 *
 * Nunca devolve o valor de nenhuma variável de ambiente: apenas se existe e
 * quantos caracteres tem. Mensagens de erro passam por um filtro que apaga
 * qualquer coisa parecida com senha dentro de uma URL de conexão.
 * =========================================================================== */

/** Remove credenciais de dentro de URLs antes de devolver uma mensagem. */
function limpar(texto: string): string {
  return texto
    .replace(/\/\/[^:@\s/]+:[^@\s/]+@/g, '//USUARIO:SENHA@')
    .slice(0, 500);
}

function descrever(error: unknown): string {
  if (error instanceof Error) {
    return limpar(`${error.name}: ${error.message}`);
  }
  return limpar(String(error));
}

export async function GET() {
  const passos: Record<string, unknown> = {};

  // 1. Variáveis de ambiente — só presença e tamanho, nunca o valor.
  const nomes = [
    'DATABASE_URL',
    'DIRECT_URL',
    'AUTH_SECRET',
    'STORAGE_PROVIDER',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_STORAGE_BUCKET',
    'PLANT_ID_PROVIDER',
    'PLANTNET_API_KEY',
    'OVERPASS_API_URL',
    'NEXT_PUBLIC_SITE_URL',
  ];

  passos['1_variaveis'] = Object.fromEntries(
    nomes.map((nome) => {
      const valor = process.env[nome];
      return [
        nome,
        valor ? `presente (${valor.length} caracteres)` : 'AUSENTE',
      ];
    }),
  );

  // 2. Banco de dados.
  try {
    const total = await prisma.user.count();
    passos['2_banco'] = `ok — ${total} usuários cadastrados`;
  } catch (error) {
    passos['2_banco'] = `FALHOU — ${descrever(error)}`;
  }

  // 3. Leitura da conta de administração (sem tocar na senha).
  try {
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { email: true, passwordHash: true, deletedAt: true },
    });

    passos['3_admin'] = admin
      ? {
          email: admin.email,
          temSenha: Boolean(admin.passwordHash),
          formatoDoHash: admin.passwordHash?.slice(0, 4) ?? '(vazio)',
          excluido: Boolean(admin.deletedAt),
        }
      : 'NENHUM ADMINISTRADOR ENCONTRADO';
  } catch (error) {
    passos['3_admin'] = `FALHOU — ${descrever(error)}`;
  }

  // 4. bcrypt — roda de verdade no Worker? E em quanto tempo?
  try {
    const inicio = Date.now();
    const hash = await bcrypt.hash('teste-de-diagnostico', 12);
    const confere = await bcrypt.compare('teste-de-diagnostico', hash);
    passos['4_bcrypt'] = `ok — ${confere ? 'confere' : 'não confere'}, ${
      Date.now() - inicio
    } ms`;
  } catch (error) {
    passos['4_bcrypt'] = `FALHOU — ${descrever(error)}`;
  }

  // 5. Auth.js consegue ler a sessão atual?
  try {
    const sessao = await auth();
    passos['5_authjs'] = sessao?.user
      ? `ok — sessão ativa de ${sessao.user.email ?? 'usuário'}`
      : 'ok — nenhuma sessão ativa (esperado antes de entrar)';
  } catch (error) {
    passos['5_authjs'] = `FALHOU — ${descrever(error)}`;
  }

  return NextResponse.json(passos, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
