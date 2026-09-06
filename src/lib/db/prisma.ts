import 'server-only';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';

/* ===========================================================================
 * CLIENTE DO BANCO
 *
 * O PrismaClient abaixo vem do gerador específico para Cloudflare definido
 * no schema.prisma. Os imports de tipos/enums existentes em @prisma/client
 * continuam compatíveis pelo gerador legado mantido em paralelo.
 *
 * O Prisma é configurado com o driver adapter do PostgreSQL em vez do motor
 * nativo. Isso importa por dois motivos:
 *
 *  • Permite rodar em plataformas que não abrem soquete TCP da forma
 *    tradicional — os Cloudflare Workers, onde o BROTA é publicado.
 *  • Mantém desenvolvimento e produção usando exatamente o mesmo caminho de
 *    conexão, o que evita a categoria de bug que só aparece depois do deploy.
 * =========================================================================== */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL não está definida. Copie o .env.example para .env.local e preencha a conexão do banco.',
    );
  }

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

/**
 * Em desenvolvimento o Next recarrega os módulos a cada alteração; sem o cache
 * global, cada hot reload abriria uma pool de conexões nova.
 */
export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
