"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { subscribeToUserProfile } from "@/lib/firestore/users";

export function XPToast() {
  const { user } = useAuth();
  const prevXPRef = useRef<number | null>(null);
  const prevLevelRef = useRef<number | null>(null);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToUserProfile(user.uid, (profile) => {
      const currentXP = profile.xp || 0;
      const currentLevel = profile.level || 1;
      
      // Handle XP Toast
      if (prevXPRef.current !== null && currentXP > prevXPRef.current) {
        const earnedXP = currentXP - prevXPRef.current;
        toast(`+${earnedXP} XP Earned!`, {
          description: "You're making great progress.",
          icon: "⚡",
          className: "border-violet-500/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        });
      }

      // Handle Level Up Toast
      if (prevLevelRef.current !== null && currentLevel > prevLevelRef.current) {
        toast(`Level Up!`, {
          description: `You are now Level ${currentLevel}!`,
          icon: "🎉",
          className: "border-violet-500 bg-violet-500/10 text-violet-500",
        });
      }

      prevXPRef.current = currentXP;
      prevLevelRef.current = currentLevel;
    });

    return () => unsubscribe();
  }, [user]);

  return null;
}
