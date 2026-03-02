import { NextRequest, NextResponse } from "next/server";
import { getTokens } from "next-firebase-auth-edge";
import { serverConfig } from "@/lib/auth-edge";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

const BADGES = [
  { id: "first-step", check: (_streak: number, total: number) => total >= 1 },
  { id: "week-warrior", check: (streak: number) => streak >= 7 },
  { id: "fortnight-flame", check: (streak: number) => streak >= 14 },
  { id: "monthly-master", check: (streak: number) => streak >= 30 },
  { id: "dedicated", check: (_streak: number, total: number) => total >= 50 },
  { id: "century", check: (_streak: number, total: number) => total >= 100 },
];

export async function POST(request: NextRequest) {
  const tokens = await getTokens(request.cookies, serverConfig);

  if (!tokens) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = tokens.decodedToken.uid;

  try {
    const { habitId, dateStr } = await request.json();

    if (!habitId || !dateStr) {
      return NextResponse.json(
        { error: "habitId and dateStr are required" },
        { status: 400 }
      );
    }

    const habitRef = adminDb.collection("habits").doc(habitId);
    const habitSnap = await habitRef.get();

    if (!habitSnap.exists) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    const habit = habitSnap.data()!;

    // Security: ensure habit belongs to the requesting user
    if (habit.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if already completed today
    const completionRef = habitRef.collection("completions").doc(dateStr);
    const completionSnap = await completionRef.get();
    if (completionSnap.exists) {
      return NextResponse.json(
        { error: "Already completed today" },
        { status: 409 }
      );
    }

    // Check yesterday's completion for streak continuity
    const yesterday = new Date(dateStr);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    const yesterdaySnap = await habitRef
      .collection("completions")
      .doc(yesterdayStr)
      .get();

    const currentStreak: number = habit.currentStreak ?? 0;
    const longestStreak: number = habit.longestStreak ?? 0;
    const totalCompletions: number = habit.totalCompletions ?? 0;

    const newStreak = yesterdaySnap.exists ? currentStreak + 1 : 1;
    const newLongest = Math.max(newStreak, longestStreak);
    const newTotal = totalCompletions + 1;

    // Write completion doc
    await completionRef.set({ completedAt: FieldValue.serverTimestamp() });

    // Update habit stats
    await habitRef.update({
      currentStreak: newStreak,
      longestStreak: newLongest,
      totalCompletions: newTotal,
    });

    // Update user XP & level
    const xpEarned = 10 + Math.min(newStreak, 10);
    const userRef = adminDb.collection("users").doc(userId);
    const userSnap = await userRef.get();
    const currentXp: number = (userSnap.data()?.xp ?? 0) + xpEarned;
    const newLevel = Math.floor(currentXp / 100) + 1;

    await userRef.update({
      xp: FieldValue.increment(xpEarned),
      level: newLevel,
    });

    // Check & grant badges
    const earnedBadgesSnap = await userRef.collection("earnedBadges").get();
    const existingBadgeIds = new Set(earnedBadgesSnap.docs.map((d) => d.id));

    const newBadges: string[] = [];
    for (const badge of BADGES) {
      if (
        !existingBadgeIds.has(badge.id) &&
        badge.check(newStreak, newTotal)
      ) {
        await userRef.collection("earnedBadges").doc(badge.id).set({
          earnedAt: FieldValue.serverTimestamp(),
          habitId,
        });
        newBadges.push(badge.id);
      }
    }

    return NextResponse.json({
      success: true,
      streak: newStreak,
      longestStreak: newLongest,
      totalCompletions: newTotal,
      xpEarned,
      newLevel,
      newBadges,
    });
  } catch (error) {
    console.error("Error completing habit:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
