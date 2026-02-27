# Plan: HabbitApp — Premium Violet Habit Tracker PWA

**Version**: 1.0  
**Date**: 2026-02-27  
**Scope**: Greenfield full-stack web app  
**Target**: Personal use — single user, cross-device (iPhone/Android/PC)

---

## Stack Decisions (Final)

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | Next.js 14+ App Router + TypeScript | SSR, API routes, middleware |
| Styling | Tailwind CSS v3 + shadcn/ui | Rapid premium UI, violet theme |
| Animations | Framer Motion | Spring physics, gesture animations |
| Charts | Recharts (bar/line) + react-activity-calendar (heatmap) | Best combo for habits |
| Confetti | react-canvas-confetti (SSR: false) | Habit completion celebration |
| Auth | Firebase Auth (Google + Email) via next-firebase-auth-edge | SSR-safe, cookie-based |
| Database | Firestore (onSnapshot real-time + IndexedDB offline) | Cross-device sync |
| Push | Firebase Cloud Messaging (FCM) | Web push on all platforms |
| Cron | GitHub Actions (hourly) → POST /api/cron/reminders | Free tier compatible |
| PWA | @serwist/next (service worker) | Offline + FCM background |
| Hosting | Vercel | Free tier |
| Icons | Lucide React | UI icons |
| Habit Icons | Emoji string (emoji picker) | Zero dependency |
| Theme | next-themes | Dark/light/system mode |
| State | Zustand | Global UI state (confetti, theme) |
| Forms | React Hook Form + Zod | Validated forms |

---

## Color System

```
Light Mode:
  Background: #FAFAFA
  Primary: #7C3AED (violet-600)
  Primary hover: #6D28D9 (violet-700)
  Accent gradient: from-violet-500 to-fuchsia-500

Dark Mode:
  Background: #0B090F (dark violet-tinted)
  Surface: #1A1625
  Primary: #8B5CF6 (violet-500)
  Border: rgba(255,255,255,0.1)

Shared:
  border-radius: 1rem (--radius)
  Font: Inter (system fallback)
  Habit preset colors: 8 options (violet, fuchsia, rose, orange, amber, green, cyan, blue)
```

---

## Firestore Data Model

```
users/{userId}
  - email: string
  - displayName: string
  - photoURL: string
  - timezone: string  (IANA, e.g. "Asia/Jakarta")
  - xp: number
  - level: number
  - onboardingComplete: boolean
  - createdAt: Timestamp

users/{userId}/fcmTokens/{tokenId}
  - token: string
  - device: string  ("web-chrome", "ios-safari", etc.)
  - createdAt: Timestamp
  - lastUsed: Timestamp

habits/{habitId}
  - userId: string  (for security rules)
  - name: string
  - emoji: string  (e.g. "🏃")
  - category: string  (enum: health, mindfulness, learning, productivity, other)
  - color: string  (8-color preset key)
  - reminderTime: string | null  (HH:MM 24h format, e.g. "07:00")
  - reminderEnabled: boolean
  - frequency: "daily"  (MVP: daily only, weekday/weekly = v2)
  - order: number  (for drag reorder)
  - currentStreak: number  (updated by Cloud Function, client reads only)
  - longestStreak: number
  - totalCompletions: number
  - createdAt: Timestamp
  - archived: boolean

habits/{habitId}/completions/{dateStr}
  - dateStr: string  (YYYY-MM-DD in user's local timezone)
  - completedAt: Timestamp
  - xpEarned: number

badges/{badgeId}  (static collection, seeded once)
  - id: string
  - name: string
  - description: string
  - emoji: string
  - xpReward: number
  - condition: { type: "streak" | "totalCompletions" | "habits_created", threshold: number }

users/{userId}/earnedBadges/{badgeId}
  - earnedAt: Timestamp
  - habitId: string | null
```

---

## Architecture Diagrams

### Auth Flow (next-firebase-auth-edge)
```
Client login → Firebase Auth → ID token → 
POST /api/auth → sets httpOnly cookie (next-firebase-auth-edge) →
Middleware reads cookie → injects user into server context →
/api/auth/refresh → refreshCredentials() every 50min (before 60min expiry)
```

### Notification Flow
```
GitHub Actions (every hour, UTC)
  → POST https://[app].vercel.app/api/cron/reminders
  → Header: Authorization: Bearer {CRON_SECRET}
  → Route handler:
      1. Get current UTC time → convert to user local time for each timezone
      2. Query habits where reminderTime matches current HH:MM (±1min window)
      3. Fetch fcmTokens for habit owner
      4. firebase-admin messaging.sendEachForMulticast({ tokens, data: {habitId, habitName, emoji} })
      5. Remove invalid tokens from Firestore (clean stale FCM tokens)
```

### PWA Service Worker (app/sw.ts → Serwist)
```
Serwist handles:
  - Static asset caching (StaleWhileRevalidate)
  - API route caching (NetworkFirst, 5s timeout)
  - EXCLUDED from caching: firestore.googleapis.com, *.firebaseio.com

FCM onBackgroundMessage handles:
  - Receives data-only message (no notification object)
  - Constructs and shows notification via self.registration.showNotification()
  - Click opens app to /dashboard?highlight={habitId}
```

### Streak Calculation (Server-Side Only)
```
Client writes: habits/{habitId}/completions/{dateStr} document
Firestore trigger (Cloud Function): onDocumentCreated
  → Read habit.currentStreak and last completion date
  → If yesterday completed: streak + 1
  → If not consecutive: reset to 1
  → Update habits/{habitId}: { currentStreak, longestStreak, totalCompletions }
  → Check badge conditions → if met: write users/{userId}/earnedBadges/{badgeId}
  → Award XP: update users/{userId}.xp and recalculate level
```

---

## File Structure

