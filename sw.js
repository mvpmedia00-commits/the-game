// Service worker: lets the installed app start fast and play offline.
// Code and pages: network first (you always get the newest version when online), cached copy when offline.
// Big files (models, textures, fonts, three.js, icons, voices): cached after the first load.
// Videos are left to the browser (they stream in pieces), so offline the intro is just skipped.
const VERSION = 'mvp-v1';
const CODE = /\.(html|js|mjs|css|json|webmanifest)$|\/$/;
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || req.headers.has('range') || /\.(mp4|webm)$/.test(url.pathname)) return;
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    if (CODE.test(url.pathname)) { // network first
      try { const res = await fetch(req); if (res.ok) cache.put(req, res.clone()); return res; }
      catch (err) { const hit = await cache.match(req, { ignoreSearch: true }); if (hit) return hit; throw err; }
    }
    const hit = await cache.match(req); if (hit) return hit; // cache first
    const res = await fetch(req); if (res.ok) cache.put(req, res.clone()); return res;
  })());
});
