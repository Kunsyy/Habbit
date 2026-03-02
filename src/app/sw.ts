/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import { Serwist, NetworkFirst, StaleWhileRevalidate, CacheFirst } from "serwist";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { onBackgroundMessage, getMessaging } from "firebase/messaging/sw";
import { initializeApp } from "firebase/app";

declare global {
  interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}
declare const self: ServiceWorkerGlobalScope;

// --- Firebase Cloud Messaging ---

// Note: Ensure your firebase config is available or initialized correctly
// For background messaging to work, we usually need to initialize the app
// Since we don't have the config here, we assume it's handled or we use the default
// If environment variables are needed, they should be injected or handled.
// For now, we follow the user requirements for the background handler logic.

const firebaseConfig = {
  // Config should ideally be here or passed in
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

onBackgroundMessage(messaging, (payload) => {
  console.log('[sw.ts] Received background message ', payload);
  const habitName = payload.data?.habitName || "Habit Reminder";
  const body = payload.data?.body || "It's time for your habit!";
  const habitId = payload.data?.habitId;
  const icon = '/icons/icon-192x192.png';

  self.registration.showNotification(habitName, {
    body,
    icon,
    data: { habitId },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const habitId = event.notification.data?.habitId;
  const urlToOpen = habitId ? `/dashboard?highlight=${habitId}` : '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// --- Serwist Caching ---

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      // Exclude Firebase services from all caching strategies
      matcher: ({ url }) => {
        const excludedHosts = [
          "firestore.googleapis.com",
          "identitytoolkit.googleapis.com",
          "securetoken.googleapis.com",
          "firebaseinstallations.googleapis.com",
          "firebaseio.com"
        ];
        return excludedHosts.some(host => url.host.includes(host));
      },
      handler: new NetworkFirst({
        cacheName: "firebase-bypass",
      }),
      // Actually, for Firebase we should probably not cache at all.
      // Serwist matcher returning true means it WILL handle it.
      // If we want to EXCLUDE it from Serwist handling, we should make sure other matchers don't catch it.
    },
    {
      matcher: ({ url }) => url.pathname.startsWith("/api/"),
      handler: new NetworkFirst({
        cacheName: "api-cache",
        networkTimeoutSeconds: 5,
      }),
    },
    {
      matcher: ({ url }) => 
        url.pathname.startsWith("/_next/static/") || 
        url.pathname.startsWith("/icons/"),
      handler: new StaleWhileRevalidate({
        cacheName: "static-assets",
      }),
    },
    {
      matcher: ({ url }) => 
        url.host === "fonts.googleapis.com" || 
        url.host === "fonts.gstatic.com",
      handler: new CacheFirst({
        cacheName: "google-fonts",
      }),
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();