```
F:\Habbit/
├── .github/
│   └── workflows/
│       └── cron-reminders.yml          # GitHub Actions hourly cron
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx              # Sidebar (desktop) + bottom nav (mobile)
│   │   │   ├── page.tsx                # Dashboard / Home (today's habits)
│   │   │   ├── analytics/page.tsx      # Heatmap + streaks + completion %
│   │   │   ├── habits/
│   │   │   │   ├── page.tsx            # All habits list + CRUD
│   │   │   │   ├── new/page.tsx        # Create habit form
│   │   │   │   └── [id]/edit/page.tsx  # Edit habit form
│   │   │   └── settings/page.tsx       # Theme, notifications, timezone
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── route.ts            # Login endpoint (set cookie)
│   │   │   │   └── refresh/route.ts    # Token refresh endpoint
│   │   │   ├── cron/
│   │   │   │   └── reminders/route.ts  # POST — hourly reminder sender
│   │   │   └── fcm/
│   │   │       └── token/route.ts      # Save/delete FCM token
│   │   ├── sw.ts                       # Serwist + FCM unified SW
│   │   ├── layout.tsx                  # Root layout (ThemeProvider, Providers)
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                         # shadcn/ui components
│   │   ├── habits/
│   │   │   ├── HabitCard.tsx           # Daily check-in card
│   │   │   ├── HabitCardSkeleton.tsx
│   │   │   ├── HabitForm.tsx           # Create/edit form
│   │   │   ├── EmojiPicker.tsx         # Emoji selection grid
│   │   │   ├── ColorPicker.tsx         # 8-preset color circles
│   │   │   ├── StreakBadge.tsx         # Streak flame badge
│   │   │   └── CompletionRing.tsx      # Circular progress (today)
│   │   ├── dashboard/
│   │   │   ├── DashboardHeader.tsx     # Greeting + date + XP bar
│   │   │   ├── TodayProgress.tsx       # X/Y habits done today
│   │   │   └── GamificationBar.tsx     # XP + level display
│   │   ├── analytics/
│   │   │   ├── ActivityHeatmap.tsx     # react-activity-calendar wrapper
│   │   │   ├── StreakCard.tsx          # Current + longest streak
│   │   │   └── HabitCompletionStats.tsx # Per-habit completion %
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx             # Desktop left sidebar
│   │   │   ├── BottomNav.tsx           # Mobile bottom tab bar
│   │   │   └── TopBar.tsx              # Mobile top bar
│   │   ├── onboarding/
│   │   │   ├── OnboardingWizard.tsx    # 3-step modal wrapper
│   │   │   ├── StepTimezone.tsx        # Step 1: set timezone
│   │   │   ├── StepNotifications.tsx   # Step 2: enable push notif + iOS guide
│   │   │   └── StepInstallPWA.tsx      # Step 3: install to home screen
│   │   ├── gamification/
│   │   │   ├── BadgeGrid.tsx           # Earned badges display
│   │   │   ├── BadgeCard.tsx           # Single badge with glow effect
│   │   │   └── XPToast.tsx             # XP earned toast notification
│   │   ├── ConfettiOverlay.tsx         # Fixed overlay, SSR: false
│   │   └── ServiceWorkerRegistrar.tsx  # Registers SW after hydration
│   ├── hooks/
│   │   ├── useAuth.ts                  # Firebase auth state
│   │   ├── useHabits.ts                # Firestore onSnapshot habits
│   │   ├── useTodayCompletions.ts      # Today's completions real-time
│   │   ├── useFCM.ts                   # FCM token management
│   │   └── useConfetti.ts             # Trigger confetti via Zustand
│   ├── lib/
│   │   ├── firebase/
│   │   │   ├── config.ts               # Client Firebase init
│   │   │   └── admin.ts                # Server firebase-admin init
│   │   ├── firestore/
│   │   │   ├── habits.ts               # Habit CRUD operations
│   │   │   ├── completions.ts          # Completion write operations
│   │   │   └── users.ts                # User profile operations
│   │   ├── auth-edge.ts                # next-firebase-auth-edge config
│   │   └── utils.ts                    # Date utils (timezone-aware)
│   ├── store/
│   │   └── useAppStore.ts              # Zustand (confetti, theme)
│   ├── types/
│   │   ├── habit.ts
│   │   ├── user.ts
│   │   └── badge.ts
│   └── middleware.ts                   # Auth middleware (next-firebase-auth-edge)
├── public/
│   ├── manifest.json                   # PWA manifest (violet theme)
│   ├── icons/                          # PWA icons (192, 512, maskable)
│   └── sw.js                           # Built output (Serwist)
├── functions/                          # Firebase Cloud Functions
│   ├── src/
│   │   └── index.ts                    # onCompletionCreated trigger
│   └── package.json
├── firestore.rules
├── firestore.indexes.json
├── firebase.json
├── next.config.mjs                     # Serwist + headers config
├── tailwind.config.ts                  # Violet theme + shadcn
├── components.json                     # shadcn/ui config
├── vercel.json                         # Env, headers
└── .env.local.example                  # All required env vars

```

---

## Environment Variables

```bash
# Client-safe (NEXT_PUBLIC_)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=        # From Firebase Console → Web Push Certificates

# Server-only
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=                  # MUST .replace(/\\n/g, '\n') on use
CRON_SECRET=                           # Random 32-char string for GitHub Actions auth

# next-firebase-auth-edge
AUTH_COOKIE_NAME=AuthToken
AUTH_COOKIE_SIGNATURE_KEYS=["key1","key2"]  # Random strings
```

---

## Scope Boundaries

