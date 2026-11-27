// Offline-Unterstützung: Die App lädt immer zuerst die neueste Version aus dem Netz
// und greift nur ohne Internet auf die gespeicherte Kopie zurück.
const CACHE = "vokabeln-v1";
const CORE = ["./latein-vokabeln.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-180.png"];

self.addEventListener("install", e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate", e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch", e=>{
  const req = e.request;
  if(req.method!=="GET") return;
  const url = new URL(req.url);
  if(url.origin===location.origin){
    // Eigene Dateien: Netz zuerst, sonst gespeicherte Kopie
    e.respondWith(
      fetch(req).then(res=>{
        if(res.ok){ const copy = res.clone(); caches.open(CACHE).then(c=>c.put(req, copy)); }
        return res;
      }).catch(()=>caches.match(req, {ignoreSearch:true}).then(m=>m || caches.match("./latein-vokabeln.html")))
    );
  } else if(url.hostname==="fonts.googleapis.com" || url.hostname==="fonts.gstatic.com"){
    // Schriftarten: einmal laden, dann aus dem Speicher
    e.respondWith(
      caches.match(req).then(m=>m || fetch(req).then(res=>{
        const copy = res.clone(); caches.open(CACHE).then(c=>c.put(req, copy)); return res;
      }))
    );
  }
});
