/* =============================================================================
 * BROTA — Service Worker
 *
 * Estratégia por tipo de recurso:
 *  • Navegação (HTML): rede primeiro, cache como reserva. Assim o conteúdo está
 *    sempre atualizado quando há conexão, e o que já foi visitado continua
 *    acessível quando não há.
 *  • Estáticos do Next e ícones: cache primeiro. São versionados pelo build.
 *  • Imagens enviadas por usuários: cache primeiro, com limite de itens.
 *  • API e autenticação: sempre rede. Dado pessoal não fica em cache.
 *
 * Escrito à mão, sem gerador: são cem linhas legíveis em vez de uma dependência
 * de build a mais.
 * ========================================================================== */

const VERSION = 'brota-v1';
const PAGES_CACHE = `${VERSION}-paginas`;
const ASSETS_CACHE = `${VERSION}-estaticos`;
const IMAGES_CACHE = `${VERSION}-imagens`;
const MAX_IMAGES = 60;

const OFFLINE_URL = '/offline';

const PRECACHE = [OFFLINE_URL, '/icons/icon-192.png', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PAGES_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
      .catch(() => undefined),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith(VERSION))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/** Mantém o cache de imagens dentro de um limite razoável. */
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxItems) return;
  await Promise.all(keys.slice(0, keys.length - maxItems).map((key) => cache.delete(key)));
}

async function networkFirst(request) {
  const cache = await caches.open(PAGES_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    const offline = await cache.match(OFFLINE_URL);
    if (offline) return offline;
    return new Response('Sem conexão.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

async function cacheFirst(request, cacheName, limit) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
    if (limit) void trimCache(cacheName, limit);
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Nunca guardar em cache autenticação, API ou dados pessoais.
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/admin') ||
    url.pathname.startsWith('/configuracoes') ||
    url.pathname.startsWith('/notificacoes')
  ) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(cacheFirst(request, ASSETS_CACHE));
    return;
  }

  if (
    url.pathname.startsWith('/uploads/') ||
    url.pathname.startsWith('/_next/image')
  ) {
    event.respondWith(cacheFirst(request, IMAGES_CACHE, MAX_IMAGES));
  }
});

/** Permite que a aplicação force a ativação de uma versão nova. */
self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') self.skipWaiting();
});
