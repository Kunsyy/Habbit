"use client";
import { UserProfile } from "@/types/user";
import { motion } from "framer-motion";
import { Award } from "lucide-react";

interface DashboardHeaderProps {
  profile: UserProfile | null;
}

export function DashboardHeader({ profile }: DashboardHeaderProps) {
  const name = profile?.displayName?.split(" ")[0] || "Friend";
  const today = new Date();
  
  // Custom greeting based on hour
  const hour = today.getHours();
  let greeting = "Good evening";
  if (hour < 12) greeting = "Good morning";
  else if (hour < 18) greeting = "Good afternoon";

  const dateStr = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(today);

  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-end justify-between py-6">
      <div className="flex flex-col gap-1">
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-medium text-muted-foreground uppercase tracking-widest"
        >
          {dateStr}
        </motion.p>
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl md:text-4xl font-extrabold tracking-tight"
        >
          {greeting}, <span className="text-primary">{name}</span> 👋
        </motion.h1>
      </div>

      {profile && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-4 md:mt-0 inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full font-bold shadow-sm w-fit"
        >
          <Award className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          <span>Level {profile.level}</span>
        </motion.div>
      )}
    </div>
  );
}
