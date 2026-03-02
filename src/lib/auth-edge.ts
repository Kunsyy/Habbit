export const serverConfig = {
  cookieName: process.env.AUTH_COOKIE_NAME!,
  cookieSignatureKeys: process.env.AUTH_COOKIE_SIGNATURE_KEYS ? JSON.parse(process.env.AUTH_COOKIE_SIGNATURE_KEYS) : [],
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
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
};
