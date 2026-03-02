import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getMessaging, Messaging } from "firebase-admin/messaging";

function getAdminApp(): App {
  return (
    getApps().find((a) => a.name === "admin") ??
    initializeApp(
      {
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID!,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
          privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(
            /\\n/g,
            "\n"
          ),
        }),
      },
      "admin"
    )
  );
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}

export function getAdminMessaging(): Messaging {
  return getMessaging(getAdminApp());
}

// Backward-compatible lazy proxies
export const adminDb = new Proxy({} as Firestore, {
  get(_target, prop) {
    return (getAdminDb() as any)[prop];
  },
});

export const adminMessaging = new Proxy({} as Messaging, {
  get(_target, prop) {
    return (getAdminMessaging() as any)[prop];
  },
});
