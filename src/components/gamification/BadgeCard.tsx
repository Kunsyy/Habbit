"use client";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export interface BadgeData {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode | string;
}

interface BadgeCardProps {
  badge: BadgeData;
  isLocked?: boolean;
}

export function BadgeCard({ badge, isLocked = false }: BadgeCardProps) {
  return (
    <motion.div
      whileHover={!isLocked ? { y: -4, scale: 1.02 } : undefined}
      className={cn(
        "relative group flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-300 overflow-hidden text-center h-full",
        isLocked 
          ? "bg-muted/30 border-border/50 grayscale opacity-60"
          : "bg-background border-violet-500/30 shadow-[0_0_15px_-5px_rgba(139,92,246,0.15)] hover:shadow-[0_0_25px_-5px_rgba(139,92,246,0.4)]"
      )}
    >
      {/* Glow Effect for Earned Badges */}
      {!isLocked && (
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-violet-500/5 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
      )}

      {/* Icon Container */}
      <div className="relative mb-5 mt-2">
        <div 
          className={cn(
            "flex items-center justify-center w-16 h-16 rounded-full text-3xl z-10 relative transition-transform duration-500",
            isLocked ? "bg-muted text-muted-foreground" : "bg-violet-500/10 text-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.5)] group-hover:shadow-[0_0_25px_rgba(139,92,246,0.7)]"
          )}
        >
          {badge.icon}
        </div>
        
        {isLocked && (
          <div className="absolute -bottom-2 -right-2 bg-background border border-border/50 rounded-full p-1.5 z-20 shadow-sm">
            <Lock className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
      </div>

      <h3 className={cn("font-semibold mb-2 tracking-tight", isLocked ? "text-muted-foreground" : "text-foreground")}>
        {badge.name}
      </h3>
      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
        {badge.description}
      </p>
    </motion.div>
  );
}
