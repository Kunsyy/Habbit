"use client";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StreakBadgeProps {
  streak: number;
  className?: string;
}

export function StreakBadge({ streak, className }: StreakBadgeProps) {
  if (streak === 0) return null;

  const isHot = streak > 7;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold",
        isHot 
          ? "bg-orange-500/15 text-orange-600 dark:text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)] ring-1 ring-orange-500/30"
          : "bg-muted text-muted-foreground",
        className
      )}
    >
      <Flame 
        className={cn(
          "w-3 h-3", 
          isHot ? "fill-orange-500 text-orange-500 animate-pulse" : ""
        )} 
      />
      <span>{streak}</span>
    </motion.div>
  );
}
