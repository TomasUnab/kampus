// ============================================
// 🔧 SERVICE WORKER - KAMPUS PWA
// Cache inteligente y funcionalidad offline
// ============================================

const CACHE_NAME = 'kampus-v1.2.0';
const STATIC_CACHE = 'kampus-static-v1';
const DYNAMIC_CACHE = 'kampus-dynamic-v1';

const STATIC_ASSETS = [
  '/',
  '/dashboard_principal/code.html',
  '/js/session-manager.js',
  '/js/cache-manager.js',
  '/js/performance-optimizer.js',
  '/js/security-manager.js',
  '/js/notification-system.js',
  '/js/kampus-init.js',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&display=swap'
];

// Instalación
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activación
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Intercepción de requests
self.addEventListener('fetch', event => {
  const { request } = event;
  
  // Solo cachear GET requests
  if (request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) return response;
        
        return fetch(request)
          .then(fetchResponse => {
            if (!fetchResponse || fetchResponse.status !== 200) {
              return fetchResponse;
            }
            
            const responseClone = fetchResponse.clone();
            caches.open(DYNAMIC_CACHE)
              .then(cache => cache.put(request, responseClone));
            
            return fetchResponse;
          })
          .catch(() => {
            // Offline fallback
            if (request.destination === 'document') {
              return caches.match('/dashboard_principal/code.html');
            }
          });
      })
  );
});

// Background sync para datos offline
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // Sincronizar datos cuando vuelva la conexión
  const pendingData = await getStoredData('pending_sync');
  if (pendingData.length > 0) {
    // Procesar datos pendientes
    console.log('Sincronizando datos offline...');
  }
}

// Push notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación de Kampus',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: { dateOfArrival: Date.now() }
  };
  
  event.waitUntil(
    self.registration.showNotification('Kampus', options)
  );
});