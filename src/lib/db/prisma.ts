import 'server-only';
import { PrismaClient } from '@prisma/client';

/**
 * Instância única do Prisma.
 * Em desenvolvimento o Next recarrega módulos a cada alteração; sem o cache
 * global o processo abriria uma nova pool de conexões a cada hot reload.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['warn', 'error']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
