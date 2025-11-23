// public/service-worker.js
const CACHE_NAME = 'lolme-static-v1';
const STATIC_ASSETS = [
  '/', // لو تحتاج
  '/index.html',
  '/css/style.css',
  '/js/meme-editor.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  // ضيف هنا ملفات ثابتة اللي عايز تخزنها
];

// Domains/URLs اللي نمنع caching ليها (إعلانات جوجل)
const AD_HOSTS = [
  'pagead2.googlesyndication.com',
  'googleads.g.doubleclick.net',
  'tpc.googlesyndication.com',
  'securepubads.g.doubleclick.net',
  'googleads.googleapis.com',
  'www.googletagservices.com',
  'partner.googleadservices.com',
  'adservice.google.com',
  'www.google.com' // لو في طلبات إعلانات خاصة
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Some static assets failed to cache:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Helper to check if request is ad-related
function isAdRequest(request) {
  try {
    const url = new URL(request.url);
    return AD_HOSTS.some((h) => url.hostname.includes(h)) ||
           /adsbygoogle|doubleclick|googlesyndication|pagead|adservice/i.test(url.href);
  } catch (err) {
    return false;
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Don't interfere with non-GET or navigation requests for safety
  if (req.method !== 'GET') return;

  // If request is for an ad or googlesyndication script -> network-first and don't cache
  if (isAdRequest(req)) {
    event.respondWith(
      fetch(req)
        .catch(() => {
          // If ad request fails, return a small transparent 1x1 PNG from cache if you want,
          // but better to return a generic Response so layout doesn't break:
          return new Response('', { status: 204, statusText: 'No Content' });
        })
    );
    return;
  }

  // For navigation requests (HTML) -> network-first fallback to cache
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // optionally update the cache with latest HTML
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req).then((cached) => cached || caches.match('/').then(r => r))
        )
    );
    return;
  }

  // For static assets (css/js/images) -> cache-first strategy
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          // Put in cache for future (only same-origin/static)
          const url = new URL(req.url);
          if (url.origin === location.origin) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => {
          // fallback if needed (could return placeholder image)
          return new Response('', { status: 204, statusText: 'No Content' });
        });
    })
  );
});
