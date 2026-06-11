const CACHE_NAME = 'kensho-dashboard-v1.3.0';
const APP_ASSET_VERSION = '20260611-core-fixes';
const withVersion = path => `${path}?v=${APP_ASSET_VERSION}`;

const ASSETS = [
  './',
  './index.html',
  './tests.html',
  './manifest.json',
  './README.md',
  './CHANGELOG.md',
  './DATA_SCHEMA.md',
  './SAFETY.md',
  './docs/DEPLOY.md',
  './docs/BACKUP.md',
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

  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request, matchOptions));
    return;
  }

  event.respondWith(staleWhileRevalidate(event.request, matchOptions));
});

function networkFirst(request, matchOptions) {
  return fetch(request)
    .then(response => cacheResponse(request, response))
    .catch(() => caches.match(request, matchOptions).then(cached => cached || caches.match('./index.html', { ignoreSearch: true })));
}

function staleWhileRevalidate(request, matchOptions) {
  return caches.match(request, matchOptions).then(cached => {
    const fresh = fetch(request)
      .then(response => cacheResponse(request, response))
      .catch(() => cached);
    return cached || fresh;
  });
}

function cacheResponse(request, response) {
  if (!response || response.status !== 200 || response.type !== 'basic') return response;
  const clone = response.clone();
  caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
  return response;
}