### IN Scope (MVP)
- Habit CRUD (name, emoji, category, color preset, reminder time, reminderEnabled)
- Daily check-in (complete/uncomplete today's habits)
- Streak tracking (current + longest, server-side Cloud Function)
- Push notifications (per-habit reminder time via GitHub Actions cron)
- Analytics: calendar heatmap + per-habit completion % + streak display
- Gamification: XP system + levels + 8 forward-looking badges
- Categories (5 preset: health, mindfulness, learning, productivity, other)
- Dark/Light/System mode
- Onboarding wizard (timezone + notifications + iOS install guide)
- Habit ordering (drag to reorder)
- Offline support (IndexedDB via Firestore SDK)
- PWA installable (Lighthouse ≥ 90)

### OUT of Scope (v2)
- Tags (separate from categories)
- Weekday-specific or X-per-week frequency habits
- Free-form hex color picker
- Lucide/SVG habit icons
- Retroactive badge scanning
- Social features / sharing
- Data export
- Weekly/category/XP history charts
- Multiple users / team habits

---

## Guardrails (MUST NOT violate)

1. **NEVER** use `FieldValue.increment()` from client for streak math — server Cloud Function only
2. **NEVER** call `Notification.requestPermission()` on page load — only on explicit user button tap
3. **NEVER** let Serwist cache `firestore.googleapis.com` or `*.firebaseio.com`
4. **NEVER** use `notification` object in FCM payload — data-only messages, SW constructs notification
5. **NEVER** configure firebase-admin in Edge Runtime — Node.js API routes only
6. **NEVER** calculate dates in UTC for user-facing date keys — always use stored IANA timezone
7. **NEVER** grant badges retroactively in MVP — forward-looking event-triggered only
8. **NEVER** store streaks on client state as source of truth — Firestore is source of truth

---

## Task List

### PHASE 0: Project Scaffold + Config

#### TASK 0.1: Initialize Next.js project
**File**: `F:\Habbit\` (root)
**Action**: Run `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`. Accept all defaults. Then install all dependencies.

**Dependencies to install**:
```bash
# Core
npm install firebase firebase-admin next-firebase-auth-edge

# UI
npm install framer-motion lucide-react next-themes zustand

# shadcn setup
npx shadcn@latest init
# Choose: Default style, violet color, CSS variables: yes

# shadcn components
npx shadcn@latest add button card input label select switch toast dialog sheet tabs badge avatar skeleton progress separator scroll-area

# Forms
npm install react-hook-form @hookform/resolvers zod

# Charts
npm install recharts react-activity-calendar

# Effects
npm install react-canvas-confetti

# PWA
npm install @serwist/next serwist

# Emoji
npm install emoji-mart @emoji-mart/data @emoji-mart/react

# Dev
npm install -D @types/react-canvas-confetti
```

**QA**: `npm run dev` starts without errors on localhost:3000. TypeScript compiles with `npx tsc --noEmit`.

---

#### TASK 0.2: Configure Tailwind with violet theme
**File**: `tailwind.config.ts`
**Action**: Extend theme with violet CSS variables to match shadcn config. The `content` array must include `./src/**/*.{ts,tsx}`.

**Key additions**:
- `primary`: `hsl(var(--primary))` mapped to violet-600 (#7C3AED) in light, violet-500 (#8B5CF6) in dark
- `background` dark mode: `#0B090F`
- `--radius`: `1rem`
- Custom `violet-glow` keyframe for streak badge animation: `box-shadow: 0 0 20px #7C3AED`

**File**: `src/app/globals.css`
**Action**: Define CSS variables for light and dark mode. Both `:root` (light) and `.dark` scopes.

```css
/* Light */
:root {
  --background: 0 0% 98%;
  --foreground: 262 80% 10%;
  --primary: 263 70% 50%;  /* violet-600 */
  --primary-foreground: 0 0% 100%;
  --card: 0 0% 100%;
  --border: 263 20% 90%;
  --radius: 1rem;
}
/* Dark */
.dark {
  --background: 262 30% 6%;    /* #0B090F */
  --foreground: 0 0% 95%;
  --primary: 263 68% 65%;      /* violet-500 */
  --card: 262 25% 12%;         /* #1A1625 */
  --border: 263 20% 20%;
}
```

**QA**: Visit localhost:3000. Toggle dark mode. Primary button appears violet. Background appears deep dark violet.

---

#### TASK 0.3: Configure Next.js with Serwist PWA
**File**: `next.config.mjs`
**Action**: Wrap config with `withSerwistInit`.

```javascript
import withSerwistInit from "@serwist/next";
const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});
export default withSerwist({
  reactStrictMode: true,
  // headers for security (CSP, HSTS)
});
```

**File**: `src/app/sw.ts`
**Action**: Create unified service worker with Serwist caching + FCM background handler.

Key requirements:
- Import `Serwist` from "serwist"
- Add `NetworkFirst` for `/api/*` routes (5s timeout)
- Add `StaleWhileRevalidate` for static assets (`/_next/static/*`, `/icons/*`)
- Add `CacheFirst` for Google Fonts
- **MUST exclude**: `firestore.googleapis.com`, `identitytoolkit.googleapis.com`, `securetoken.googleapis.com`, `firebaseinstallations.googleapis.com` from all strategies
- Import `onBackgroundMessage`, `getMessaging` from `firebase/messaging/sw`
- `onBackgroundMessage`: receive data payload → `self.registration.showNotification(data.habitName, { body, icon, data: { habitId } })`
- `notificationclick`: `event.waitUntil(clients.openWindow('/dashboard?highlight=' + habitId))`

**QA**: After `npm run build`, `public/sw.js` exists. Chrome DevTools → Application → Service Workers: SW registered. Firestore listeners still work (no console errors about intercepted requests).

---

#### TASK 0.4: Create PWA manifest
**File**: `public/manifest.json`
**Content**:
```json
{
  "name": "Habbit — Habit Tracker",
  "short_name": "Habbit",
  "description": "Premium habit tracker with streaks and reminders",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0B090F",
  "theme_color": "#7C3AED",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

**Action**: Generate 3 PNG icons (violet gradient background, white "H" letter or habit icon) at 192×192, 512×512 sizes. Place in `public/icons/`. Add `<link rel="manifest">` to root layout.

**QA**: Lighthouse PWA audit reports manifest valid. Chrome shows "Install" button in address bar.

---

#### TASK 0.5: Create `.env.local.example`
**File**: `.env.local.example`
**Action**: Document all required environment variables (listed in Environment Variables section above) with comments explaining where to find each value. This file is committed to repo (no actual secrets).

**QA**: File exists, contains all 11 required variables with source comments.

---

### PHASE 1: Firebase Setup

#### TASK 1.1: Firebase client config
**File**: `src/lib/firebase/config.ts`
**Action**: Initialize Firebase app (guard against double-init with `getApps().length`). Export `auth`, `db` (Firestore), `messaging` (lazy, client-only).

```typescript
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  // ... all NEXT_PUBLIC vars
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable offline persistence (IndexedDB) — client-side only
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch(() => {});
}
```

**QA**: No "Firebase: Error (app/duplicate-app)" in console. Firestore reads work in offline mode (disable network in DevTools).

---

#### TASK 1.2: Firebase Admin config
**File**: `src/lib/firebase/admin.ts`
**Action**: Initialize firebase-admin for Node.js API routes only.

```typescript
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

const adminApp = getApps().find(a => a.name === "admin") 
  ?? initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  }, "admin");

export const adminDb = getFirestore(adminApp);
export const adminMessaging = getMessaging(adminApp);
```

**Guardrail**: This file MUST NOT be imported in any Edge Runtime file (middleware.ts, app/sw.ts). Import only in `src/app/api/` route handlers.

**QA**: `/api/cron/reminders` with correct `CRON_SECRET` returns 200 (not 500 admin-init error). `npx tsc --noEmit` shows no import errors.

---

#### TASK 1.3: next-firebase-auth-edge setup
**File**: `src/lib/auth-edge.ts`
**Action**: Export server config for next-firebase-auth-edge.

```typescript
export const serverConfig = {
  cookieName: process.env.AUTH_COOKIE_NAME!,
  cookieSignatureKeys: JSON.parse(process.env.AUTH_COOKIE_SIGNATURE_KEYS!),
  cookieSerializeOptions: {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 12 * 60 * 60 * 24, // 12 days
  },
  serviceAccount: {
    projectId: process.env.FIREBASE_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")!,
  },
};
```

**File**: `src/middleware.ts`
**Action**: Verify auth cookie on every request to `(dashboard)` routes. Redirect to `/login` if unauthenticated.

```typescript
import { authMiddleware, redirectToLogin } from "next-firebase-auth-edge";
import { NextRequest } from "next/server";
import { serverConfig } from "@/lib/auth-edge";

export async function middleware(request: NextRequest) {
  return authMiddleware(request, {
    loginPath: "/api/auth/login",
    logoutPath: "/api/auth/logout",
    redirectToPath: "/dashboard",
    ...serverConfig,
    handleValidToken: async ({ token }, headers) => NextResponse.next({ request: { headers } }),
    handleInvalidToken: async (reason) => redirectToLogin(request, { reason, redirectPath: "/login" }),
    handleError: async (error) => redirectToLogin(request, { redirectPath: "/login" }),
  });
}

