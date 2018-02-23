var cacheName = 'forbeslibrary-v1';
var homeURL = "/pwa-test/";
var staticFilesForAppShell = [
  homeURL,
  homeURL + 'manifest.json',
  homeURL + 'style.less',
  homeURL + 'main.js',
  homeURL + 'img/coolidge-portrait-small.jpg',
  homeURL + 'img/digital-gallery-button.png',
  homeURL + 'img/logo-250x182.png',
  homeURL + 'static/home.html',
  'https://fonts.googleapis.com/css?family=Lato',
  'https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/less.js/3.0.0/less.min.js',
  'https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js'
];

self.addEventListener('install', function(e) {
  console.log('[ServiceWorker] Install');
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      console.log('[ServiceWorker] Caching app shell');
      return cache.addAll(staticFilesForAppShell);
    })
  );
});

self.addEventListener('activate', function(e) {
  console.log('[ServiceWorker] Activate');
  e.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (key !== cacheName) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(response) {
      if (response) {
        console.log('[ServiceWorker] Returning cached response for: ' + e.request.url);
        return response;
      } else {
        console.log('[ServiceWorker] Fetching from network: ' + e.request.url);
        return fetch(e.request);
      }
    })
  );
});
