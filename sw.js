/* SUSTRAI PWA service worker */
const CACHE_VERSION = 'sustrai-pwa-v49-mintzakats-clean-feedback';
const SHELL = [
  '/',
  '/index.html',
  '/jokoak/',
  '/jokoak/index.html',
  '/jokoak/jokoak.css',
  '/jokoak/teusk/',
  '/jokoak/teusk/index.html',
  '/jokoak/teusk/core.js',
  '/jokoak/teusk/app.js',
  '/jokoak/zinok/',
  '/jokoak/zinok/index.html',
  '/jokoak/zinok/zinok.css',
  '/jokoak/zinok/core.js',
  '/jokoak/zinok/data.js',
  '/jokoak/zinok/app.js',
  '/jokoak/mintzakats/',
  '/jokoak/mintzakats/index.html',
  '/jokoak/mintzakats/mintzakats.css',
  '/jokoak/mintzakats/core.js',
  '/jokoak/mintzakats/app.js',
  '/manifest.webmanifest',
  '/theme.css',
  '/hitzbira.css',
  '/fonts/hitzbira-sans-var.woff',
  '/fonts/hitzbira-display-var.woff',
  '/start.css',
  '/home.js',
  '/fonts/inter-400.woff2',
  '/fonts/inter-500.woff2',
  '/fonts/inter-600.woff2',
  '/fonts/inter-700.woff2',
  '/fonts/inter-display-600.woff2',
  '/fonts/inter-display-700.woff2',
  '/fonts/sustrai-serif-var.woff2',
  '/auth.js',
  '/auth.css',
  '/account-kit.js',
  '/pwa.js',
  '/admin/',
  '/admin/index.html',
  '/admin/admin.js',
  '/admin/admin.css',
  '/mi-espacio/',
  '/mi-espacio/index.html',
  '/mi-espacio/app.js',
  '/mi-espacio/space.css',
  '/style.css',
  '/marker.css',
  '/marker-kit.js',
  '/marker-bar.js',
  '/study-kit.js',
  '/stage-kit.js',
  '/result-kit.js',
  '/explanation-kit.js',
  '/explanation-kit.css',
  '/exam-names.js',
  '/reading-kit.js',
  '/progress-kit.js',
  '/fokua-workshop.css',
  '/attempts-kit.js',
  '/study-kit.css',
  '/app.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/icons/favicon-32.png',
  '/icons/icon.svg',
  '/areas.css',
  '/azterketak/',
  '/azterketak/index.html',
  '/gramatika/',
  '/gramatika/index.html',
  '/gramatika/gramatika.css',
  '/gramatika/gramatika.js',
  '/ariketak/',
  '/ariketak/index.html',
  '/ariketak/catalog.js',
  '/ariketak/catalog.css',
  '/practice-ui.css',
  '/aditzak/',
  '/aditzak/index.html',
  '/aditzak/app.js',
  '/aditzak/style.css',
  '/irakurmena/',
  '/irakurmena/index.html',
  '/irakurmena/style.css',
  '/irakurmena/app.js',
  '/idazlanak/',
  '/idazlanak/index.html',
  '/idazlanak/style.css',
  '/idazlanak/app.js',
  '/idazlanak/eskema.js',
  '/idazlanak/review.js',
  '/ahozkoa/',
  '/ahozkoa/index.html',
  '/ahozkoa/style.css',
  '/ahozkoa/app.js',
  '/ivap/',
  '/ivap/index.html',
  '/habe/',
  '/habe/index.html',
  '/habe/app.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      // One file failing must not discard the whole offline shell.
      .then((cache) => Promise.allSettled(SHELL.map((path) =>
        fetch(path, { cache: 'reload' }).then((response) => {
          if (!response.ok) throw new Error(path + ' ' + response.status);
          return cache.put(path, response);
        })
      )))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

function isApiRequest(url) {
  return url.hostname.includes('supabase.co');
}

function isNavigation(request) {
  return request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html');
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never cache API/auth calls: always network.
  if (isApiRequest(url)) return;

  // Cross-origin: leave to browser.
  if (url.origin !== self.location.origin) return;

  // Navigations: network first, fallback to cache/home.
  if (isNavigation(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request, { ignoreSearch: true });
          if (cached) return cached;
          if (url.pathname.startsWith('/ivap/')) return caches.match('/ivap/index.html');
          if (url.pathname.startsWith('/habe/')) return caches.match('/habe/index.html');
          if (url.pathname.startsWith('/azterketak/')) return caches.match('/azterketak/index.html');
          if (url.pathname.startsWith('/gramatika/')) return caches.match('/gramatika/index.html');
          if (url.pathname.startsWith('/ariketak/')) return caches.match('/ariketak/index.html');
          if (url.pathname.startsWith('/aditzak/')) return caches.match('/aditzak/index.html');
          if (url.pathname.startsWith('/irakurmena/')) return caches.match('/irakurmena/index.html');
          if (url.pathname.startsWith('/idazlanak/')) return caches.match('/idazlanak/index.html');
          if (url.pathname.startsWith('/ahozkoa/')) return caches.match('/ahozkoa/index.html');
          return caches.match('/index.html');
        })
    );
    return;
  }

  // Versioned assets (?v=…): the page asked for a specific release, so the network wins and the
  // cache is only the offline fallback. Otherwise a new release would run one visit with old code.
  if (url.searchParams.has('v')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(url.pathname, copy));
          }
          return response;
        })
        .catch(() => caches.match(request, { ignoreSearch: true }))
    );
    return;
  }

  // Static assets: stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((exact) => exact || caches.match(request, { ignoreSearch: true })).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            // Store under the bare path so each asset keeps a single, current copy.
            caches.open(CACHE_VERSION).then((cache) => cache.put(url.pathname, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
