/* ============================================================
   Service Worker — offline-first asset caching.
   Precaches the full app shell so it loads instantly with no
   network. Network-first for navigations (fresh when online),
   cache-first for everything else.
   ============================================================ */

const CACHE = 'dumpling-math-v3';

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './js/app.js',
  './js/store.js',
  './js/data.js',
  './js/math.js',
  './js/dumpling.js',
  './js/physics.js',
  './js/particles.js',
  './js/sound.js',
  './js/leaderboard.js',
  './icons/icon.svg',
  './icons/icon-maskable.svg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // Leaderboard API: always go to the network, never cache (and let
  // non-GET methods like POST pass straight through).
  if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) {
    return; // default browser handling (network)
  }

  if (req.method !== 'GET') return;

  // Cross-origin (e.g. Google Fonts): cache opportunistically, fall back to network.
  if (url.origin !== self.location.origin) {
    e.respondWith(
      caches.match(req).then((cached) =>
        cached || fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        }).catch(() => cached)
      )
    );
    return;
  }

  // Navigations: network-first, fall back to cached shell (offline).
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Same-origin assets: cache-first.
  e.respondWith(
    caches.match(req).then((cached) =>
      cached || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
    )
  );
});