export const config = {
  matcher: ["/dashboard/:path*", "/habits/:path*", "/analytics/:path*", "/settings/:path*"],
};
```

**File**: `src/app/api/auth/route.ts`
**Action**: POST endpoint that receives Firebase ID token from client, calls `createServerSessionCookies()`, sets httpOnly cookie.

**File**: `src/app/api/auth/refresh/route.ts`  
**Action**: GET endpoint that calls `refreshCredentials()`. Called by client every 50 minutes via `setInterval`.

**QA**: 
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard` → 302 (not 200)
- Login → navigate to dashboard → works
- Wait token expiry simulation → page stays functional (refresh endpoint called)

---

#### TASK 1.4: Firestore Security Rules
**File**: `firestore.rules`
**Action**: Write security rules enforcing single-user ownership.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /fcmTokens/{tokenId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /earnedBadges/{badgeId} {
        allow read: if request.auth != null && request.auth.uid == userId;
        allow write: if false; // Cloud Function writes only
      }
    }
    
    match /habits/{habitId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      
      match /completions/{dateStr} {
        allow read, write: if request.auth != null 
          && request.auth.uid == get(/databases/$(database)/documents/habits/$(habitId)).data.userId;
      }
    }
    
    match /badges/{badgeId} {
      allow read: if request.auth != null;
      allow write: if false; // Admin writes only
    }
  }
}
```

**File**: `firestore.indexes.json`
**Action**: Add composite indexes:
- `habits`: `(userId ASC, order ASC)` — for ordered habit list
- `habits`: `(userId ASC, reminderEnabled ASC, reminderTime ASC)` — for cron query

**QA**: `firebase deploy --only firestore:rules,firestore:indexes` succeeds. Unauthenticated read of `/habits/{anyId}` returns permission-denied error.

---

#### TASK 1.5: Seed badge definitions
**Action**: Create a one-time admin script `scripts/seed-badges.ts` that writes 8 badge documents to Firestore `/badges/` collection.

**8 MVP Badges**:
1. `first-step` — "First Step" 🎯 — Complete your first habit (totalCompletions: 1) — 50 XP
2. `week-warrior` — "Week Warrior" 🔥 — 7-day streak (streak: 7) — 100 XP
3. `fortnight-flame` — "Fortnight Flame" ⚡ — 14-day streak (streak: 14) — 200 XP
4. `monthly-master` — "Monthly Master" 👑 — 30-day streak (streak: 30) — 500 XP
5. `century` — "Century" 💯 — 100 total completions (totalCompletions: 100) — 300 XP
6. `habit-builder` — "Habit Builder" 🏗️ — Create 5 habits (habits_created: 5) — 150 XP
7. `dedicated` — "Dedicated" 💪 — 50 total completions (totalCompletions: 50) — 150 XP
8. `perfectionist` — "Perfectionist" ✨ — Complete all habits in a day 5 times (condition: custom) — 250 XP

**QA**: `ts-node scripts/seed-badges.ts` succeeds. Firebase Console shows 8 documents in `/badges/`.

---

### PHASE 2: Auth UI

#### TASK 2.1: Login page
**File**: `src/app/(auth)/login/page.tsx`
**Action**: Build login page with Google sign-in button and email/password form.

**UI Spec**:
- Full-screen centered card (max-w-md)
- Top: app logo (violet gradient "H" with sparkle) + "Habbit" wordmark
- Tagline: "Build better habits. Every day."
- Google sign-in button (white bg, Google logo, full-width, rounded-xl)
- Divider: "or continue with email"
- Email + password fields (shadcn Input with violet focus ring)
- Submit button (violet gradient, full-width)
- Link to /register at bottom
- Background: subtle violet radial gradient on dark bg

**Logic**:
1. Google: `signInWithPopup(auth, googleProvider)` → get ID token → POST `/api/auth` with token
2. Email: `signInWithEmailAndPassword` → same flow
3. After successful cookie set → `router.push('/dashboard')`
4. Show loading spinner during auth

**Error states**: "Invalid credentials" toast (sonner), "Network error" toast.

**QA**: Login with Google works. Login with wrong password shows error toast. After login, `/dashboard` loads with user data.

---

#### TASK 2.2: Register page
**File**: `src/app/(auth)/register/page.tsx`
**Action**: Register page with name, email, password fields.

**Logic**: `createUserWithEmailAndPassword` → `updateProfile(user, { displayName })` → create Firestore user document → POST `/api/auth` → `router.push('/dashboard')`.

**QA**: New user created in Firebase Auth console. Firestore `users/{uid}` document exists with `onboardingComplete: false`.

---

#### TASK 2.3: useAuth hook
**File**: `src/hooks/useAuth.ts`
**Action**: Firebase `onAuthStateChanged` listener wrapped in hook. Returns `{ user, loading, signOut }`.

Also starts 50-minute token refresh interval when user is authenticated:
```typescript
useEffect(() => {
  if (!user) return;
  const interval = setInterval(() => fetch('/api/auth/refresh'), 50 * 60 * 1000);
  return () => clearInterval(interval);
}, [user]);
```

**QA**: `user` is populated after login. `loading` is true only during initial auth check. SignOut clears cookie and redirects to `/login`.

---

### PHASE 3: Core Data Layer

#### TASK 3.1: Firestore habit operations
**File**: `src/lib/firestore/habits.ts`
**Action**: Pure functions for habit CRUD (no hooks, just Firestore calls).

```typescript
// All functions require userId param for security
export async function createHabit(userId: string, data: CreateHabitInput): Promise<string>
export async function updateHabit(habitId: string, data: Partial<Habit>): Promise<void>
export async function deleteHabit(habitId: string): Promise<void>
  // IMPORTANT: deleteHabit must batch-delete all completions subcollection
  // Use batched writes (max 500 per batch). For large collections, loop batches.
export async function reorderHabits(habits: { id: string; order: number }[]): Promise<void>
export function subscribeToHabits(userId: string, callback: (habits: Habit[]) => void): Unsubscribe
  // Returns onSnapshot unsubscribe function
  // Query: where("userId", "==", userId), orderBy("order", "asc")
```

**File**: `src/lib/firestore/completions.ts`
```typescript
export async function completeHabit(habitId: string, dateStr: string): Promise<void>
  // dateStr = YYYY-MM-DD in user's local timezone
  // Write: habits/{habitId}/completions/{dateStr} with completedAt + xpEarned: 10
export async function uncompleteHabit(habitId: string, dateStr: string): Promise<void>
  // Delete the completion document
export function subscribeToDayCompletions(
  habitIds: string[], 
  dateStr: string, 
  callback: (completedIds: Set<string>) => void
): Unsubscribe
```

**File**: `src/lib/utils.ts`
**Action**: Date utility functions using stored timezone.

```typescript
export function getTodayDateStr(timezone: string): string
  // Returns YYYY-MM-DD in given IANA timezone using Intl.DateTimeFormat
