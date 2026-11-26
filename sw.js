/* Schedario – Offline-Cache. Netz zuerst: ein Update erscheint beim nächsten Öffnen; ohne Netz startet die App aus dem Cache. */
const CACHE = 'schedario-v2';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-512.png'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(caches.open(CACHE).then(async (cache) => {
    const cached = async () => (await cache.match(req, { ignoreSearch: true })) || (req.mode === 'navigate' ? await cache.match('./index.html') : null);
    let res = null;
    try { res = await fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }); } catch (err) { res = null; }
    if (res && res.ok) { cache.put(req, res.clone()); return res; }
    // Netz weg oder Fehlerseite (z. B. 404, während GitHub neu veröffentlicht): lieber die gespeicherte App zeigen
    return (await cached()) || res || Response.error();
  }));
});
