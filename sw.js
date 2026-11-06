const CACHE = "jpy-twd-v1";
const FILES = ["./", "index.html", "manifest.json", "icon.svg", "apple-touch-icon.png"];

self.addEventListener("install", e => {
  // 單一檔案失敗不影響整體安裝
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => c.add(f).catch(() => {})))));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

// 網路優先，失敗時用快取（離線可用）。
// 只處理自己網站的檔案：對 Apps Script 的請求（匯率，網址含 TOKEN）一律不攔截、不快取。
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  if (new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request, { cache: "no-store" }).then(res => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match(e.request).then(r => r || Response.error()))
  );
});
