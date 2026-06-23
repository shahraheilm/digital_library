// شاہراہِ علم ڈیجیٹل لائبریری — Service Worker
// مقصد: ویب سائٹ کا خود (shell) آف لائن بھی کھل جائے۔
// نوٹ: گوگل ڈرائیو کے شمارہ جات (PDF) انٹرنیٹ کے بغیر نہیں کھلیں گے۔

const CACHE_NAME = "shahrahe-ilm-library-v2";
const ASSETS_TO_CACHE = [
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// انسٹال: بنیادی فائلیں کیش کریں
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// ایکٹیویٹ: پرانے کیش صاف کریں
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

// فیچ کی حکمت عملی:
// - صفحہ (HTML/navigation): ہمیشہ پہلے نیٹ ورک سے تازہ ورژن لائیں،
//   صرف آف لائن ہونے کی صورت میں کیش سے دکھائیں۔ اس سے نئی اپڈیٹس فوراً نظر آئیں گی۔
// - باقی اپنی فائلیں (manifest, icons): کیش پہلے، رفتار کے لیے۔
// - بیرونی (گوگل ڈرائیو وغیرہ) لنکس میں مداخلت نہیں۔
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  const isNavigation =
    event.request.mode === "navigate" ||
    (event.request.method === "GET" &&
      event.request.headers.get("accept")?.includes("text/html"));

  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then((r) => r || caches.match("./index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => cached);
    })
  );
});
