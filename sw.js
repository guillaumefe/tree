const CACHE_NAME = 'tree-app-v2';
const ASSETS = [
  './index.html',
  './manifest.json',
  './styles.css',
  './main.js',
  './install-toast.js',
  './favicon.ico',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// Install: Cache essential files, with error handling
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .catch(error => {
        console.error('[SW] Install failed: Could not cache assets', error);
      })
  );
});

// Activate: Clean up old caches, with error handling
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key).catch(err => {
              console.warn(`[SW] Failed to delete old cache: ${key}`, err);
            }))
        )
      )
      .catch(error => {
        console.error('[SW] Activation failed: Could not get cache keys', error);
      })
  );
  self.clients.claim();
});

// Fetch: Stale-while-revalidate strategy, with full error handling
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.open(CACHE_NAME)
      .then(cache =>
        cache.match(event.request)
          .then(cachedResponse => {
            // Fetch from network in the background, update cache if successful
            const fetchPromise = fetch(event.request)
              .then(networkResponse => {
                if (
                  networkResponse &&
                  networkResponse.status === 200 &&
                  networkResponse.type === 'basic'
                ) {
                  // Try to update cache, log if it fails
                  cache.put(event.request, networkResponse.clone())
                    .catch(err => {
                      console.warn('[SW] Failed to update cache for', event.request.url, err);
                    });
                }
                return networkResponse;
              })
              .catch(networkError => {
                // Network failed, log error and resolve to undefined
                console.warn('[SW] Network fetch failed for', event.request.url, networkError);
                // If there's no cachedResponse, fetchPromise will resolve to undefined
                return undefined;
              });

            // Return cached response immediately if present, otherwise wait for fetch
            return cachedResponse || fetchPromise;
          })
          .catch(cacheError => {
            // cache.match failed: log error, fallback to network directly
            console.error('[SW] Cache match failed for', event.request.url, cacheError);
            return fetch(event.request)
              .then(networkResponse => {
                // Optionally cache the response if successful
                if (
                  networkResponse &&
                  networkResponse.status === 200 &&
                  networkResponse.type === 'basic'
                ) {
                  cache.put(event.request, networkResponse.clone())
                    .catch(err => {
                      console.warn('[SW] Failed to cache after fallback network fetch for', event.request.url, err);
                    });
                }
                return networkResponse;
              })
              .catch(fallbackError => {
                // Both cache and network failed
                console.error('[SW] Both cache and network fetch failed for', event.request.url, fallbackError);
                return new Response('Service Unavailable', { status: 503, statusText: 'Service Unavailable' });
              });
          })
      )
      .catch(openError => {
        // Opening the cache failed: fallback to network
        console.error('[SW] Failed to open cache for fetch', openError);
        return fetch(event.request)
          .catch(networkError => {
            console.error('[SW] Network fetch failed after cache open error for', event.request.url, networkError);
            return new Response('Service Unavailable', { status: 503, statusText: 'Service Unavailable' });
          });
      })
  );
});
