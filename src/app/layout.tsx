import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter } from 'next/font/google';

import '@/styles/globals.css';
import { ToastProvider } from '@/components/ui/toast';
import { SkipLink } from '@/components/layout/skip-link';
import { ServiceWorkerRegistration } from '@/components/pwa/service-worker';
import { clientEnv } from '@/lib/env';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(clientEnv.NEXT_PUBLIC_SITE_URL),
  title: {
    default: 'BROTA — Comunidade Inteligente de Plantas',
    template: '%s · BROTA',
  },
  description:
    'Descubra quais plantas combinam com você e com o lugar onde vive. Catálogo botânico, identificação por foto, diário de cultivo e uma comunidade que cultiva conhecimento.',
  applicationName: 'BROTA',
  keywords: [
    'plantas',
    'jardinagem',
    'identificação de plantas',
    'plantas de apartamento',
    'horta',
    'educação ambiental',
  ],
  authors: [{ name: 'Escola Criativa de Uberaba' }],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'BROTA',
    title: 'BROTA — Comunidade Inteligente de Plantas',
    description:
      'Qual planta combina com você e com o lugar em que você vive? Descubra no BROTA.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BROTA — Comunidade Inteligente de Plantas',
    description:
      'Qual planta combina com você e com o lugar em que você vive?',
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'BROTA',
    statusBarStyle: 'default',
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: '/icons/favicon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#2c6d4e',
  width: 'device-width',
  initialScale: 1,
  // Nunca bloquear o zoom: ampliar a página é um direito de acessibilidade.
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${fraunces.variable}`}>
      <body>
        <SkipLink />
        <ToastProvider>{children}</ToastProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
