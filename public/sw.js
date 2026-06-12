/**
 * Regulon PWA Service Worker (Gap 15)
 * Network-First-with-Cache-Fallback strategy for core shells.
 * Direct passthrough for live database calls (Supabase & REST APIs).
 *
 * NOTE: This file MUST be plain JavaScript — no TypeScript syntax.
 * TypeScript constructs like `(self as any)` will cause script evaluation failure.
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
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('[Service Worker] Pre-caching static assets...');
      return cache.addAll(STATIC_ASSETS);
    }).then(function() {
      // skipWaiting() — plain JS, no TypeScript cast needed
      return self.skipWaiting();
    }).catch(function(err) {
      console.warn('[Service Worker] Pre-cache failed (non-fatal):', err);
    })
  );
});

// 2. Activate event: Cleanup stale caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cache) {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Evicting deprecated cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// 3. Fetch intercept: Network-First-with-Cache-Fallback
self.addEventListener('fetch', function(event) {
  var req = event.request;
  var url = new URL(req.url);

  // Bypass service worker caches for auth and live database connections (real-time queries)
  if (
    url.hostname.includes('supabase.co') ||
    url.pathname.includes('/auth/') ||
    req.method !== 'GET'
  ) {
    return; // Pass through to network directly
  }

  // Handle shell cache requests
  event.respondWith(
    fetch(req)
      .then(function(networkResponse) {
        // If query succeeded, cache a clone for future offline use
        if (networkResponse.status === 200) {
          var cacheClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(req, cacheClone);
          });
        }
        return networkResponse;
      })
      .catch(function() {
        // Network failed (we are offline) — serve from local cache
        console.log('[Service Worker] Offline detected. Retrieving cached shell:', req.url);
        return caches.match(req).then(function(cachedResponse) {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If HTML is requested but not cached, fallback to index
          var acceptHeader = req.headers.get('accept');
          if (acceptHeader && acceptHeader.includes('text/html')) {
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
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
