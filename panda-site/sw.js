// 🐼 Bucataria lui Panda — Service Worker
const CACHE = 'panda-v7';
const STATIC = [
  '/',
  '/index.html',
  '/og.png',
  'https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Archivo:ital,wdth,wght@0,70..100,400..900;1,100,400..700&display=swap'
];

// Install — cache static assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

// Activate — sterge cache vechi
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — cache-first pentru static, network-first pentru API
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // API Netlify Functions & Firebase — intotdeauna network
  if (url.pathname.includes('/.netlify/') ||
      url.hostname.includes('firebase') ||
      url.hostname.includes('googleapis') ||
      url.hostname.includes('ko-fi')) {
    return;
  }

  // Static assets — cache first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response.ok && e.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return response;
      }).catch(() => caches.match('/index.html'));
    })
  );
});
