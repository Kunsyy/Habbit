Added tailwind config with violet theme and custom violet-glow keyframes.
## Serwist PWA Implementation
- Successfully integrated @serwist/next into next.config.mjs.
- Created src/app/sw.ts with custom caching strategies (NetworkFirst for /api, StaleWhileRevalidate for assets, CacheFirst for fonts).
- Specifically excluded Firebase services from all caching to prevent interference with live data.
- Implemented FCM background message handler in sw.ts with notification logic.
- Resolved TypeScript issues in sw.ts by adding webworker lib reference and explicit global scope declarations.
- Verified build process generates public/sw.js correctly.
- Initialized firebase-admin in src/lib/firebase/admin.ts with admin name check to avoid double initialization.
- Used .replace(/\n/g, "\n") for privateKey to handle environment variable formatting.
