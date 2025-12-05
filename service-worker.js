// Service Worker for Analog Todo App
// Cache version - increment to force cache update
const CACHE_VERSION = 'v1';
const CACHE_NAME = `analog-todo-${CACHE_VERSION}`;

// Assets to cache on install
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/todo.css',
  '/css/base.css',
  '/css/card.css',
  '/css/calendar.css',
  '/css/coach.css',
  '/css/export.css',
  '/css/goal.css',
  '/css/info.css',
  '/js/database.js',
  '/js/global.js',
  '/js/calendar.js',
  '/js/export.js',
  '/fonts/Caveat.woff2',
  '/manifest.json',
  '/favicon.ico',
  // Templates
  '/templates/card.html',
  '/templates/calendar.html',
  '/templates/goal.html',
  '/templates/export.html',
  '/templates/info.html',
  '/templates/coach.html',
  '/templates/reminder.html',
  '/templates/qrcode.html',
  '/templates/jabcode.html',
  '/templates/webrtc.html',
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((error) => {
        console.warn('Failed to cache some assets:', error);
        // Continue even if some assets fail to cache
      });
    })
  );
  // Activate new service worker immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches that don't match current version
          if (cacheName !== CACHE_NAME && cacheName.startsWith('analog-todo-')) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all pages immediately
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Return cached version if available
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise fetch from network
      return fetch(request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response for caching
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // If network fails and no cache, return offline page if available
          if (request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
    })
  );
});

// Listen for messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith('analog-todo-')) {
              return caches.delete(cacheName);
            }
          })
        );
      }).then(() => {
        // Send confirmation back if port exists
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: true });
        }
      })
    );
  }
});

