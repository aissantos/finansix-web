/// <reference lib="webworker" />

/**
 * Finansix Service Worker
 * 
 * IMPORTANT: This SW handles ONLY static assets caching.
 * Data fetching and offline support is handled by TanStack Query's 
 * persistQueryClient (see src/lib/query-client.ts).
 * 
 * DO NOT intercept API/Supabase requests here.
 */

const CACHE_NAME = 'finansix-static-v1';

// Only cache truly static assets
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.svg',
];

// Install: Pre-cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('finansix-') && name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch: Only cache static assets, let API calls pass through
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // NEVER intercept:
  // - Non-GET requests
  // - Supabase/API calls
  // - External resources
  // - Chrome extensions
  if (
    request.method !== 'GET' ||
    url.hostname.includes('supabase') ||
    url.pathname.startsWith('/api') ||
    url.origin !== location.origin ||
    url.protocol === 'chrome-extension:'
  ) {
    return; // Let the request pass through normally
  }

  // For HTML navigation: Network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match('/') || caches.match(request))
    );
    return;
  }

  // For static assets: Cache-first
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2?)$/) ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        
        return fetch(request).then((response) => {
          // Clone and cache successful responses
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Everything else: Network only
});

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

