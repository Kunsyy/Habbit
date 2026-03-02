"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function AnalyticsLoading() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 pb-10 max-w-5xl mx-auto px-4 sm:px-6 mt-6 w-full"
    >
      <div className="space-y-2">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-5 w-64" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Heatmap Skeleton */}
        <div className="lg:col-span-3">
          <div className="p-6 rounded-3xl border bg-card shadow-sm space-y-4">
            <Skeleton className="h-6 w-32 mb-6" />
            <div className="w-full h-[150px] flex items-center justify-center">
              <div className="grid grid-rows-7 grid-flow-col gap-1 w-full h-full opacity-50">
                {Array.from({ length: 364 }).map((_, i) => (
                  <Skeleton key={i} className="w-full h-full rounded-sm" />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-3 w-3 rounded-sm" />
              ))}
            </div>
          </div>
        </div>
        
        {/* Habit Completion Stats Skeleton */}
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-7 w-48 mb-4" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-5 rounded-3xl border bg-card shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-12" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>

        {/* Streak Cards Skeleton */}
        <div className="lg:col-span-1 space-y-6">
          <div className="space-y-4">
            <Skeleton className="h-7 w-32 px-1" />
            <div className="grid grid-cols-1 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-5 rounded-3xl border bg-card shadow-sm flex items-center justify-between">
                  <Skeleton className="h-5 w-24" />
                  <div className="flex gap-4">
                    <Skeleton className="h-10 w-12 rounded-xl" />
                    <Skeleton className="h-10 w-12 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
