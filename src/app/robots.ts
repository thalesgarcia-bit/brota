import type { MetadataRoute } from 'next';

import { clientEnv } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Áreas privadas e administrativas não devem ser indexadas.
      disallow: [
        '/admin',
        '/api',
        '/configuracoes',
        '/notificacoes',
        '/salvos',
        '/jardim',
        '/onboarding',
        '/publicar',
      ],
    },
    sitemap: `${clientEnv.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
  };
}
