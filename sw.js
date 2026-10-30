/* NBFC Guru service worker.
   Shell: precached, served cache-first (updated on each new SW version).
   Data (data.js, data/*.json, days/*): network-first, falling back to the last copy we saw,
   so the app opens offline with the last edition. Fonts: cache-first. */
const VERSION = 'v1-2026-10-30';
const SHELL = `shell-${VERSION}`;
const DATA = 'data-v1';
const FONTS = 'fonts-v1';
const SHELL_FILES = ['/', '/index.html', '/app.css', '/app.js', '/manifest.webmanifest',
  '/icons/icon-192.png', '/icons/icon-512.png', '/icons/favicon-64.png', '/icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('shell-') && k !== SHELL) await caches.delete(k);
    await self.clients.claim();
  })());
});

const isData = p => p === '/data.js' || p.startsWith('/data/') || p.startsWith('/days/');

async function networkFirst(req, cacheName, key) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req, { cache: 'no-cache' });
    if (res.ok) cache.put(key || req, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(key || req, { ignoreSearch: true });
    if (hit) return hit;
    throw err;
  }
}
async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
  return res;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(cacheFirst(req, FONTS)); return;
  }
  if (url.origin !== location.origin) return;
  if (req.mode === 'navigate') {
    // the app is one page; always try fresh HTML, fall back to the cached shell
    e.respondWith(networkFirst(req, SHELL, '/index.html').catch(() => caches.match('/index.html')));
    return;
  }
  if (isData(url.pathname)) { e.respondWith(networkFirst(req, DATA, url.pathname)); return; }
  // shell assets: stale-while-revalidate, so a new deploy shows up on the next open
  e.respondWith((async () => {
    const cache = await caches.open(SHELL);
    const hit = await cache.match(req, { ignoreSearch: true });
    const fresh = fetch(req).then(res => { if (res.ok) cache.put(url.pathname, res.clone()); return res; });
    if (hit) { e.waitUntil(fresh.catch(() => {})); return hit; }
    return fresh;
  })());
});
