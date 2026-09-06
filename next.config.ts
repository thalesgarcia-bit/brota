import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'bs.plantnet.org' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
    ],
  },
  experimental: {
    optimizePackageImports: ['date-fns'],

    // Antes de executar qualquer formulário, o Next confere se o endereço de
    // origem do envio bate com o host da requisição — é a proteção contra
    // envio forjado de outro site. Atrás de um proxy como o Cloudflare, o
    // host que chega ao servidor pode não ser o que o navegador enxerga, e o
    // Next recusa o envio antes de entregar o controle à aplicação: erro 500
    // sem nenhuma linha do nosso código rodar.
    //
    // Declarar os domínios legítimos resolve. Ao publicar em domínio próprio,
    // acrescente-o a esta lista.
    serverActions: {
      allowedOrigins: [
        'brota.criativaura.workers.dev',
        'localhost:3000',
      ],
    },
  },

  // O Prisma precisa chegar inteiro ao runtime do workerd: se o Next
  // empacotar o cliente junto do resto, o patch que o OpenNext aplica não
  // alcança o código que roda no Worker.
  serverExternalPackages: ['@prisma/client', '.prisma/client'],

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), geolocation=(self), microphone=()',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
};

export default nextConfig;
