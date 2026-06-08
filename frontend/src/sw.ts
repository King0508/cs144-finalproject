/// <reference lib="webworker" />
/// <reference types="vite-plugin-pwa/client" />
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

declare const self: ServiceWorkerGlobalScope;

// Precache the build manifest emitted by Vite + injectManifest.
precacheAndRoute(self.__WB_MANIFEST);

// App shell: any navigation request falls back to index.html so the SPA
// can render its own offline UI even when there is no network.
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: "app-shell",
      networkTimeoutSeconds: 3,
    }),
  ),
);

// Static assets: cache-first with a sane expiration.
registerRoute(
  ({ request }) =>
    ["style", "script", "worker", "font"].includes(request.destination),
  new StaleWhileRevalidate({ cacheName: "static-assets" }),
);

registerRoute(
  ({ request }) => request.destination === "image",
  new CacheFirst({
    cacheName: "images",
    plugins: [
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  }),
);

// Web Push: render notifications pushed by the backend (and FCM).
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload: { title?: string; body?: string; url?: string; tag?: string } = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Restored Church Campus Ministry", body: event.data.text() };
  }
  const title = payload.title ?? "Restored Church Campus Ministry";
  const body = payload.body ?? "";
  const data = { url: payload.url ?? "/" };
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      data,
      tag: payload.tag,
      badge: "/icons/icon-192.png",
      icon: "/icons/icon-192.png",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && (event.notification.data as { url?: string }).url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(target));
      if (existing) return existing.focus();
      return self.clients.openWindow(target);
    }),
  );
});

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
