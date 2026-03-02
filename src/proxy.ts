import { authMiddleware, redirectToLogin } from "next-firebase-auth-edge";
import { NextRequest, NextResponse } from "next/server";
import { serverConfig } from "@/lib/auth-edge";

export async function proxy(request: NextRequest) {
  return authMiddleware(request, {
    loginPath: "/api/auth/login",
    logoutPath: "/api/auth/logout",
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    cookieName: serverConfig.cookieName,
    cookieSignatureKeys: serverConfig.cookieSignatureKeys,
    cookieSerializeOptions: serverConfig.cookieSerializeOptions,
    serviceAccount: serverConfig.serviceAccount,
    handleValidToken: async ({ token }, headers) => NextResponse.next({ request: { headers } }),
    handleInvalidToken: async (reason) => redirectToLogin(request, { path: "/login", publicPaths: ["/login", "/register", "/"] }),
    handleError: async (error) => redirectToLogin(request, { path: "/login", publicPaths: ["/login", "/register", "/"] }),
  });
  }


export const config = {
  matcher: ["/", "/habits/:path*", "/analytics/:path*", "/settings/:path*", "/api/auth/login", "/api/auth/logout"],
};
