import 'server-only';
import { cache } from 'react';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

/* ===========================================================================
 * CLIENTE DO BANCO
 *
 * O Prisma usa o driver adapter do PostgreSQL em vez do motor nativo. Isso
 * permite rodar em plataformas que não abrem soquete TCP da forma tradicional
 * — os Cloudflare Workers, onde o BROTA é publicado — e mantém
 * desenvolvimento e produção no mesmo caminho de conexão.
 *
 * Duas regras deste ambiente, documentadas pelo OpenNext, explicam o formato
 * abaixo:
 *
 *  • O cliente é criado POR REQUISIÇÃO, não uma vez por processo. Um Worker
 *    pode atender requisições em contextos isolados; uma pool guardada em
 *    variável global sobrevive ao fim da requisição e a conexão vem morta na
 *    próxima. `maxUses: 1` garante que nenhuma conexão seja reaproveitada.
 *
 *  • `cache()` do React dá o escopo certo: uma única instância dentro da mesma
 *    requisição (todas as páginas e ações compartilham), nova na seguinte.
 * =========================================================================== */

const getDb = cache((): PrismaClient => {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL não está definida. Copie o .env.example para .env.local e preencha a conexão do banco.',
    );
  }

  const adapter = new PrismaPg({ connectionString, maxUses: 1 });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
});

/**
 * Fachada para o cliente da requisição atual.
 *
 * O restante do código continua escrevendo `prisma.plant.findMany(...)`, sem
 * saber que existe um ciclo de vida por requisição — a resolução acontece no
 * momento do acesso, e não na importação do módulo.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property, _receiver) {
    const client = getDb();
    const value = Reflect.get(client, property, client);
    return typeof value === 'function' ? value.bind(client) : value;
  },
}) as PrismaClient;
