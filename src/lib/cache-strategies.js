const CACHE_VERSION = 'v1-cache';

export async function cacheFirst(request, cacheName = `${CACHE_VERSION}-default`) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.status === 200) {
      await cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    throw error;
  }
}

export async function networkFirst(request, cacheName = `${CACHE_VERSION}-default`) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      await cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    throw error;
  }
}

export async function staleWhileRevalidate(request, cacheName = `${CACHE_VERSION}-default`) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse && networkResponse.status === 200) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch((error) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      throw error;
    });

  return cachedResponse || fetchPromise;
}

export async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch (error) {
    throw new Error('Network request failed. This resource cannot be accessed offline.');
  }
}

export async function cacheOnly(request, cacheName = `${CACHE_VERSION}-default`) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  throw new Error('No cached response available for this request.');
}

export async function clearCache(cacheName) {
  if (!cacheName) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
    return;
  }

  await caches.delete(cacheName);
}

export async function clearOldCaches(currentVersion = CACHE_VERSION) {
  const cacheNames = await caches.keys();
  const oldCaches = cacheNames.filter(
    (name) => name.startsWith('v') && !name.startsWith(currentVersion)
  );

  await Promise.all(oldCaches.map((name) => caches.delete(name)));
}

export async function getCacheSize(cacheName) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  return keys.length;
}

export async function getAllCacheNames() {
  return await caches.keys();
}
