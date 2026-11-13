// Bei jedem Update die Versionsnummer hochzählen → Geräte laden die neue Version
const CACHE = 'jonas-kueche-v3';
const FILES = ['./', './index.html', './manifest.json', './icon.svg', './icon-180.png', './icon-192.png', './icon-512.png'];
// Firebase-SDK (versioniert, unveränderlich) → mitcachen, damit die App auch offline startet
const SDK = ['app', 'auth', 'firestore'].map(n => `https://www.gstatic.com/firebasejs/10.12.0/firebase-${n}-compat.js`);

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES).then(() =>
    Promise.all(SDK.map(u => fetch(u, {mode: 'no-cors'}).then(r => c.put(u, r)).catch(() => {})))
  )).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = e.request.url;
  const isSDK = url.startsWith('https://www.gstatic.com/firebasejs/');
  // Firebase-Verbindungen (Firestore, Login) nie über den Cache
  if (!isSDK && new URL(url).origin !== self.location.origin) return;
  e.respondWith(
    caches.match(e.request, {ignoreSearch: !isSDK}).then(hit => hit || fetch(e.request).then(res => {
      if (isSDK && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    }))
  );
});
