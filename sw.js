/* Wetter – Service Worker
   Cached das App-Shell (HTML, Manifest, Icons).
   API-Aufrufe an Open-Meteo werden NICHT gecacht –
   die App verwaltet ihre Wetterdaten selbst in localStorage. */

const CACHE_NAME = 'wetter-app-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './weatherscene.js',
  './openmeteo.js',
  './icons/icon.svg',
  './icons/icon-maskable.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        APP_SHELL.map((url) =>
          cache.add(url).catch(() => null)
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // API-Aufrufe nicht abfangen – die App handhabt Offline/Cache selbst.
  if (
    url.hostname === 'api.open-meteo.com' ||
    url.hostname === 'geocoding-api.open-meteo.com'
  ) {
    return;
  }

  // Navigation: network-first, fallback auf gecachtes HTML
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() =>
          caches.match(request)
            .then((cached) => cached || caches.match('./index.html') || caches.match('./'))
        )
    );
    return;
  }

  // Statische Assets: cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && (response.type === 'basic' || response.type === 'cors')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});