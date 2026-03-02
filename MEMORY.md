# MEMORY.md — Habit Tracker App (HabbitApp)

> Dibuat: 2026-02-28. Last update: 2026-03-02.

---

## 1. STATUS PROYEK

Semua **code sudah selesai ditulis dan build 100% sukses** (57 TSX + 20 TS files). Tinggal **setup infrastruktur** dan **deploy**.
Hanya 1 commit di git: `chore: add habit tracker plan` — code belum di-commit.

**Apa aja yang udah beres (dari session sebelumnya):**
1. **Core Setup & UI** — Tailwind violet (#7C3AED), shadcn/ui, dark/light mode (next-themes), animasi Framer Motion, confetti gamifikasi
2. **PWA & Offline** — Serwist service worker, manifest PWA, Firestore offline IndexedDB (tetap bisa check-in tanpa sinyal)
3. **Auth (SSR-safe)** — next-firebase-auth-edge: middleware verifikasi sesi via httpOnly cookie, isolasi data per-user
4. **Cloud Function** — `functions/src/index.ts`: otomatis hitung streak (anti-cheat), update XP, naik level, unlock badges di Firestore
5. **Dashboard & Habit CRUD** — BottomNav (mobile) / Sidebar (desktop), gamification bar, glow streak, modal create/edit, color picker, emoji picker
6. **Push Notifications** — firebase-admin/messaging, FCM token per device (useFCM), API route `/api/cron/reminders` buat GitHub Actions cron
7. **Analytics** — kalender heatmap 365 hari (react-activity-calendar), persentase completion, streak terpanjang
8. **Onboarding Wizard** — 3-step: timezone, izin notifikasi, panduan install PWA (iOS Safari)

**Bug yang udah di-fix (session sebelumnya):**
- ✅ Error SSR Turbopack `next/dynamic` di `layout.tsx`
- ✅ `"use client"` ditambah di komponen yang pakai framer-motion
- ✅ Dummy credentials Firebase Admin agar build Vercel (SSG) tidak error saat `project_id` kosong
- ✅ `bun run build` sukses 100% — zero TS error, zero Next.js error

**Stack:**
- Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui (violet theme)
- Firebase Auth (Google + Email) via next-firebase-auth-edge (cookie-based SSR)
- Firestore (real-time onSnapshot + offline) + Firebase Cloud Messaging (FCM push notifications)
- GitHub Actions (hourly cron → POST /api/cron/reminders)
- Serwist PWA (service worker)
- Gamification: XP, level, streak, 8 badges, confetti
- Cloud Functions (streak/XP/badges trigger on completion create)
---

## 2. YANG HARUS LO KERJAIN BESOK (URUTAN)

### STEP 1 — Buat Firebase Project & Dapat Keys

1. Buka https://console.firebase.google.com
2. Buat project baru (atau pakai yang ada)
3. **Authentication** → Sign-in methods → Enable **Google** dan **Email/Password**
4. **Firestore Database** → Create database → Production mode
5. **Project Settings** → Web app (klik `</>`) → Register app → Salin `firebaseConfig`:
   ```
   apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId
   ```
6. **Project Settings** → Service accounts → **Generate new private key** → Download JSON
   - Dari JSON ini ambil: `project_id`, `client_email`, `private_key`
7. **Project Settings** → Cloud Messaging → Web Push Certificates → Generate key pair → Salin **VAPID key**

---

### STEP 2 — Buat File `.env.local`

Buat file `F:\Habbit\.env.local` (jangan di-commit!), isi:

```env
# Firebase Client (public)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=

# Firebase Admin (server-only — dari service account JSON)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
# ⚠️ PENTING: private_key dari JSON harus dalam double-quotes, newline tetap \n (bukan literal newline)

# Cron Security
CRON_SECRET=           # Generate: openssl rand -hex 16  (atau random 32 chars)

# Cookie Auth (next-firebase-auth-edge)
AUTH_COOKIE_NAME=AuthToken
AUTH_COOKIE_SIGNATURE_KEYS=["randomstring1","randomstring2"]
# Generate keys: openssl rand -hex 32  (buat 2 string berbeda)
```

---

### STEP 3 — Deploy Firestore Rules & Indexes

```bash
# Install Firebase CLI jika belum ada
npm install -g firebase-tools

# Login
firebase login

# Set project
firebase use <project-id>

# Deploy rules + indexes
firebase deploy --only firestore:rules,firestore:indexes
```

File sudah ada di repo:
- `firestore.rules`
- `firestore.indexes.json`
- `firebase.json`

---

### STEP 4 — Seed Badges ke Firestore

Jalankan script seed badges (cek apakah ada di `scripts/` atau perlu buat manual).  
8 badges yang harus ada di collection `badges`:

| id | name | emoji | condition.type | condition.threshold | xpReward |
|---|---|---|---|---|---|
| first-step | First Step | 🎯 | totalCompletions | 1 | 50 |
| week-warrior | Week Warrior | 🔥 | streak | 7 | 100 |
| fortnight-flame | Fortnight Flame | ⚡ | streak | 14 | 200 |
| monthly-master | Monthly Master | 👑 | streak | 30 | 500 |
| century | Century | 💯 | totalCompletions | 100 | 300 |
| habit-builder | Habit Builder | 🏗️ | habits_created | 5 | 150 |
| dedicated | Dedicated | 💪 | totalCompletions | 50 | 150 |
| perfectionist | Perfectionist | ✨ | perfect_days | 5 | 250 |

**Cara seed via Firestore Console** (paling gampang):
- Buka Firestore Console → collection `badges` → Add document untuk masing-masing badge di atas

---

### STEP 5 — Deploy Cloud Functions

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

Cloud Function: `onHabitCompletion` — trigger saat completion dibuat, hitung streak + XP + badges.  
File ada di: `functions/src/index.ts` (sudah selesai ditulis).

---

### STEP 6 — Deploy ke Vercel

```bash
# Install Vercel CLI jika belum
npm install -g vercel

# Deploy
vercel

# Set semua env vars di Vercel Dashboard atau via CLI:
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
# ... (semua vars dari .env.local)
```

**Atau via Vercel Dashboard:**
1. Buka https://vercel.com → New Project → Import repo
2. Add Environment Variables (sama persis dengan `.env.local`)
3. Deploy

**⚠️ Setelah deploy, catat URL production-nya** (contoh: `https://habbit.vercel.app`)

---

### STEP 7 — Set GitHub Actions Secrets

Buka GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Tambahkan 2 secrets:

| Secret Name | Value |
|---|---|
| `APP_URL` | URL Vercel production lo (contoh: `https://habbit.vercel.app`) |
| `CRON_SECRET` | Sama persis dengan `CRON_SECRET` di `.env.local` |

Workflow sudah ada di `.github/workflows/cron-reminders.yml` — berjalan setiap jam, POST ke `/api/cron/reminders`.

---

### STEP 8 — Test & Verifikasi

1. **Buka app** → Login (Google atau Email)
2. **Onboarding wizard** muncul → set timezone, notifikasi, install PWA
3. **Buat habit** → centang → lihat XP naik & streak update
4. **Test notifikasi**: Set reminderTime ke 1-2 menit dari sekarang, tunggu cron trigger (atau test manual: `curl -X POST https://your-app.vercel.app/api/cron/reminders -H "Authorization: Bearer YOUR_CRON_SECRET"`)
5. **GitHub Actions** → Tab Actions di repo → Cek workflow berjalan setiap jam

---

## 3. FILE PENTING YANG PERLU LO TAU

```
F:\Habbit\
├── .env.local.example          ← Template env vars
├── .env.local                  ← BUAT INI (jangan commit!)
├── firebase.json               ← Firebase config (rules, functions, hosting)
├── firestore.rules             ← Security rules
├── firestore.indexes.json      ← Firestore indexes
├── functions/src/index.ts      ← Cloud Function (streak/XP/badges) — SUDAH JADI
├── .github/workflows/
│   └── cron-reminders.yml      ← GitHub Actions hourly cron — SUDAH JADI
├── src/
│   ├── lib/firebase/
│   │   ├── config.ts           ← Firebase client init
│   │   ├── admin.ts            ← Firebase Admin SDK (server-side)
│   │   └── auth-edge.ts        ← Cookie auth untuk middleware
│   ├── app/api/
│   │   ├── auth/route.ts       ← Set auth cookie
│   │   ├── auth/refresh/route.ts ← Refresh token setiap 50 menit
│   │   ├── cron/reminders/route.ts ← Endpoint cron GitHub Actions
│   │   └── fcm/token/route.ts  ← Save FCM token ke Firestore
│   └── app/sw.ts               ← Service worker (PWA + push notifications)
```

---

## 4. POTENTIAL MASALAH & SOLUSINYA

| Masalah | Kemungkinan Penyebab | Solusi |
|---|---|---|
| Firebase Auth error | Keys salah di .env.local | Cek NEXT_PUBLIC_FIREBASE_* |
| Admin SDK error | private_key format salah | Pastikan double-quotes & \n bukan literal newline |
| Cron tidak jalan | Secrets GitHub belum diset | Cek Settings → Secrets di repo |
| Push notification tidak muncul | VAPID key salah / FCM belum diaktifkan | Cek Firebase Console → Cloud Messaging |
| Streak tidak update | Cloud Function belum deploy | `firebase deploy --only functions` |
| Badges tidak muncul | Collection `badges` kosong | Seed manual via Firestore Console |
| Cookie auth error | AUTH_COOKIE_SIGNATURE_KEYS format salah | Harus JSON array string: `["key1","key2"]` |

---

## 5. CHECKLIST PROGRESS

- [x] Buat Firebase Project & dapat semua keys — ✅ DONE
- [x] Buat `.env.local` dengan semua vars — ✅ DONE
- [x] `npm install` di root — ✅ DONE (pakai `--legacy-peer-deps` karena @emoji-mart/react belum support React 19)
- [x] `firebase deploy --only firestore:rules,firestore:indexes` — ✅ DONE
- [x] Seed 8 badges ke Firestore — ✅ DONE (via `npx tsx scripts/seed-badges.ts`)
- [ ] `firebase deploy --only functions` — ❌ STUCK
  - ❌ Kendala: Project harus upgrade ke **Blaze (pay-as-you-go)** plan dulu
  - 📌 Next action: Buka https://console.firebase.google.com/project/habbit-tracker1/usage/details → klik Upgrade → masukkin kartu kredit/debit → setelah berhasil jalankan `firebase deploy --only functions`
  - ⚠️ Blaze plan aman — free tier sama kayak Spark, cuma kena charge kalau exceed limit (habit tracker pribadi hampir pasti ga akan kena charge)
- [ ] Deploy ke Vercel + set env vars
- [ ] Set GitHub Secrets: `APP_URL` + `CRON_SECRET`
- [ ] Test login, buat habit, centang habit
- [ ] Test push notification
- [ ] Commit semua code yang belum di-commit

---

## 6. CATATAN PENTING (JANGAN DILANGGAR)

1. **JANGAN** pakai `FieldValue.increment()` dari client untuk streak — harus lewat Cloud Function
2. **JANGAN** minta `Notification.requestPermission()` saat halaman load — hanya saat user klik tombol
3. **JANGAN** biarkan Serwist cache `firestore.googleapis.com` atau `*.firebaseio.com`
4. **JANGAN** pakai `notification` object di FCM payload — data-only, service worker yang construct notifikasi
5. **JANGAN** configure firebase-admin di Edge Runtime — hanya Node.js runtime
6. **JANGAN** hitung tanggal pakai UTC untuk habit completion — pakai IANA timezone user yang tersimpan
7. `FIREBASE_PRIVATE_KEY` di Vercel/env: harus wrap dengan quotes dan `\n` harus jadi real newline atau tetap `\n` tergantung OS
