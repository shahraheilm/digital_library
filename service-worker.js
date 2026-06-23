// شاہراہِ علم ڈیجیٹل لائبریری — Service Worker
// مقصد: ویب سائٹ کا خود (shell) آف لائن بھی کھل جائے۔
// نوٹ: گوگل ڈرائیو کے شمارہ جات (PDF) انٹرنیٹ کے بغیر نہیں کھلیں گے۔

const CACHE_NAME = "shahrahe-ilm-library-v1";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
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

// فیچ: صرف اپنی ہی سائٹ کی درخواستوں کے لیے کیش حکمت عملی۔
// بیرونی (گوگل ڈرائیو وغیرہ) لنکس کو براہ راست نیٹ ورک پر جانے دیں۔
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) {
    return; // بیرونی درخواستوں میں مداخلت نہیں
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
        .catch(() => caches.match("./index.html"));
    })
  );
});
