/**
 * Regulon PWA Service Worker (Gap 15)
 * Network-First-with-Cache-Fallback strategy for core shells.
 * Direct passthrough for live database calls (Supabase & REST APIs).
 */

const CACHE_NAME = 'regulon-practice-shell-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/placeholder.svg',
  '/robots.txt'
];

// 1. Install event: Cache the core shell resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching static assets...');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// 2. Activate event: Cleanup stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Evicting deprecated cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// 3. Scrutinize asset query intercepts: Network-First-with-Cache-Fallback
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Bypass service worker caches for localhost, Vite HMR, dev scripts, auth and live database connections
  if (
    url.hostname === 'localhost' ||
    url.hostname === '127.0.0.1' ||
    url.pathname.includes('/@vite/') ||
    url.pathname.includes('/@fs/') ||
    url.pathname.includes('/src/') ||
    url.pathname.includes('/node_modules/') ||
    url.pathname.includes('/@react-refresh') ||
    url.protocol === 'ws:' ||
    url.protocol === 'wss:' ||
    url.hostname.includes('supabase.co') ||
    url.pathname.includes('/auth/') ||
    req.method !== 'GET'
  ) {
    return; // Pass through to network directly
  }

  // Handle shell cache requests
  event.respondWith(
    fetch(req)
      .then((networkResponse) => {
        // If query succeeded, cache a clone for future offline use
        if (networkResponse.status === 200) {
          const cacheClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, cacheClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Network failed (we are offline) — serve from local cache
        console.log('[Service Worker] Offline detected. Retrieving cached shell:', req.url);
        return caches.match(req).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If HTML is requested but not cached, fallback to index
          if (req.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html');
          }
          return new Response('Network error occurred. You are currently offline.', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' })
          });
        });
      })
  );
});

// 4. Background Sync & Messages listener
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
