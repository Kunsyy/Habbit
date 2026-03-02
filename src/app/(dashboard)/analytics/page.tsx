'use client';

import { useEffect, useState } from 'react';
import { useHabits } from '@/hooks/useHabits';
import { db } from '@/lib/firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { getDateStr } from '@/lib/utils';
import { ActivityHeatmap, HeatmapData } from '@/components/analytics/ActivityHeatmap';
import { EmptyState } from '@/components/ui/EmptyState';
import { StreakCard } from '@/components/analytics/StreakCard';
import { HabitCompletionStats, CompletionStat } from '@/components/analytics/HabitCompletionStats';
import { motion } from 'framer-motion';

// Using system timezone for calculations
const TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

interface HabitAnalytics {
  habitId: string;
  habitName: string;
  completions: string[];
  createdAt: number;
}

export default function AnalyticsPage() {
  const { habits, loading: habitsLoading } = useHabits();
  const [analyticsData, setAnalyticsData] = useState<HabitAnalytics[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (habitsLoading) return;
    
    if (habits.length === 0) {
      setAnalyticsData([]);
      setDataLoading(false);
      return;
    }

    const fetchCompletions = async () => {
      setDataLoading(true);
      try {
        const dataPromises = habits.map(async (habit) => {
          const completionsRef = collection(db, 'habits', habit.id, 'completions');
          const snap = await getDocs(completionsRef);
          const compDates = snap.docs.map(doc => doc.id); // dateStr is the document ID
          return {
            habitId: habit.id,
            habitName: habit.name,
            completions: compDates,
            createdAt: habit.createdAt
          };
        });

        const results = await Promise.all(dataPromises);
        setAnalyticsData(results);
      } catch (err) {
        console.error('Failed to fetch completions', err);
      } finally {
        setDataLoading(false);
      }
    };

    fetchCompletions();
  }, [habits, habitsLoading]);

  if (habitsLoading || dataLoading) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const hasAnyCompletions = analyticsData.some(habit => habit.completions.length > 0);
  
  if (!hasAnyCompletions) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-8 pb-10 max-w-5xl mx-auto px-4 sm:px-6 mt-6"
      >
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Analytics</h1>
          <p className="text-muted-foreground text-sm">Track your progress and build consistency over time.</p>
        </div>
        <EmptyState 
          icon={<span className="text-5xl block mb-2">📉</span>}
          title="No analytics data yet"
          description="Complete some habits to see your progress and streaks."
          className="mt-8 py-20"
        />
      </motion.div>
    );
  }

  // --- Process Heatmap Data ---
  const completionsByDate: Record<string, number> = {};
  analyticsData.forEach(habit => {
    habit.completions.forEach(dateStr => {
      completionsByDate[dateStr] = (completionsByDate[dateStr] || 0) + 1;
    });
  });

  const last365Days: string[] = [];
  const today = new Date();
  // Ensure we don't mess up the timezone matching by using the current time
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    last365Days.push(getDateStr(d, TIMEZONE));
  }

  const heatmapData: HeatmapData[] = last365Days.map(dateStr => {
    const count = completionsByDate[dateStr] || 0;
    let level = 0;
    if (count === 1) level = 1;
    else if (count >= 2 && count <= 3) level = 2;
    else if (count >= 4) level = 3;
    // max level for react-activity-calendar default theme is 4
    if (count > 6) level = 4; // Adding a 4th level just in case, though 0-3 cover the requirements
    return { date: dateStr, count, level };
  });

  // --- Process Streak Data ---
  const calculateStreaks = (completionDates: string[]) => {
    if (completionDates.length === 0) return { current: 0, longest: 0 };
    
    const dates = [...completionDates].sort((a, b) => b.localeCompare(a));
    const dateSet = new Set(dates);
    
    let longest = 0;
    let currentStreak = 0;
    
    const t = new Date();
    const todayStr = getDateStr(t, TIMEZONE);
    const y = new Date(t);
    y.setDate(y.getDate() - 1);
    const yesterdayStr = getDateStr(y, TIMEZONE);
    
    let checkDate: Date | null = new Date(t);
    if (dateSet.has(todayStr)) {
      checkDate = new Date(t);
    } else if (dateSet.has(yesterdayStr)) {
      checkDate = new Date(y);
    } else {
      checkDate = null;
    }
    
    if (checkDate) {
      while (true) {
        const dStr = getDateStr(checkDate, TIMEZONE);
        if (dateSet.has(dStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Longest streak
    const ascendingDates = [...dates].reverse();
    for (const dateStr of ascendingDates) {
      const d = new Date(dateStr);
      const prevDay = new Date(d);
      prevDay.setDate(prevDay.getDate() - 1);
      const prevStr = getDateStr(prevDay, TIMEZONE);
      
      if (!dateSet.has(prevStr)) {
        let streak = 1;
        const nextDay = new Date(d);
        while (true) {
          nextDay.setDate(nextDay.getDate() + 1);
          const nextStr = getDateStr(nextDay, TIMEZONE);
          if (dateSet.has(nextStr)) {
            streak++;
          } else {
            break;
          }
        }
        if (streak > longest) longest = streak;
      }
    }
    
    return { current: currentStreak, longest };
  };

  const streakData = analyticsData.map(habit => {
    const { current, longest } = calculateStreaks(habit.completions);
    return {
      habitId: habit.habitId,
      habitName: habit.habitName,
      current,
      longest
    };
  });

  // --- Process Completion Stats ---
  const statsData: CompletionStat[] = analyticsData.map(habit => {
    // days since creation
    const createdDate = new Date(habit.createdAt);
    const timeDiff = today.getTime() - createdDate.getTime();
    let daysSinceCreation = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // ensure at least 1 day to avoid Infinity/NaN division
    if (daysSinceCreation < 1) daysSinceCreation = 1;

    const totalCompletions = habit.completions.length;
    let percentage = (totalCompletions / daysSinceCreation) * 100;
    
    // Cap at 100% just in case there are multiple completions per day if not restricted
    if (percentage > 100) percentage = 100;

    return {
      habitId: habit.habitId,
      habitName: habit.habitName,
      totalCompletions,
      daysSinceCreation,
      percentage
    };
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 pb-10 max-w-5xl mx-auto px-4 sm:px-6 mt-6"
    >
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Analytics</h1>
        <p className="text-muted-foreground text-sm">Track your progress and build consistency over time.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3">
          <ActivityHeatmap data={heatmapData} />
        </div>
        
        <div className="lg:col-span-2">
          <HabitCompletionStats stats={statsData} />
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-bold tracking-tight text-foreground px-1">Habit Streaks</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              {streakData.length === 0 ? (
                <p className="text-sm text-muted-foreground col-span-full py-4 text-center border border-dashed rounded-lg">
                  No active habits.
                </p>
              ) : (
                streakData.map(streak => (
                  <StreakCard
                    key={streak.habitId}
                    habitName={streak.habitName}
                    currentStreak={streak.current}
                    longestStreak={streak.longest}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
