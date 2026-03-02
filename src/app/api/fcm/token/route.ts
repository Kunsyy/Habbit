import { NextRequest, NextResponse } from "next/server";
import { getTokens } from "next-firebase-auth-edge";
import { serverConfig } from "@/lib/auth-edge";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  const tokens = await getTokens(request.cookies, serverConfig);

  if (!tokens) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const userId = tokens.decodedToken.uid;
    await adminDb.collection("users").doc(userId).update({
      fcmTokens: FieldValue.arrayUnion(token),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving FCM token:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const tokens = await getTokens(request.cookies, serverConfig);

  if (!tokens) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const userId = tokens.decodedToken.uid;
    await adminDb.collection("users").doc(userId).update({
      fcmTokens: FieldValue.arrayRemove(token),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting FCM token:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
