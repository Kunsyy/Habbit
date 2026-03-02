# Habbit App — Memory & Progress

## Status: ✅ DEPLOYED & LIVE

**Production URL:** https://habbit-navy.vercel.app
**GitHub Repo:** https://github.com/Kunsyy/Habbit

---

## Stack
Next.js 16.1.6 + TypeScript + Tailwind v4 + shadcn/ui + Firebase (Auth, Firestore, FCM) + Serwist PWA + Vercel Cron + GitHub Actions

---

## Progress Checklist

| Step | Status |
|------|--------|
| Firebase Project & keys | ✅ DONE |
| `.env.local` dibuat | ✅ DONE |
| `npm install` | ✅ DONE |
| Firestore rules & indexes deploy | ✅ DONE |
| Seed 8 badges | ✅ DONE |
| Deploy Cloud Functions | ❌ SKIP — diganti Vercel Cron (Firebase Blaze gagal upgrade, umur < 21 tidak bisa Jenius, Blu ditolak) |
| GitHub repo dibuat | ✅ DONE — https://github.com/Kunsyy/Habbit |
| Deploy ke Vercel | ✅ DONE — https://habbit-navy.vercel.app |
| Set env vars di Vercel | ✅ DONE |
| Verifikasi deployment | ✅ DONE — build sukses, semua routes live |

---

## Keputusan Arsitektur: No Firebase Blaze

Firebase Blaze plan gagal diupgrade (kartu Blu & Jenius ditolak). Solusi:
- **Cloud Functions (scheduled)** → diganti **Vercel Cron Jobs**
- **Cloud Functions (trigger)** → diganti **Next.js API Route** (`/api/habits/complete`)
- FCM tetap dipakai untuk delivery push notification (tidak butuh Blaze)

---

## Perubahan Code yang Dilakukan

### 1. Fix FCM Token — `src/app/api/fcm/token/route.ts`
- **Bug**: Token disimpan ke subcollection `users/{uid}/fcmTokens/{token}` tapi cron baca dari array field `users/{uid}.fcmTokens`
- **Fix**: Ubah ke `FieldValue.arrayUnion/arrayRemove` pada field `fcmTokens` di user doc

### 2. API Route Baru — `src/app/api/habits/complete/route.ts`
- Menggantikan `functions/src/index.ts` (Firebase Cloud Function trigger)
- `POST /api/habits/complete` dengan body `{habitId, dateStr}`
- Logic: hitung streak, longest streak, total completions, XP (10 + min(streak,10)), level (floor(xp/100)+1)
- Award badges: first-step, week-warrior, fortnight-flame, monthly-master, dedicated, century
- Keamanan: verifikasi `habit.userId === userId` dari auth token

### 3. HabitCard Update — `src/components/habits/HabitCard.tsx`
- Saat mark complete: panggil `POST /api/habits/complete` (bukan langsung Firestore)
- Saat un-complete: tetap pakai `uncompleteHabit` langsung

### 4. Vercel Cron — `vercel.json`
- Cron: `POST /api/cron/reminders` schedule `0 8 * * *` (jam 8 UTC = 3 sore WIB)
- Vercel Hobby plan hanya support 1 cron per hari minimum interval
- `cron/reminders/route.ts` sudah lengkap sebelumnya (auth via CRON_SECRET Bearer token)

### 5. Config Fixes
- `.npmrc`: `legacy-peer-deps=true` (emoji-mart belum support React 19)
- `tsconfig.json`: exclude `functions/` folder agar tidak di-compile Next.js
- `.gitignore`: whitelist `vercel.json`, `package.json`, `tsconfig.json`, dll dari rule `*.json`

---

## Environment Variables di Vercel (semua sudah di-set)

| Key | Keterangan |
|-----|-----------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase client config |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | habbit-tracker1.firebaseapp.com |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | habbit-tracker1 |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | habbit-tracker1.firebasestorage.app |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | 9486270162 |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | FCM VAPID key untuk push notif |
| `FIREBASE_PROJECT_ID` | habbit-tracker1 |
| `FIREBASE_CLIENT_EMAIL` | firebase-adminsdk service account |
| `FIREBASE_PRIVATE_KEY` | Service account private key |
| `AUTH_COOKIE_NAME` | AuthToken |
| `AUTH_COOKIE_SIGNATURE_KEYS` | Cookie signing keys (JSON array) |
| `CRON_SECRET` | 8128a1380f6b776af30cbcfe428c2c1956b19c82d78bf7fbb1c61b2302a6cc9a |

---

## Struktur API Routes Final

| Route | Method | Fungsi |
|-------|--------|--------|
| `/api/auth/logout` | POST | Logout user |
| `/api/auth/refresh` | POST | Refresh auth token |
| `/api/cron/reminders` | POST | Kirim push notif reminder (dipanggil Vercel Cron jam 8 UTC) |
| `/api/fcm/token` | POST/DELETE | Simpan/hapus FCM token user |
| `/api/habits/complete` | POST | Complete habit + hitung streak/XP/badge |

---

## Vercel Dashboard
- Project: https://vercel.com/kunsyys-projects/habbit
- Cron Jobs: Settings → Cron Jobs → `/api/cron/reminders` (0 8 * * *)
- Logs: Functions tab untuk debug

---

## Hal yang Bisa Ditingkatkan (Future)
- Upgrade Firebase ke Blaze kalau sudah punya kartu yang support → enable Cloud Functions untuk per-user scheduled reminders (saat ini cron daily jam tetap)
- NEXTAUTH_URL env var belum di-set di Vercel (set ke https://habbit-navy.vercel.app jika ada issue auth)
- Test push notification end-to-end setelah login
