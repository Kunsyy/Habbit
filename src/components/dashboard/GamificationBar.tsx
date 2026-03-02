"use client";
import { UserProfile } from "@/types/user";
import { motion } from "framer-motion";

interface GamificationBarProps {
  profile: UserProfile | null;
}

export function GamificationBar({ profile }: GamificationBarProps) {
  if (!profile) return null;

  // Simple leveling formula: Level N requires N * 100 XP
  // Current level base XP: (N-1) * 100
  // Next level XP: N * 100
  const currentLevel = profile.level;
  const xpForNextLevel = currentLevel * 100;
  const currentLevelBaseXP = (currentLevel - 1) * 100;
  const xpInCurrentLevel = Math.max(0, profile.xp - currentLevelBaseXP);
  const xpNeeded = xpForNextLevel - currentLevelBaseXP;
  
  const percentage = Math.min(100, Math.round((xpInCurrentLevel / xpNeeded) * 100)) || 0;

  return (
    <div className="flex flex-col gap-2 p-4 bg-muted/40 rounded-2xl border">
      <div className="flex justify-between items-center text-sm font-semibold">
        <span className="text-primary tracking-wide">Level {currentLevel}</span>
        <span className="text-muted-foreground">{xpForNextLevel - profile.xp} XP to Level {currentLevel + 1}</span>
      </div>
      <div className="h-4 w-full bg-card border rounded-full overflow-hidden shadow-inner">
        <motion.div
          className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, type: "spring", bounce: 0.2 }}
        />
      </div>
    </div>
  );
}
