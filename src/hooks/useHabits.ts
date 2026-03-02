import { useState, useEffect } from "react";
import { Habit } from "@/types/habit";
import { subscribeToHabits } from "@/lib/firestore/habits";
import { useAuth } from "./useAuth";

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user) {
      setHabits([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const unsub = subscribeToHabits(user.uid, (h) => {
      setHabits(h);
      setLoading(false);
    });
    
    return unsub;
  }, [user]);
  
  return { habits, loading };
}
