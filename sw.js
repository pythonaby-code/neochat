/* NeoChat service worker — enables "Install app" and offline app-shell.
   Bump CACHE_VERSION whenever you upload a new index.html so phones refresh. */
const CACHE_VERSION = 'neochat-v23';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './neochat-icon-192.png',
  './neochat-icon-512.png'
];

// Pre-cache the app shell on install.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

// Remove old caches when a new version activates.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for navigations (always get the freshest chat page when online),
// fall back to the cached shell when offline.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Cache-first for our own static icons/manifest.
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
