const CACHE_NAME = 'moonlanding-v1';
const RUNTIME_CACHE = 'moonlanding-runtime-v1';
const API_CACHE = 'moonlanding-api-v1';

const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html'
];

const apiRoutes = [
  '/api/mwr/',
  '/api/engagement/',
  '/api/friday/',
  '/api/chat/'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('[ServiceWorker] Install failed:', error);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE && cacheName !== API_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    if (isApiRequest(url)) {
      event.respondWith(handleOfflinePost(request));
    }
    return;
  }

  if (isApiRequest(url)) {
    event.respondWith(networkFirstWithCache(request, API_CACHE));
  } else {
    event.respondWith(cacheFirstWithNetwork(request, RUNTIME_CACHE));
  }
});

function isApiRequest(url) {
  return apiRoutes.some(route => url.pathname.startsWith(route));
}

function cacheFirstWithNetwork(request, cacheName) {
  return caches.match(request)
    .then((response) => {
      if (response) {
        return response;
      }
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(cacheName)
          .then((cache) => {
            cache.put(request, responseToCache);
          });

        return response;
      });
    })
    .catch(() => {
      return caches.match('/offline.html');
    });
}

function networkFirstWithCache(request, cacheName) {
  return fetch(request)
    .then((response) => {
      if (!response || response.status !== 200) {
        return response;
      }

      const responseToCache = response.clone();
      caches.open(cacheName)
        .then((cache) => {
          cache.put(request, responseToCache);
        });

      return response;
    })
    .catch(() => {
      return caches.match(request);
    });
}

function handleOfflinePost(request) {
  return fetch(request)
    .catch(() => {
      const offlineResponse = {
        status: 503,
        statusText: 'Service Unavailable',
        body: JSON.stringify({
          error: 'Offline',
          message: 'This request requires network connectivity. It will be retried when online.',
          offline: true,
          method: request.method,
          url: request.url
        })
      };

      return new Response(
        offlineResponse.body,
        {
          status: offlineResponse.status,
          statusText: offlineResponse.statusText,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    });
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHES') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    });
  }
});
