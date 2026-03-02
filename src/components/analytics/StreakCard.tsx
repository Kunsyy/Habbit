'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface StreakCardProps {
  habitName: string;
  currentStreak: number;
  longestStreak: number;
}

export function StreakCard({ habitName, currentStreak, longestStreak }: StreakCardProps) {
  const isHot = currentStreak >= 7;

  return (
    <Card className="relative overflow-hidden bg-card border-border shadow-sm hover:shadow-md transition-shadow">
      {/* Dynamic gradient background if hot */}
      {isHot && (
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-red-500/5 to-transparent z-0" />
      )}
      <CardHeader className="relative z-10 pb-2">
        <CardTitle className="text-lg font-bold tracking-tight text-foreground truncate">
          {habitName}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10 pt-2 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Current Streak
            </span>
            <div className="flex items-center mt-1">
              <span className="text-3xl font-black text-foreground mr-2">
                {currentStreak}
              </span>
              {isHot ? (
                <motion.span
                  className="text-2xl"
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [-5, 5, -5]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  title="On Fire!"
                >
                  🔥
                </motion.span>
              ) : (
                <span className="text-2xl opacity-40">🔥</span>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Longest
            </span>
            <div className="flex items-center mt-1 text-primary">
              <span className="text-2xl font-bold mr-1">{longestStreak}</span>
              <span className="text-xl">⚡</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
