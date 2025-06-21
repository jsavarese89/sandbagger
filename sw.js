// Service Worker for Sandbagger PWA

const CACHE_NAME = 'sandbagger-v8';
const ASSETS = [
  '/',
  '/index.html',
  '/golf-scorecard-solution.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/assets/index-0HtG8_ZF.js',
  '/assets/index-CLQ1Ojdf.css',
  '/assets/manifest-CKE89kUs.json',
  '/emergency.html',
  '/reset.html',
  '/basic.html',
  'https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css',
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(ASSETS);
      }),
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
        }),
      );
    }),
  );
});

// Fetch event - handle offline functionality
self.addEventListener('fetch', event => {
  // Skip cross-origin requests for the sync handler
  if (!event.request.url.startsWith(self.location.origin) &&
      (event.request.url.includes('/api/scores') || event.request.url.includes('/api/bets'))) {
    return;
  }

  // Skip Firebase authentication endpoints to prevent caching issues
  if (event.request.url.includes('/__/auth') ||
      event.request.url.includes('/auth/') ||
      event.request.url.includes('googleusercontent') ||
      event.request.url.includes('googleapis') ||
      event.request.url.includes('firestore.googleapis') ||
      event.request.url.includes('identitytoolkit')) {
    // Just fetch without caching for auth-related requests
    console.log('Bypassing cache for auth request:', event.request.url);
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Cache hit - return the response
          return cachedResponse;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then(response => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                // Only cache same-origin resources and non-auth resources
                if (event.request.url.startsWith(self.location.origin) &&
                    !event.request.url.includes('logout.html') &&
                    !event.request.url.includes('reset.html')) {
                  cache.put(event.request, responseToCache);
                }
              });

            return response;
          })
          .catch(() => {
            // Offline fallback
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }

            // Return an empty response for non-cached assets
            return new Response('You are offline and this resource is not cached.', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain',
              }),
            });
          });
      }),
  );
});

// Background sync for offline data
self.addEventListener('sync', event => {
  if (event.tag === 'sync-scores') {
    event.waitUntil(syncScores());
  } else if (event.tag === 'sync-bets') {
    event.waitUntil(syncBets());
  }
});

// Handle score synchronization
async function syncScores() {
  try {
    const pendingScores = await getPendingScores();

    for (const scoreData of pendingScores) {
      await fetch('/api/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scoreData),
      });

      // If successful, remove from pending
      await removePendingScore(scoreData.id);
    }

    return true;
  } catch (error) {
    console.error('Error syncing scores:', error);
    return false;
  }
}

// Handle bet synchronization
async function syncBets() {
  try {
    const pendingBets = await getPendingBets();

    for (const betData of pendingBets) {
      await fetch('/api/bets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(betData),
      });

      // If successful, remove from pending
      await removePendingBet(betData.id);
    }

    return true;
  } catch (error) {
    console.error('Error syncing bets:', error);
    return false;
  }
}

// Store data in IndexedDB for offline use
const dbPromise = self.indexedDB.open('sandbagger-offline', 1, upgradeDB => {
  if (!upgradeDB.objectStoreNames.contains('pendingScores')) {
    upgradeDB.createObjectStore('pendingScores', { keyPath: 'id' });
  }
  if (!upgradeDB.objectStoreNames.contains('pendingBets')) {
    upgradeDB.createObjectStore('pendingBets', { keyPath: 'id' });
  }
});

// Helper functions for IndexedDB operations
async function getPendingScores() {
  const db = await dbPromise;
  const tx = db.transaction('pendingScores', 'readonly');
  const store = tx.objectStore('pendingScores');
  return store.getAll();
}

async function removePendingScore(id) {
  const db = await dbPromise;
  const tx = db.transaction('pendingScores', 'readwrite');
  const store = tx.objectStore('pendingScores');
  return store.delete(id);
}

async function getPendingBets() {
  const db = await dbPromise;
  const tx = db.transaction('pendingBets', 'readonly');
  const store = tx.objectStore('pendingBets');
  return store.getAll();
}

async function removePendingBet(id) {
  const db = await dbPromise;
  const tx = db.transaction('pendingBets', 'readwrite');
  const store = tx.objectStore('pendingBets');
  return store.delete(id);
}
