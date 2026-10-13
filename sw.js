const SHELL_CACHE = 'mls-local-shell-pdf-edition-v148';
const OFFLINE_LIBRARY_PREFIX = 'mls-iphone11-';
const SHELL = [
  './', './index.html', './manifest.webmanifest', './sw.js', './derechos.html',
  './assets/styles.css', './assets/local-overrides.css', './fonts/NotoColorEmoji-flagsonly.ttf', './assets/icon-192.png', './assets/icon-512.png',
  './assets/apple-touch-icon-180.png', './assets/apple-touch-icon-167.png',
  './assets/apple-touch-icon-152.png', './assets/splash-iphone11-828x1792.png',
  './data/index.js', './data/references.js', './js/core.js', './js/map.js', './js/map.js?v=part-entry-number-2', './js/search.js',
  './js/compare.js', './js/reader.js', './js/reader.js?v=r33-22', './js/ios.js?offline-visibility-2', './js/app.js', './js/app.js?v=offline-visibility-3'
];

self.addEventListener('install', event => event.waitUntil(
  caches.open(SHELL_CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting())
));

self.addEventListener('activate', event => event.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.map(key => {
    if (key.startsWith('mls-local-shell-') && key !== SHELL_CACHE) return caches.delete(key);
    // Keep the separate full-volume offline pack created by ios.js.
    if (key.startsWith(OFFLINE_LIBRARY_PREFIX)) return Promise.resolve(false);
    return Promise.resolve(false);
  }));
  await self.clients.claim();
})()));

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.includes('/api/')) {
    event.respondWith(new Response('La PWA local no utiliza API.', { status: 404 }));
    return;
  }
  event.respondWith((async () => {
    try {
      const response = await fetch(request, { cache: 'no-store' });
      if (response.ok) {
        const cache = await caches.open(SHELL_CACHE);
        await cache.put(request, response.clone());
      }
      return response;
    } catch {
      const cached = await caches.match(request);
      if (cached) return cached;
      if (request.mode === 'navigate') return (await caches.match('./index.html')) || Response.error();
      return Response.error();
    }
  })());
});












