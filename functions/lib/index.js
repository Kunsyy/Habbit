"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onHabitCompletion = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const app_1 = require("firebase-admin/app");
const firestore_2 = require("firebase-admin/firestore");
(0, app_1.initializeApp)();
exports.onHabitCompletion = (0, firestore_1.onDocumentCreated)("habits/{habitId}/completions/{dateStr}", async (event) => {
    var _a;
    const { habitId, dateStr } = event.params;
    const db = (0, firestore_2.getFirestore)();
    const habitRef = db.doc(`habits/${habitId}`);
    const habitSnap = await habitRef.get();
    if (!habitSnap.exists)
        return;
    const habit = habitSnap.data();
    const userId = habit.userId;
    // 1. Calculate streak
    // For cloud function, we need a simple date math. 
    // The previous date string in YYYY-MM-DD:
    const d = new Date(dateStr);
    d.setUTCDate(d.getUTCDate() - 1);
    const yesterday = d.toISOString().split('T')[0]; // Simplification, timezone might make this tricky if dateStr is local, but dateStr is already formatted. If dateStr is "2026-02-27", yesterday is "2026-02-26". We can just parse and subtract 1 day.
    const yesterdayCompletion = await habitRef.collection("completions").doc(yesterday).get();
    const newStreak = yesterdayCompletion.exists ? (habit.currentStreak || 0) + 1 : 1;
    const newLongest = Math.max(newStreak, habit.longestStreak || 0);
    const newTotal = (habit.totalCompletions || 0) + 1;
    // 2. Update habit doc
    await habitRef.update({
        currentStreak: newStreak,
        longestStreak: newLongest,
        totalCompletions: newTotal,
    });
    // 3. Award XP (base 10 + streak bonus)
    const xpEarned = 10 + Math.min(newStreak, 10); // max 20 XP per completion
    const userRef = db.doc(`users/${userId}`);
    await userRef.update({ xp: firestore_2.FieldValue.increment(xpEarned) });
    // 4. Recalculate level (every 100 XP = 1 level)
    const userSnap = await userRef.get();
    const newXp = ((_a = userSnap.data()) === null || _a === void 0 ? void 0 : _a.xp) || 0;
    const newLevel = Math.floor(newXp / 100) + 1;
    await userRef.update({ level: newLevel });
    // 5. Check badges (forward-looking, streak-based)
    await checkAndGrantBadges(db, userId, habitId, newStreak, newTotal);
});
async function checkAndGrantBadges(db, userId, habitId, streak, totalCompletions) {
    const badgesToCheck = [
        { id: "first-step", condition: totalCompletions >= 1 },
        { id: "week-warrior", condition: streak >= 7 },
        { id: "fortnight-flame", condition: streak >= 14 },
        { id: "monthly-master", condition: streak >= 30 },
        { id: "dedicated", condition: totalCompletions >= 50 },
        { id: "century", condition: totalCompletions >= 100 },
    ];
    for (const { id, condition } of badgesToCheck) {
        if (!condition)
            continue;
        const badgeRef = db.doc(`users/${userId}/earnedBadges/${id}`);
        const existing = await badgeRef.get();
        if (!existing.exists) {
            // Create if doesn't exist
            await badgeRef.set({ earnedAt: firestore_2.FieldValue.serverTimestamp(), habitId });
        }
    }
}
//# sourceMappingURL=index.js.map