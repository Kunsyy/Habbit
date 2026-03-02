"use client";
import { motion } from "framer-motion";

interface TodayProgressProps {
  completed: number;
  total: number;
}

export function TodayProgress({ completed, total }: TodayProgressProps) {
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex items-center gap-6 p-6 rounded-3xl bg-card border shadow-sm">
      <div className="relative flex items-center justify-center w-24 h-24">
        {/* Background Circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-muted/30"
          />
          {/* Animated Progress Circle */}
          <motion.circle
            cx="48"
            cy="48"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeLinecap="round"
            className="text-primary"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, type: "spring", bounce: 0.1 }}
            style={{ strokeDasharray: circumference }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-xl font-bold">{percentage}%</span>
        </div>
      </div>
      
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold tracking-tight">Today's Progress</h2>
        <p className="text-muted-foreground">
          You have completed <strong className="text-foreground">{completed}</strong> out of <strong className="text-foreground">{total}</strong> habits today.
          {percentage === 100 && total > 0 && " Amazing job! 🎉"}
        </p>
      </div>
    </div>
  );
}
