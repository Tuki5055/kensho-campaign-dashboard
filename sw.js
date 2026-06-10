const CACHE_NAME = 'kensho-dashboard-v1.0.0';
const APP_ASSET_VERSION = '20260610-discovery2';
const withVersion = path => `${path}?v=${APP_ASSET_VERSION}`;

const ASSETS = [
  './',
  './index.html',
  './tests.html',
  './manifest.json',
  withVersion('./css/style.css'),
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  withVersion('./js/app.js'),
  withVersion('./js/tags.js'),
  withVersion('./js/filter.js'),
  withVersion('./js/risk.js'),
  withVersion('./js/score.js'),
  withVersion('./js/parser.js'),
  withVersion('./js/comments.js'),
  withVersion('./js/history.js'),
  withVersion('./js/reminders.js'),
  withVersion('./js/ics.js'),
  withVersion('./js/stats.js'),
  withVersion('./js/storage.js'),
  withVersion('./js/export.js'),
  withVersion('./js/sampleData.js'),
  withVersion('./js/discovery.js'),
  withVersion('./js/baseUi.js'),
  withVersion('./js/formUi.js'),
  withVersion('./js/todayUi.js'),
  withVersion('./js/listUi.js'),
  withVersion('./js/discoveryUi.js'),
  withVersion('./js/detailUi.js'),
  withVersion('./js/historyUi.js'),
  withVersion('./js/remindersUi.js'),
  withVersion('./js/commentsUi.js'),
  withVersion('./js/analyticsUi.js'),
  withVersion('./js/backupUi.js'),
  withVersion('./js/ui.js'),
  withVersion('./js/tests.js')
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  if (event.request.method !== 'GET' || requestUrl.origin !== self.location.origin) return;
  const matchOptions = requestUrl.search ? {} : { ignoreSearch: true };

  event.respondWith(
    caches.match(event.request, matchOptions).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => {
        if (event.request.mode === 'navigate') return caches.match('./index.html', { ignoreSearch: true });
        return caches.match(event.request, matchOptions);
      });
    })
  );
});
