/* Only these public, versioned support files may enter this cache. */
const CACHE = 'parcours-coach-public-v1';
const PREFIX = 'parcours-coach-public-';
const OFFLINE = '/coach/offline.html';
const PUBLIC_FILES = new Map([
  [OFFLINE, 'text/html'],
  ['/coach/offline.css', 'text/css'],
  ['/coach/icon-192.png', 'image/png'],
  ['/coach/icon-512.png', 'image/png'],
  ['/coach/icon-maskable-512.png', 'image/png'],
  ['/coach/apple-touch-icon.png', 'image/png'],
  ['/coach/manifest.webmanifest', 'application/manifest+json'],
]);
function isPublic(response, type) {
  return response.ok && !response.redirected && response.type !== 'opaque'
    && response.headers.get('content-type')?.split(';')[0].trim() === type
    && !/private|no-store/i.test(response.headers.get('cache-control') || '')
    && !response.headers.has('set-cookie');
}
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    // Fetch and validate the entire set before modifying the cache.
    const files = await Promise.all([...PUBLIC_FILES].map(async ([path, type]) => {
      const response = await fetch(new Request(new URL(path, self.location.origin), {
        credentials: 'omit', redirect: 'error', cache: 'reload',
      }));
      if (!isPublic(response, type)) throw new Error('Unsafe or missing public asset');
      return [path, response];
    }));
    const cache = await caches.open(CACHE);
    await Promise.all(files.map(([path, response]) => cache.put(path, response)));
  })());
  // No skipWaiting: an update must not replace a worker during a live exercise.
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(PREFIX) && name !== CACHE).map(name => caches.delete(name)));
  })());
  // No clients.claim: existing pages keep their current lifecycle until navigation.
});
async function offlinePage() {
  const response = await (await caches.open(CACHE)).match(OFFLINE);
  if (response) return new Response(await response.text(), {
    status: 503,
    headers: {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store'},
  });
  return new Response('暂时无法连接。请联网后重新打开 Parcours；云端 AI 与学习记录保存需要网络。', {
    status: 503,
    headers: {'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store'},
  });
}
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (!url.search && PUBLIC_FILES.has(url.pathname)) {
    event.respondWith((async () => {
      const cached = await (await caches.open(CACHE)).match(url.pathname);
      return cached || fetch(request);
    })());
    return;
  }
  if (request.mode === 'navigate' && (url.pathname === '/coach' || url.pathname.startsWith('/coach/'))) {
    event.respondWith((async () => {
      try {
        const response = await fetch(request, {cache: 'no-store'});
        return response.status >= 500 ? offlinePage() : response;
      } catch { return offlinePage(); }
    })());
  }
  // APIs, login, recordings, audio, RSC payloads and user pages are never cached.
});
