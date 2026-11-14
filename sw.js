const CACHE_NAME = 'glass-todo-v1';
const assetsToCache = [
  '/',
  '/index.html',
  // Add your stylesheet or script filenames here if they are in separate files
];

// Install Service Worker and cache core assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(assetsToCache);
        })
    );
});

// Serve cached content when offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});