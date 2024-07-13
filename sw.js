// Nama cache untuk menyimpan data
const CACHE_NAME = 'gempa-bumi-pwa-v1'; 
 // Daftar URL dari data yang akan disimpan di cache 
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json',
    '/images/icon-72x72.png',
    '/images/icon-96x96.png',
    '/images/icon-128x128.png',
    '/images/icon-144x144.png',
    '/images/icon-152x152.png',
    '/images/icon-192x192.png',
    '/images/icon-512x512.png',
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME) // Membuka cache 
            .then(cache => cache.addAll(urlsToCache)) // Menambahkan ke dalam cache
            .then(() => self.skipWaiting()) // Mengaktifkan service worker 
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => { // Mengambil cache yang ada
            return Promise.all(
                cacheNames.filter(cacheName => cacheName !== CACHE_NAME) // Memfilter cache 
                    .map(cacheName => caches.delete(cacheName)) // Menghapus cache yang tidak sesuai
            );
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        // Mencocokkan request dengan cache yang ada
        caches.match(event.request) 
            .then(response => {
                if (response) {
                    return response;
                }

                // Clone request fetch
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest) // Melakukan request fetch ke jaringan
                    .then(response => {
                        // Memastikan respons valid 
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone respons fetch
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME) // Membuka cache
                            .then(cache => {
                                cache.put(event.request, responseToCache); // Menyimpan respons di cache
                            });

                        return response;
                    });
            })
    );
});