export function getDateStr(date: Date, timezone: string): string
export function getMonthDateStrings(year: number, month: number, timezone: string): string[]
  // For heatmap data
```

**QA**: Unit tests (Jest) for `getTodayDateStr` — assert Jakarta (UTC+7) returns next day vs UTC at 11pm UTC.

---

#### TASK 3.2: useHabits hook
**File**: `src/hooks/useHabits.ts`
**Action**: Real-time Firestore subscription for user's habits.

```typescript
export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToHabits(user.uid, (h) => {
      setHabits(h);
      setLoading(false);
    });
    return unsub;
  }, [user]);
  
  return { habits, loading };
}
```

**File**: `src/hooks/useTodayCompletions.ts`
**Action**: Real-time subscription to today's completions. Returns `Set<string>` of completed habit IDs.

```typescript
export function useTodayCompletions(habitIds: string[]) {
  // Subscribes to completions for today's dateStr
  // Uses user timezone from profile
}
```

**QA**: Add habit in one browser tab → appears in another tab in <1s. Complete habit → uncomplete → Firestore reflects both. Offline: complete habit → reconnect → completion synced.

---

#### TASK 3.3: User profile operations
**File**: `src/lib/firestore/users.ts`
```typescript
export async function createUserProfile(user: FirebaseUser): Promise<void>
  // Called on first login. Sets all default fields. onboardingComplete: false.
export async function updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<void>
export async function getUserProfile(userId: string): Promise<UserProfile | null>
export function subscribeToUserProfile(userId: string, callback: (profile: UserProfile) => void): Unsubscribe
```

**QA**: After Google login, user document created in Firestore with correct fields.

---

### PHASE 4: Cloud Function (Streak + XP + Badges)

#### TASK 4.1: Firebase Cloud Function for streak + gamification
**File**: `functions/src/index.ts`
**Action**: Cloud Function triggered on completion document creation.

```typescript
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

export const onHabitCompletion = onDocumentCreated(
  "habits/{habitId}/completions/{dateStr}",
  async (event) => {
    const { habitId, dateStr } = event.params;
    const db = getFirestore();
    
    const habitRef = db.doc(`habits/${habitId}`);
    const habit = (await habitRef.get()).data()!;
    const userId = habit.userId;
    
    // 1. Calculate streak
    const yesterday = getPreviousDateStr(dateStr, habit.timezone); // use stored user timezone
    const yesterdayCompletion = await habitRef.collection("completions").doc(yesterday).get();
    const newStreak = yesterdayCompletion.exists ? habit.currentStreak + 1 : 1;
    const newLongest = Math.max(newStreak, habit.longestStreak || 0);
    const newTotal = (habit.totalCompletions || 0) + 1;
    
    // 2. Update habit doc
    await habitRef.update({
      currentStreak: newStreak,
      longestStreak: newLongest,
      totalCompletions: newTotal,
    });
    
    // 3. Award XP (base 10 + streak bonus)
    const xpEarned = 10 + Math.min(newStreak, 10); // max 20 XP per completion
    const userRef = db.doc(`users/${userId}`);
    await userRef.update({ xp: FieldValue.increment(xpEarned) });
    
    // 4. Recalculate level (every 100 XP = 1 level)
    const userSnap = await userRef.get();
    const newXp = userSnap.data()!.xp;
    const newLevel = Math.floor(newXp / 100) + 1;
    await userRef.update({ level: newLevel });
    
    // 5. Check badges (forward-looking, streak-based)
    await checkAndGrantBadges(db, userId, habitId, newStreak, newTotal);
  }
);

