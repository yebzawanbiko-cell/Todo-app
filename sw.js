const CACHE_NAME = 'glass-todo-offline-v1';
const assetsToCache = [
  './',
  './index.html',
  './manifest.json',
  // Add your icon files here too so they cache offline
  './icon-192.png',
  './icon-512.png'
];

// 1. Install Event: Cache all essential files
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Opened cache and storing app assets');
            return cache.addAll(assetsToCache);
        })
    );
    self.skipWaiting();
});

// 2. Activate Event: Clean up old outdated caches if you update your app later
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('Deleting old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clientsClaim();
});

// 3. Fetch Event: Serve cached assets when offline, fallback to network when online
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Return cached version if found, otherwise fetch from network
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request).catch(() => {
                // Optional: You can return a custom offline fallback page here if needed
            });
        })
    );
});
