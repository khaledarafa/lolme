// // public/service-worker.js

const CACHE_NAME = 'lolme-static-v1';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // ❌ HTML = من غير كاش
  if (req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(fetch(req));
    return;
  }

  // ✅ باقي الملفات (صور / CSS / JS)
  event.respondWith(
    caches.match(req).then(cached => {
      const fetchPromise = fetch(req).then(res => {
        if (url.origin === location.origin && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        }
        return res;
      });

      return cached || fetchPromise;
    })
  );
});