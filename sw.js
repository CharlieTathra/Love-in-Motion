/* Love in Motion — service worker
   Makes the app work offline once visited. Bump VER to force a refresh
   of the precached shell after changing any of the files below. */
"use strict";

var VER = "limn-v8";

/* Same-origin app shell. Paths are relative to this file (the site root),
   so it works both at the domain root and under /Love-in-Motion/. */
var PRECACHE = [
  "./",
  "./index.html",
  "./nutrition-meal-planner/index.html",
  "./meals/index.html",
  "./training/index.html",
  "./the-415/index.html",
  "./donate/index.html",
  "./Love-in-Motion-Training-Plan.docx",
  "./supabase-sync.js",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-512-maskable.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(VER)
      // allSettled so one missing file can't abort the whole install
      .then(function (c) { return Promise.allSettled(PRECACHE.map(function (u) { return c.add(u); })); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== VER; })
          .map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;

  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  // Let cross-origin requests (e.g. Google Fonts) go straight to the network;
  // the CSS already falls back to system fonts when offline.
  if (url.origin !== self.location.origin) return;

  // Pages: network-first so a new deploy shows immediately, falling back to
  // the cached copy (and finally the cached home page) when offline.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then(function (res) {
          var copy = res.clone();
          caches.open(VER).then(function (c) { c.put(req, copy); });
          return res;
        })
        .catch(function () {
          return caches.match(req).then(function (r) { return r || caches.match("./index.html"); });
        })
    );
    return;
  }

  // Static assets: cache-first, then network (and cache what we fetch).
  e.respondWith(
    caches.match(req).then(function (r) {
      return r || fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(VER).then(function (c) { c.put(req, copy); });
        return res;
      });
    })
  );
});
