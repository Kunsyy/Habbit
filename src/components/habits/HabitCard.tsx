"use client";
import { useState, useRef, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import { Habit } from "@/types/habit";
import { StreakBadge } from "./StreakBadge";
import { uncompleteHabit } from "@/lib/firestore/completions";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Edit2, Trash2 } from "lucide-react";

interface HabitCardProps {
  habit: Habit;
  dateStr: string;
  isCompleted: boolean;
  streak?: number;
  onEdit?: (habit: Habit) => void;
  onDelete?: (habitId: string) => void;
}

export function HabitCard({
  habit,
  dateStr,
  isCompleted: initialCompleted,
  streak = 0,
  onEdit,
  onDelete,
}: HabitCardProps) {
  const [isCompleted, setIsCompleted] = useState(initialCompleted);
  const [isLoading, setIsLoading] = useState(false);
  const { setTriggerConfetti } = useAppStore();
  const controls = useAnimation();
  
  // Sync if prop changes externally
  useEffect(() => {
    setIsCompleted(initialCompleted);
  }, [initialCompleted]);

  const toggleCompletion = async () => {
    if (isLoading) return;
    
    const newState = !isCompleted;
    setIsCompleted(newState); // Optimistic UI
    
    if (newState) {
      // Spring scale animation + confetti
      controls.start({
        scale: [1, 1.05, 1],
        transition: { type: "spring", stiffness: 400, damping: 17 }
      });
      setTriggerConfetti(true);
    }

    setIsLoading(true);
    try {
      if (newState) {
        const res = await fetch(`/api/habits/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ habitId: habit.id, dateStr }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Failed to complete habit");
        }
      } else {
        await uncompleteHabit(habit.id, dateStr);
      }
    } catch (error) {
      console.error("Failed to update habit:", error);
      setIsCompleted(!newState); // Revert
      toast.error("Failed to update habit. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const habitColor = habit.color || "var(--primary)";

  return (
    <motion.div
      animate={controls}
      layout
      className={cn(
        "relative flex items-center gap-4 p-4 rounded-2xl bg-card border shadow-sm transition-colors group",
        isCompleted && "bg-muted/30 border-primary/20"
      )}
      style={{
        borderLeftWidth: "4px",
        borderLeftColor: habitColor,
      }}
    >
      {/* Icon */}
      <div 
        className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full text-2xl shadow-inner"
        style={{ backgroundColor: `${habitColor}20`, color: habitColor }}
      >
        {habit.icon || "🎯"}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className={cn(
            "font-semibold text-base truncate transition-all duration-300",
            isCompleted && "line-through text-muted-foreground"
          )}>
            {habit.name}
          </h3>
          {streak > 0 && <StreakBadge streak={streak} />}
        </div>
        {habit.description && (
          <p className="text-sm text-muted-foreground truncate">
            {habit.description}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 md:gap-2">
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => onEdit?.(habit)}
            className="p-2 rounded-full text-muted-foreground hover:bg-muted/50 transition-colors focus:outline-none"
            aria-label="Edit habit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onDelete?.(habit.id)}
            className="p-2 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors focus:outline-none"
            aria-label="Delete habit"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={toggleCompletion}
          disabled={isLoading}
          className={cn(
            "relative w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ml-2",
            isCompleted ? "bg-primary border-primary" : "border-muted-foreground/30 hover:border-primary/50"
          )}
          aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
        >
          <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("w-4 h-4 text-primary-foreground", !isCompleted && "opacity-0")}
            initial={false}
            animate={{ pathLength: isCompleted ? 1 : 0, opacity: isCompleted ? 1 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <motion.polyline points="20 6 9 17 4 12" />
          </motion.svg>
        </button>
      </div>
    </motion.div>
  );
}