async function checkAndGrantBadges(db, userId, habitId, streak, totalCompletions) {
  const badgesToCheck = [
    { id: "first-step", condition: totalCompletions >= 1 },
    { id: "week-warrior", condition: streak >= 7 },
    { id: "fortnight-flame", condition: streak >= 14 },
    { id: "monthly-master", condition: streak >= 30 },
    { id: "dedicated", condition: totalCompletions >= 50 },
    { id: "century", condition: totalCompletions >= 100 },
  ];
  
  for (const { id, condition } of badgesToCheck) {
    if (!condition) continue;
    const badgeRef = db.doc(`users/${userId}/earnedBadges/${id}`);
    const existing = await badgeRef.get();
    if (!existing.exists) {
      const badgeData = (await db.doc(`badges/${id}`).get()).data()!;
      await badgeRef.set({ earnedAt: FieldValue.serverTimestamp(), habitId });
      // XP already counted in step 3 above, skip double-award
    }
  }
}
```

**Guardrail**: All date math uses `habit.userId`-resolved timezone. `getPreviousDateStr` must account for timezone to avoid UTC vs local midnight edge cases.

**QA**: 
- Complete habit day 1 → `currentStreak === 1`, `totalCompletions === 1`
- Complete habit day 2 → `currentStreak === 2`  
- Skip day 3, complete day 4 → `currentStreak === 1` (reset)
- `first-step` badge appears in `users/{id}/earnedBadges` after first completion

---

### PHASE 5: Dashboard + Habit UI

#### TASK 5.1: Root layout with providers
**File**: `src/app/layout.tsx`
**Action**: Set up all providers in correct order.

```typescript
// Providers: ThemeProvider (next-themes) > AuthProvider > Zustand store
// Components: ServiceWorkerRegistrar, ConfettiOverlay, Toaster (sonner)
// Meta: viewport, manifest link, theme-color meta tag
// Font: Inter from next/font/google
```

**QA**: Dark mode toggle works. Provider tree renders without hydration mismatch.

---

#### TASK 5.2: Dashboard layout (sidebar + bottom nav)
**File**: `src/app/(dashboard)/layout.tsx`
**Action**: Responsive layout with sidebar on desktop, bottom tab nav on mobile.

**Desktop Sidebar** (`src/components/layout/Sidebar.tsx`):
- Fixed left, 240px wide
- Logo at top
- Nav items: Home, Habits, Analytics, Settings (with active indicator — violet left border + violet text)
- User avatar + name at bottom with sign-out
- Background: card color with subtle border-right

**Mobile Bottom Nav** (`src/components/layout/BottomNav.tsx`):
- `fixed bottom-0 left-0 right-0` with `pb-[env(safe-area-inset-bottom)]` for iPhone
- 4 tabs: Home, Habits, Analytics, Settings
- Active tab: violet icon + label
- Background: card color, border-top

**QA**: On mobile viewport (< 768px): sidebar hidden, bottom nav visible. On desktop: sidebar visible, bottom nav hidden.

---

#### TASK 5.3: Dashboard home page (today's habits)
**File**: `src/app/(dashboard)/page.tsx`
**Action**: Today's habit check-in view.

**UI Sections**:
1. **DashboardHeader**: "Good morning, {name} 👋" greeting, today's date, current level badge
2. **TodayProgress**: "X of Y habits done" with circular progress ring (Framer Motion animated arc)
3. **GamificationBar**: XP progress bar with level number. Show XP needed to next level.
4. **Habit List**: `HabitCard` for each habit, ordered by `order` field

**HabitCard** (`src/components/habits/HabitCard.tsx`):
- Card with habit color as left border (4px) or as icon background
- Left: emoji in colored circle
- Center: habit name + `StreakBadge` (flame icon + number, glows if streak > 7)
- Right: completion toggle button (circle → checkmark with spring animation)
- Completion animation: SVG pathLength checkmark + brief card scale 1.05 spring + confetti trigger
- Swipe left on mobile to reveal edit/delete quick actions (use-gesture)
- Skeleton loading state for initial load

**Completion Toggle Logic**:
- Optimistic UI: update local state immediately
- Call `completeHabit()` or `uncompleteHabit()` 
- On error: revert local state + show error toast

**Confetti trigger**: On completion, call `triggerConfetti()` from Zustand store. `ConfettiOverlay` listens and fires react-canvas-confetti burst.

**QA**:
- Complete habit → checkmark animates, XP toast appears, confetti fires
- Uncomplete → reverts to empty circle
- All habits completed → TodayProgress ring shows 100%, special "Amazing!" message

---

#### TASK 5.4: Habit CRUD pages
**File**: `src/app/(dashboard)/habits/page.tsx`
**Action**: All habits list with add button.

- Header with "My Habits" + "+ New Habit" button
- Drag-to-reorder list using Framer Motion layout animations (reorderHabits on drag end)
- Each row: emoji + name + category badge + reminder time + edit icon + archive toggle
- Empty state: illustration + "Start your first habit" CTA

**File**: `src/app/(dashboard)/habits/new/page.tsx`  
**File**: `src/app/(dashboard)/habits/[id]/edit/page.tsx`

Both use the shared `HabitForm` component.

**HabitForm** (`src/components/habits/HabitForm.tsx`):
- React Hook Form + Zod schema
- Fields:
  - Name (text input, max 50 chars)
  - Emoji (opens EmojiPicker popover, shows selected emoji large)
  - Category (shadcn Select: health/mindfulness/learning/productivity/other)
  - Color (ColorPicker: 8 colored circles, selected shows checkmark)
  - Reminder toggle (Switch)
  - Reminder time (time input, shown only if reminder enabled)
- Submit: "Create Habit" or "Save Changes" (violet gradient button)
- Delete button (red, only on edit page) — shows confirmation Dialog before delete

**EmojiPicker** (`src/components/habits/EmojiPicker.tsx`):
- Uses `@emoji-mart/react` Picker inside a shadcn Popover
- Dark mode aware (data-theme="dark" prop)

**ColorPicker** (`src/components/habits/ColorPicker.tsx`):
- 8 circles: violet, fuchsia, rose, orange, amber, green, cyan, blue
- Selected circle has white checkmark overlay

**Zod Schema**:
```typescript
const habitSchema = z.object({
  name: z.string().min(1).max(50),
  emoji: z.string().min(1),
  category: z.enum(["health", "mindfulness", "learning", "productivity", "other"]),
  color: z.enum(["violet", "fuchsia", "rose", "orange", "amber", "green", "cyan", "blue"]),
  reminderEnabled: z.boolean(),
  reminderTime: z.string().nullable().refine(
    (val) => !val || /^\d{2}:\d{2}$/.test(val),
    "Invalid time format"
  ),
});
```

**QA**:
- Create habit → appears in dashboard within 1s (Firestore onSnapshot)
- Edit habit → changes reflected in real-time on other tabs
- Delete habit → all completions deleted (verify in Firebase Console no orphan docs)
- Form validation: empty name shows error, invalid time shows error

---

### PHASE 6: Onboarding Wizard

#### TASK 6.1: Onboarding wizard (3-step modal)
**File**: `src/components/onboarding/OnboardingWizard.tsx`
**Action**: Full-screen dialog overlay shown to users with `onboardingComplete: false`.

**Step 1 — Timezone** (`StepTimezone.tsx`):
- Auto-detect with `Intl.DateTimeFormat().resolvedOptions().timeZone`
- Show detected timezone in a card
- Option to change (Select with common IANA timezones)
- "Looks good!" primary button → saves to Firestore user profile → advances to step 2

**Step 2 — Notifications** (`StepNotifications.tsx`):
- Illustration of a phone with notification
- Title: "Stay on track with reminders"
- iOS detection: if `navigator.userAgent` includes iPhone/iPad → show "You'll need to install this app first" warning with Safari share icon illustration
- "Enable Notifications" button (calls `Notification.requestPermission()` ONLY on button tap, never auto)
- On granted: calls `useFCM.requestToken()` → saves token → advances to step 3
- On denied: show "You can enable later in Settings" → skip to step 3 button

**Step 3 — Install PWA** (`StepInstallPWA.tsx`):
- If `window.matchMedia('(display-mode: standalone)').matches`: show "Already installed! 🎉" → "Start tracking" button → closes wizard
- If not installed: show install instructions
  - iOS: step-by-step with Safari share button illustration → "Add to Home Screen"
  - Android/Chrome: shows browser install prompt if `beforeinstallprompt` is available
  - Otherwise: manual instructions
- "Start tracking" button → closes wizard → `updateUserProfile({ onboardingComplete: true })`

**Mount logic in root layout**: `<OnboardingWizard />` rendered inside `(dashboard)/layout.tsx`. Checks `userProfile.onboardingComplete` from Firestore subscription. Shows wizard if false.

**QA**: 
- New user lands on dashboard → wizard appears immediately
- Step through all 3 steps → wizard closes → never shown again
- Return user → no wizard shown
- On iOS, step 2 shows install-first warning

---

### PHASE 7: Push Notifications

#### TASK 7.1: useFCM hook
**File**: `src/hooks/useFCM.ts`
**Action**: FCM token management hook.

```typescript
export function useFCM() {
  const requestToken = async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;
    
    const { getMessaging, getToken } = await import("firebase/messaging");
    const messaging = getMessaging(firebaseApp);
    const token = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY });
    
    // Save to Firestore + call /api/fcm/token
    await fetch("/api/fcm/token", { 
      method: "POST", 
      body: JSON.stringify({ token, device: getDeviceInfo() })
    });
    
    // Listen for foreground messages
    onMessage(messaging, (payload) => {
      // Show sonner toast instead of system notification (app is in foreground)
      toast(`🔔 ${payload.data?.habitName}`, { description: "Time for your habit!" });
    });
  };
  
  return { requestToken };
}

