import { NextResponse } from 'next/server';
import { serverConfig } from '@/lib/auth-edge';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(serverConfig.cookieName!, '', {
    ...serverConfig.cookieSerializeOptions,
    maxAge: 0,
  });
  return response;
}
