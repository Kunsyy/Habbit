import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminMessaging } from "@/lib/firebase/admin";

export async function POST(request: NextRequest) {
  // 1. Verify CRON_SECRET header
  const auth = request.headers.get("Authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Fetch ALL habits where reminderEnabled == true
    const habitsSnap = await adminDb
      .collectionGroup("habits")
      .where("reminderEnabled", "==", true)
      .get();

    if (habitsSnap.empty) {
      return NextResponse.json({ success: true, count: 0 });
    }

    const now = new Date();
    const userCache = new Map<string, { timezone: string; fcmTokens: string[] }>();
    const notifications: { token: string; habit: { id: string; name: string; emoji: string } }[] = [];

    for (const habitDoc of habitsSnap.docs) {
      const habitData = habitDoc.data();
      const habitId = habitDoc.id;
      const userRef = habitDoc.ref.parent.parent;
      if (!userRef) continue;
      const userId = userRef.id;

      let userData = userCache.get(userId);
      if (!userData) {
        const userSnap = await userRef.get();
        if (!userSnap.exists) continue;
        const data = userSnap.data();
        userData = {
          timezone: data?.timezone || "UTC",
          fcmTokens: data?.fcmTokens || [],
        };
        userCache.set(userId, userData);
      }

      // Calculate local time HH:mm using Intl
      const localTime = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: userData.timezone,
      }).format(now);

      if (localTime === habitData.reminderTime) {
        userData.fcmTokens.forEach((token) => {
          notifications.push({
            token,
            habit: {
              id: habitId,
              name: habitData.name,
              emoji: habitData.emoji,
            },
          });
        });
      }
    }

    if (notifications.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    // 3. Send multicast data-only messages
    // Grouping into chunks of 500 for Firebase multicast
    const chunks = [];
    for (let i = 0; i < notifications.length; i += 500) {
      chunks.push(notifications.slice(i, i + 500));
    }

    for (const chunk of chunks) {
      const tokens = chunk.map((n) => n.token);
      // Since data-only messages for all notifications in a chunk might have different habit info,
      // and sendMulticast uses a single message template, we should use sendEach if they are different.
      // However, sendEach is preferred for varied content.
      const messages = chunk.map((n) => ({
        token: n.token,
        data: {
          habitId: n.habit.id,
          habitName: n.habit.name,
          emoji: n.habit.emoji,
          type: "reminder",
        },
      }));

      const response = await adminMessaging.sendEach(messages);
      
      // 4. Handle stale tokens
      const tokensToRemove: string[] = [];
      response.responses.forEach((res, idx) => {
        if (!res.success && res.error) {
          const code = res.error.code;
          if (
            code === "messaging/registration-token-not-registered" ||
            code === "messaging/invalid-registration-token"
          ) {
            tokensToRemove.push(tokens[idx]);
          }
        }
      });

      if (tokensToRemove.length > 0) {
        // Find users with these tokens and remove them
        for (const [userId, userData] of userCache.entries()) {
          const updatedTokens = userData.fcmTokens.filter(t => !tokensToRemove.includes(t));
          if (updatedTokens.length !== userData.fcmTokens.length) {
            await adminDb.collection("users").doc(userId).update({
              fcmTokens: updatedTokens
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true, count: notifications.length });
  } catch (error) {
    console.error("Reminder cron error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