function getDeviceInfo(): string {
  const ua = navigator.userAgent;
  if (/iPhone|iPad/.test(ua)) return "ios-safari";
  if (/Android/.test(ua)) return "android-chrome";
  return "web-" + (navigator.userAgent.includes("Chrome") ? "chrome" : "other");
}
```

**File**: `src/app/api/fcm/token/route.ts`
**Action**: POST saves FCM token to `users/{userId}/fcmTokens/{tokenId}`. DELETE removes token on sign-out.

**QA**: After enabling notifications, `users/{uid}/fcmTokens/{tokenId}` document exists in Firestore.

---

#### TASK 7.2: Cron reminder route handler
**File**: `src/app/api/cron/reminders/route.ts`
**Action**: POST endpoint called by GitHub Actions every hour.

```typescript
export async function POST(request: Request) {
  // 1. Verify CRON_SECRET header
  const auth = request.headers.get("Authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  
  // 2. Get current UTC time, compute HH:MM per timezone
  // For each unique timezone in Firestore users:
  //   Convert UTC now → local HH:MM
  //   Query habits where reminderEnabled=true, reminderTime=localHHMM
  
  // 3. For each matching habit, get user's FCM tokens
  const habitsQuery = adminDb.collectionGroup("habits") // Note: needs composite index
    // Alternative: query per user document to avoid collectionGroup security issues
  
  // Better approach: query users collection, for each user check their habits
  // Use Firestore collectionGroup("habits") with index on (reminderEnabled, reminderTime, userId)
  
  // 4. Send FCM data-only messages
  const result = await adminMessaging.sendEachForMulticast({
    tokens: fcmTokens,
    data: {
      habitId,
      habitName: habit.name,
      emoji: habit.emoji,
      type: "reminder",
    },
    // NO notification object — SW handles display
  });
  
  // 5. Clean up invalid tokens
  result.responses.forEach((res, idx) => {
    if (!res.success && res.error?.code === "messaging/registration-token-not-registered") {
      // Delete stale token from Firestore
      adminDb.doc(`users/${userId}/fcmTokens/${tokenIds[idx]}`).delete();
    }
  });
  
  return Response.json({ sent: result.successCount, failed: result.failureCount });
}
```

**QA**: 
- `curl -X POST http://localhost:3000/api/cron/reminders` without auth → 401
- `curl -X POST http://localhost:3000/api/cron/reminders -H "Authorization: Bearer {CRON_SECRET}"` → 200 with JSON
- Invalid FCM token → cleaned up from Firestore after send attempt

---

#### TASK 7.3: GitHub Actions cron workflow
**File**: `.github/workflows/cron-reminders.yml`
**Content**:
```yaml
name: Habit Reminder Cron

on:
  schedule:
    - cron: '0 * * * *'  # Every hour at :00
  workflow_dispatch:       # Manual trigger for testing

jobs:
  send-reminders:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: Trigger reminder endpoint
        run: |
          response=$(curl -s -o /dev/null -w "%{http_code}" \
            -X POST "${{ secrets.APP_URL }}/api/cron/reminders" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json")
          echo "Response: $response"
          if [ "$response" != "200" ]; then
            echo "Cron job failed with status $response"
            exit 1
          fi
```

**GitHub Secrets required**: `APP_URL` (https://your-app.vercel.app), `CRON_SECRET` (same value as Vercel env var)

**QA**: 
- Manually trigger workflow → passes → Vercel logs show POST to `/api/cron/reminders`
- Set a habit reminder for current time +2 min → GitHub Actions manual trigger → notification received on phone

---

### PHASE 8: Analytics

#### TASK 8.1: Analytics page
**File**: `src/app/(dashboard)/analytics/page.tsx`
**Action**: Analytics dashboard.

**UI Sections**:
1. **Activity Heatmap** (`ActivityHeatmap.tsx`):
   - `react-activity-calendar` component with violet color scheme
   - Data: query all completions for past 365 days across all habits
   - Color levels: 0 completions = muted, 1 = violet-200, 2-3 = violet-400, 4+ = violet-600
   - Tooltip showing date + completion count

2. **Streak Cards** (`StreakCard.tsx`):
   - Per-habit cards showing current streak (🔥) and longest streak (⚡)
   - Flame animation if current streak ≥ 7 days

3. **Completion Stats** (`HabitCompletionStats.tsx`):
   - List of habits with completion percentage (bar + percentage text)
   - Calculated: totalCompletions / daysSinceCreation
   - Sorted by completion % descending

**Data loading**: Server Component fetches past 365 days completions via firebase-admin on first load. Client Component uses onSnapshot for real-time updates.

**QA**: 
- Complete habits for 3 days → heatmap shows 3 colored cells
- Analytics % updates within 1s of completing habit on another tab

---

### PHASE 9: Gamification UI

#### TASK 9.1: XP + Level + Badges display
**File**: `src/components/gamification/XPToast.tsx`
**Action**: Toast that appears when XP is earned. Subscribes to Firestore `users/{uid}.xp` changes and shows "+10 XP" toast when value increases.

**File**: `src/components/gamification/BadgeGrid.tsx`  
**File**: `src/components/gamification/BadgeCard.tsx`
**Action**: Display earned badges in Settings or a dedicated section. Locked badges shown as grayscale with locked icon. Earned badges show with violet glow animation.

**File**: `src/components/ConfettiOverlay.tsx`
**Action**: 
```typescript
// Wrapped in next/dynamic({ ssr: false })
// Listens to Zustand store `triggerConfetti` boolean
// On true: fires react-canvas-confetti burst (violet + fuchsia + white colors)
// Resets store flag after animation
```

**QA**: Complete habit → "+12 XP" toast appears → confetti fires. Earn badge → badge card appears in earned section with glow.

---

### PHASE 10: Settings

#### TASK 10.1: Settings page
**File**: `src/app/(dashboard)/settings/page.tsx`
**Action**: User preferences page.

**Sections**:
1. **Profile**: Avatar, display name (editable), email (read-only)
2. **Appearance**: Dark/Light/System toggle (next-themes). Three pill buttons.
3. **Notifications**: 
   - Toggle for notification permission
   - If not granted: "Enable Notifications" button (calls `requestToken()`)
   - If granted: "Notifications enabled ✓" + "Disable" button (revokes permission, deletes FCM token from Firestore)
   - iOS warning if applicable
4. **Timezone**: Current timezone display + change option (same Select as onboarding)
5. **Account**: "Sign Out" button (red variant)

**QA**: Changing timezone in settings → new habits use new timezone for date strings. Sign-out → FCM token deleted from Firestore → redirect to `/login`.

---

### PHASE 11: Polish + Accessibility

#### TASK 11.1: Loading states + skeletons
**Action**: Ensure every async operation has a skeleton or spinner.
- HabitCard skeleton (pulse animation matching card shape)
- Analytics page skeleton (heatmap placeholder + stat card placeholders)
- Page transitions with Framer Motion `AnimatePresence`

**QA**: Throttle CPU in DevTools → skeletons visible on all async sections.

---

#### TASK 11.2: Error boundaries + empty states
**Action**: 
- Add React ErrorBoundary around habit list and analytics sections
- Empty state for: no habits created, no completions this week, no badges earned

**QA**: Simulate Firestore permission error → error boundary shows friendly message, not blank screen.

---

#### TASK 11.3: Accessibility audit
**Action**:
- All interactive elements have `aria-label` or visible label
- Color contrast ratio ≥ 4.5:1 for all text (violet-600 on white, white on violet-600)
- Focus visible ring on all focusable elements (violet ring)
- `prefers-reduced-motion`: disable Framer Motion animations if true
- Keyboard navigation: Tab through all habit actions, Enter/Space to toggle

**QA**: `axe-core` browser extension shows 0 critical violations. Tab through entire app without mouse — all actions reachable.

---

#### TASK 11.4: Meta + SEO
**Action**:
- `src/app/layout.tsx`: Set `<title>Habbit — Premium Habit Tracker</title>`
- viewport meta: `width=device-width, initial-scale=1, viewport-fit=cover`
- apple-mobile-web-app meta tags: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style: black-translucent`
- Apple touch icon: `public/icons/apple-touch-icon.png` (180×180)

**QA**: iOS Safari "Add to Home Screen" → app icon appears, launches in standalone mode, status bar is transparent.

---

### PHASE 12: Testing

#### TASK 12.1: Unit tests
**Action**: Jest + React Testing Library.

Tests to write:
- `getTodayDateStr` with multiple timezones (including crossing midnight)
- `completeHabit` / `uncompleteHabit` Firestore operations (mock Firestore)
- `HabitForm` validation (required fields, invalid time format)
- `StreakBadge` renders correct streak number

**QA**: `npm test` passes all tests. Coverage ≥ 70% on `src/lib/utils.ts`.

---

#### TASK 12.2: E2E Playwright tests
**File**: `playwright/` directory

Tests:
1. **Auth redirect**: `GET /dashboard` unauthenticated → 302 to `/login`
2. **Login flow**: Login with email → dashboard loads with user name
3. **Habit lifecycle**: Login → create habit (fill form) → complete habit on dashboard → verify streak = 1 via Firestore admin SDK
4. **Notification gate**: Navigate to settings → enable notifications → verify permission dialog appears only after button click (not on page load)

**QA**: `npx playwright test` passes all 4 E2E tests. Run in CI (can add to GitHub Actions).

---

#### TASK 12.3: Lighthouse PWA audit
**Action**: After Vercel deployment, run:
```bash
npx lighthouse https://[your-app].vercel.app \
  --only-categories=pwa,performance,accessibility \
  --output=json | jq '{pwa: .categories.pwa.score, perf: .categories.performance.score, a11y: .categories.accessibility.score}'
```

**Acceptance Criteria**:
- PWA score ≥ 0.90
- Performance ≥ 0.75 (mobile)
- Accessibility ≥ 0.90

**QA**: All three thresholds met. Deploy gate: do not ship if PWA < 0.90.

---

### PHASE 13: Deployment

#### TASK 13.1: Vercel deployment setup
**Action**:
1. Install Vercel CLI: `npm i -g vercel`
2. `vercel login`
3. `vercel link` (creates project)
4. Set all environment variables in Vercel dashboard (all vars from `.env.local.example`)
5. `vercel --prod` to deploy

**File**: `vercel.json`
**Content**:
```json
{
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" },
        { "key": "Service-Worker-Allowed", "value": "/" }
      ]
    }
  ]
}
```

**Note**: Service worker MUST have `Cache-Control: no-cache` header so updates deploy immediately.

**QA**: Production URL accessible. `/dashboard` returns 302 for unauthenticated request. `https://[app].vercel.app/sw.js` returns JS content with `Service-Worker-Allowed: /` header.

