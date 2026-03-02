import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { adminDb } from "../src/lib/firebase/admin";

const badges = [
  {
    id: "first-step",
    name: "First Step",
    icon: "🎯",
    description: "Complete your first habit",
    requirement: { type: "totalCompletions", value: 1 },
    xp: 50,
  },
  {
    id: "week-warrior",
    name: "Week Warrior",
    icon: "🔥",
    description: "7-day streak",
    requirement: { type: "streak", value: 7 },
    xp: 100,
  },
  {
    id: "fortnight-flame",
    name: "Fortnight Flame",
    icon: "⚡",
    description: "14-day streak",
    requirement: { type: "streak", value: 14 },
    xp: 200,
  },
  {
    id: "monthly-master",
    name: "Monthly Master",
    icon: "👑",
    description: "30-day streak",
    requirement: { type: "streak", value: 30 },
    xp: 500,
  },
  {
    id: "century",
    name: "Century",
    icon: "💯",
    description: "100 total completions",
    requirement: { type: "totalCompletions", value: 100 },
    xp: 300,
  },
  {
    id: "habit-builder",
    name: "Habit Builder",
    icon: "🏗️",
    description: "Create 5 habits",
    requirement: { type: "habits_created", value: 5 },
    xp: 150,
  },
  {
    id: "dedicated",
    name: "Dedicated",
    icon: "💪",
    description: "50 total completions",
    requirement: { type: "totalCompletions", value: 50 },
    xp: 150,
  },
  {
    id: "perfectionist",
    name: "Perfectionist",
    icon: "✨",
    description: "Complete all habits in a day 5 times",
    requirement: { type: "custom", value: 5, key: "all_completed_days" },
    xp: 250,
  },
];

async function seedBadges() {
  console.log("Starting badge seeding...");
  const batch = adminDb.batch();

  badges.forEach((badge) => {
    const badgeRef = adminDb.collection("badges").doc(badge.id);
    batch.set(badgeRef, {
      ...badge,
      updatedAt: new Date(),
    }, { merge: true });
  });

  try {
    await batch.commit();
    console.log("Successfully seeded 8 badges.");
  } catch (error) {
    console.error("Error seeding badges:", error);
  }
}

// Run: npx tsx -r dotenv/config scripts/seed-badges.ts
seedBadges();
