"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useHabits } from "@/hooks/useHabits";
import { useTodayCompletions } from "@/hooks/useTodayCompletions";
import { subscribeToUserProfile } from "@/lib/firestore/users";
import { UserProfile } from "@/types/user";
import { getTodayDateStr } from "@/lib/utils";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { TodayProgress } from "@/components/dashboard/TodayProgress";
import { GamificationBar } from "@/components/dashboard/GamificationBar";
import { HabitCard } from "@/components/habits/HabitCard";
import { HabitCardSkeleton } from "@/components/habits/HabitCardSkeleton";

export default function DashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { habits, loading: habitsLoading } = useHabits();
  
  // Need timezone for accurate today completions
  const timezone = profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const todayStr = getTodayDateStr(timezone);
  
  const { completedHabitIds, loading: completionsLoading } = useTodayCompletions(
    habits.map(h => h.id), 
    timezone
  );

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToUserProfile(user.uid, (p) => setProfile(p));
    return () => unsub();
  }, [user]);

  const isLoading = habitsLoading || completionsLoading;

  // Ordered habits
  const sortedHabits = [...habits].sort((a, b) => a.order - b.order);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full pb-20 p-4 md:p-8">
      <DashboardHeader profile={profile} />
      
      <div className="grid gap-6">
        <TodayProgress completed={completedHabitIds.size} total={habits.length} />
        <GamificationBar profile={profile} />
      </div>

      <div className="mt-8 flex flex-col gap-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold tracking-tight">Today's Habits</h2>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-4">
            <HabitCardSkeleton />
            <HabitCardSkeleton />
            <HabitCardSkeleton />
          </div>
        ) : sortedHabits.length === 0 ? (
          <EmptyState
            icon={<span className="text-4xl block">🌱</span>}
            title="No habits found"
            description="Add a habit to get started today."
          />
        ) : (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-4"
          >
            <AnimatePresence mode="popLayout">
              {sortedHabits.map(habit => (
                <motion.div key={habit.id} variants={item} layout>
                  <HabitCard
                    habit={habit}
                    dateStr={todayStr}
                    isCompleted={completedHabitIds.has(habit.id)}
                    streak={0} // Computed later when streak system is added
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