---

#### TASK 13.2: Firebase Cloud Function deployment
**Action**:
1. `cd functions && npm install`
2. `firebase deploy --only functions`
3. Verify in Firebase Console → Functions → `onHabitCompletion` function is active

**QA**: Complete habit → Firebase Console → Functions logs show `onHabitCompletion` executed. `currentStreak` updated in Firestore.

---

#### TASK 13.3: GitHub Actions secrets setup
**Action**: In GitHub repo Settings → Secrets:
- Add `APP_URL`: production Vercel URL
- Add `CRON_SECRET`: same value as Vercel env var

**QA**: Manually trigger `cron-reminders.yml` → workflow passes → check Vercel logs for POST to `/api/cron/reminders` with 200 response.

---

## Final Verification Wave

### System Integration Test (Run After All Phases Complete)

```bash
# 1. PWA installability
npx lighthouse https://[app].vercel.app --only-categories=pwa --output=json | jq '.categories.pwa.score'
# Assert: >= 0.9

# 2. Auth middleware blocks unauthenticated requests
curl -s -o /dev/null -w "%{http_code}" https://[app].vercel.app/dashboard
# Assert: 302

# 3. Cron security gate
curl -s -o /dev/null -w "%{http_code}" -X POST https://[app].vercel.app/api/cron/reminders
# Assert: 401

# 4. Cron responds correctly with auth
curl -s -w "%{http_code}" -X POST https://[app].vercel.app/api/cron/reminders \
  -H "Authorization: Bearer {CRON_SECRET}"
# Assert: 200 with JSON body containing sent/failed counts

# 5. Service worker registered
# Chrome DevTools → Application → Service Workers: status = "activated and running"
# Assert: sw.js is registered at scope "/"

# 6. Offline check-in
# DevTools: disable network → complete a habit → re-enable → wait for sync
# Assert: completion document exists in Firestore

# 7. iOS push flow (manual device test)
# On iPhone Safari: navigate to app → install to home screen → open from home screen
# → onboarding wizard step 2 appears → enable notifications → set reminder for +2 min
# → create habit with that reminder → trigger GitHub Actions manually
# Assert: push notification received on device
```

---

## Task Execution Order

```
Phase 0 (0.1 → 0.2 → 0.3 → 0.4 → 0.5)
    ↓
Phase 1 (1.1 → 1.2 → 1.3 → 1.4 → 1.5)
    ↓
Phase 2 (2.1 → 2.2 → 2.3)
    ↓
Phase 3 (3.1 → 3.2 → 3.3)
    ↓
Phase 4 (4.1)          ← Firebase Cloud Function (can develop in parallel with Phase 5)
    ↓
Phase 5 (5.1 → 5.2 → 5.3 → 5.4)
    ↓
Phase 6 (6.1)
    ↓
Phase 7 (7.1 → 7.2 → 7.3)
    ↓
Phase 8 (8.1)
    ↓
Phase 9 (9.1)
    ↓
Phase 10 (10.1)
    ↓
Phase 11 (11.1 → 11.2 → 11.3 → 11.4)
    ↓
Phase 12 (12.1 → 12.2 → 12.3)
    ↓
Phase 13 (13.1 → 13.2 → 13.3)
    ↓
Final Verification Wave
```
