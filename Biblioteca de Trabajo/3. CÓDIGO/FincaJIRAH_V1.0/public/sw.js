// ============================================================
// SERVICE WORKER — FincaJIRAH PWA (Offline-First)
// Patrón Observer: este SW es el "Sujeto" que monitorea la red
// y notifica a los componentes de React sobre cambios.
// ============================================================

const CACHE_NAME = 'jirah-v1';
const STATIC_CACHE = 'jirah-static-v1';
const API_CACHE = 'jirah-api-v1';

// Recursos que se cachean en la instalación
const STATIC_URLS = [
  '/',
  '/login',
  '/dashboard',
  '/offline',
];

// ─── Instalación: precachear recursos estáticos ───
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_URLS))
  );
  self.skipWaiting();
});

// ─── Activación: limpiar caches antiguas ───
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== STATIC_CACHE && k !== API_CACHE)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch: estrategia Network First para API, Cache First para estáticos ───
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API calls: Network First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cachear GETs exitosos para uso offline
          if (event.request.method === 'GET' && response.ok) {
            const clone = response.clone();
            caches.open(API_CACHE).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Estáticos: Cache First
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        const clone = response.clone();
        caches.open(STATIC_CACHE).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => caches.match('/offline') ?? new Response('Offline'));
    })
  );
});

// ─── Background Sync: sincronizar datos PENDING cuando vuelve la red ───
// Patrón State: transiciona de PENDING → SYNCING → SYNCED
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pesajes') {
    event.waitUntil(syncPesajesPendientes());
  }
});

async function syncPesajesPendientes() {
  // Obtener registros PENDING de IndexedDB y enviarlos a la API
  // La implementación completa con IndexedDB se activa en la Fase CU-05
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_COMPLETE', timestamp: Date.now() });
  });
}

// ─── Patrón Observer: notificar a los clientes sobre cambios de conectividad ───
self.addEventListener('message', (event) => {
  if (event.data?.type === 'PING') {
    event.source?.postMessage({ type: 'PONG', online: true });
  }
});
