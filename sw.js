// Permette di aprire il Compendio senza connessione. Prova sempre prima la rete, così gli
// aggiornamenti del sito arrivano subito, e usa la copia salvata solo se la rete manca o tarda.
const CACHE = 'compendio-arcano-v1';
const CORE = [
  './',
  'manifest.webmanifest',
  'assets/fonts/gelasio-latin-400-normal.woff2',
  'assets/fonts/gelasio-latin-400-italic.woff2',
  'assets/fonts/gelasio-latin-700-normal.woff2',
  'assets/fonts/gelasio-latin-700-italic.woff2',
  'assets/icons/favicon.svg',
  'assets/icons/favicon-32.png',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/icons/icon-maskable-512.png'
];
const NETWORK_WAIT_MS = 4000;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('compendio-arcano-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function respond(event) {
  const req = event.request;
  const cache = await caches.open(CACHE);
  let saved = await cache.match(req, { ignoreSearch: true });
  if (!saved && req.mode === 'navigate') saved = await cache.match('./');

  const fromNetwork = fetch(req).then((res) => {
    if (res.ok) event.waitUntil(cache.put(req, res.clone()));
    return res;
  });
  if (!saved) return fromNetwork;

  event.waitUntil(fromNetwork.catch(() => {}));
  return Promise.race([
    fromNetwork.catch(() => saved),
    new Promise((resolve) => setTimeout(() => resolve(saved), NETWORK_WAIT_MS))
  ]);
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  event.respondWith(respond(event));
});
