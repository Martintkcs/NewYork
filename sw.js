const CACHE = 'ny-terv-v2';
const CORE_ASSETS = [
  './',
  './NY_utiterv.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

// Network-first a fő HTML-hez (hogy a frissítések eljussanak), cache-first a többihez —
// offline esetén (pl. metrón, adat nélkül) mindig van egy legutóbb betöltött verzió.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const isHtml = e.request.mode === 'navigate' || e.request.url.endsWith('.html');
  if (isHtml) {
    e.respondWith(
      // cache: 'no-store' — enélkül a fetch a böngésző saját HTTP-cache-éből
      // (a GitHub Pages Cache-Control fejléce miatt akár percekig) szolgálhatta
      // volna ki a kérést "hálózatiként", és így egy frissen kiadott javítás
      // (pl. a szinkron-hiba fix) még bezárás/újranyitás után is a régi,
      // gyorsítótárazott JS-t futtatta volna tovább.
      fetch(e.request, { cache: 'no-store' })
        .then(res => {
          const resClone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, resClone));
          return res;
        })
        .catch(() => caches.match(e.request).then(r => r || caches.match('./NY_utiterv.html')))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      const resClone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, resClone));
      return res;
    }))
  );
});
