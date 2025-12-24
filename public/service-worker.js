const CACHE_VERSION = 'v1-cache';
const APP_SHELL_CACHE = `${CACHE_VERSION}-app-shell`;
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;

const APP_SHELL_FILES = [
  '/',
  '/offline',
];

const STATIC_ASSET_PATTERNS = [
  /\.(css|js)$/,
  /\.(woff|woff2|ttf|otf)$/,
  /\.(png|jpg|jpeg|gif|svg|ico)$/,
];

const API_PATTERNS = [
  /\/api\//,
];

const PDF_PATTERNS = [
  /\.pdf$/,
  /\/api\/.*\/pdf/,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => {
      return cache.addAll(APP_SHELL_FILES);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName.startsWith('v') && !cacheName.startsWith(CACHE_VERSION);
          })
          .map((cacheName) => {
            return caches.delete(cacheName);
          })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  if (isPDF(url, request)) {
    event.respondWith(networkOnly(request));
    return;
  }

  if (isAPI(url)) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (isAppShell(url)) {
    event.respondWith(staleWhileRevalidate(request, APP_SHELL_CACHE));
    return;
  }

  event.respondWith(fetch(request));
});

function isPDF(url, request) {
  return PDF_PATTERNS.some(pattern => pattern.test(url.pathname)) ||
         request.headers.get('accept')?.includes('application/pdf');
}

function isAPI(url) {
  return API_PATTERNS.some(pattern => pattern.test(url.pathname));
}

function isStaticAsset(url) {
  return STATIC_ASSET_PATTERNS.some(pattern => pattern.test(url.pathname));
}

function isAppShell(url) {
  return url.origin === self.location.origin &&
         (url.pathname === '/' || url.pathname.startsWith('/_next/'));
}

async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Network request failed. PDFs cannot be accessed offline.'
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    return new Response(
      JSON.stringify({
        error: 'Network request failed and no cached response available.'
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    return new Response('', { status: 404 });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cachedResponse = await caches.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse && networkResponse.status === 200) {
      const cache = caches.open(cacheName);
      cache.then(c => c.put(request, networkResponse.clone()));
    }
    return networkResponse;
  }).catch(() => {
    return cachedResponse;
  });

  return cachedResponse || fetchPromise;
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-actions') {
    event.waitUntil(syncOfflineActions());
  }
});

async function syncOfflineActions() {
  const cache = await caches.open(API_CACHE);
  const requests = await cache.keys();

  const syncPromises = requests.map(async (request) => {
    try {
      await fetch(request);
      await cache.delete(request);
    } catch (error) {
      console.error('Sync failed for request:', request.url);
    }
  });

  return Promise.all(syncPromises);
}
