import { useState, useEffect } from "react";
import { subscribeToDayCompletions } from "@/lib/firestore/completions";
import { getTodayDateStr } from "@/lib/utils";

export function useTodayCompletions(habitIds: string[], timezone: string) {
  const [completedHabitIds, setCompletedHabitIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (habitIds.length === 0) {
      setCompletedHabitIds(new Set());
      setLoading(false);
      return;
    }

    setLoading(true);
    const todayStr = getTodayDateStr(timezone);
    
    const unsub = subscribeToDayCompletions(habitIds, todayStr, (completedSet) => {
      setCompletedHabitIds(completedSet);
      setLoading(false);
    });

    return unsub;
  }, [habitIds, timezone]);

  return { completedHabitIds, loading };
}
