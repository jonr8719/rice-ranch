const CACHE = 'us-ranch-v4';
const ASSETS = ['./', 'index.html', 'styles.css', 'app.js', 'store.js', 'config.js', 'dates.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/icon.svg', 'art.js', 'games.js', 'fonts/bitter-latin.woff2', 'fonts/rye-latin.woff2'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))); self.clients.claim(); });
// Network-first so updates show up; fall back to cache offline.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then((r) => { const c = r.clone(); caches.open(CACHE).then((ca) => ca.put(e.request, c)); return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('index.html'))));
});
