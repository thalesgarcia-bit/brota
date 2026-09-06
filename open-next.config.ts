import { defineCloudflareConfig } from '@opennextjs/cloudflare';

/**
 * Adapter OpenNext para Cloudflare Workers.
 *
 * O BROTA roda no runtime Node dos Workers (não no Edge), o que permite usar
 * o Prisma e as APIs de Node de que a aplicação depende.
 *
 * O cache incremental fica na configuração padrão. Se um dia o catálogo
 * crescer a ponto de justificar, dá para plugar o cache em KV ou R2 aqui —
 * sem tocar em nenhuma página.
 */
export default defineCloudflareConfig();
