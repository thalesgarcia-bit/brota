import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BROTA — Comunidade Inteligente de Plantas',
    short_name: 'BROTA',
    description:
      'Descubra quais plantas combinam com você e com o lugar onde vive.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#ffffff',
    theme_color: '#2c6d4e',
    lang: 'pt-BR',
    dir: 'ltr',
    categories: ['education', 'lifestyle', 'social'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      { name: 'Identificar planta', url: '/identificar' },
      { name: 'Meu Jardim', url: '/jardim' },
      { name: 'Explorar espécies', url: '/explorar' },
    ],
  };
}
