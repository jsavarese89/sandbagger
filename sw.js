// Service Worker for Sandbagger PWA

const CACHE_NAME = 'sandbagger-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/golf-scorecard-solution.html',
  '/manifest.json',
  '/public/icons/icon-192x192.png',
  '/public/icons/icon-512x512.png'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(ASSETS);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return the response
        if (response) {
          return response;
        }
        
        // Clone the request
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              // Only cache same-origin resources
              if (event.request.url.startsWith(self.location.origin)) {
                cache.put(event.request, responseToCache);
              }
            });
            
          return response;
        });
      })
  );
});

// Handle offline functionality
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // For navigation requests, return the offline page
              if (event.request.mode === 'navigate') {
                return caches.match('/golf-scorecard-solution.html');
              }
              // Otherwise just return an error response
              return new Response('You are offline and this resource is not cached.');
            });
        })
    );
  }
});