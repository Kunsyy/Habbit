import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAuth } from 'next-firebase-auth-edge/lib/auth';
import { serverConfig } from '@/lib/auth-edge';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const idToken = authHeader.split('Bearer ')[1];

  try {
    const { verifyIdToken, createSessionCookie } = getFirebaseAuth(
      serverConfig.serviceAccount,
      serverConfig.apiKey
    );

    await verifyIdToken(idToken);
    const sessionCookie = await createSessionCookie(idToken, serverConfig.cookieSerializeOptions.maxAge! * 1000);

    const response = NextResponse.json({ success: true });
    response.cookies.set(
      serverConfig.cookieName!,
      sessionCookie,
      serverConfig.cookieSerializeOptions
    );
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
