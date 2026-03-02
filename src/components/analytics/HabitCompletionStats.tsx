'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export interface CompletionStat {
  habitId: string;
  habitName: string;
  totalCompletions: number;
  daysSinceCreation: number;
  percentage: number;
}

interface HabitCompletionStatsProps {
  stats: CompletionStat[];
}

export function HabitCompletionStats({ stats }: HabitCompletionStatsProps) {
  const sortedStats = [...stats].sort((a, b) => b.percentage - a.percentage);

  return (
    <Card className="col-span-1 lg:col-span-2 border-border bg-card shadow-sm hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-xl font-bold tracking-tight text-foreground">
          Completion Rate
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedStats.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No active habits to calculate completion rates.
          </p>
        ) : (
          <div className="space-y-6">
            {sortedStats.map((stat) => (
              <div key={stat.habitId} className="flex flex-col gap-2 group">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span className="truncate pr-4 tracking-wide text-foreground group-hover:text-primary transition-colors">
                    {stat.habitName}
                  </span>
                  <span className="shrink-0 text-muted-foreground font-semibold">
                    {Math.round(stat.percentage)}%
                  </span>
                </div>
                <Progress value={stat.percentage} className="h-3" />
                <p className="text-xs text-muted-foreground/70 text-right">
                  {stat.totalCompletions} / {stat.daysSinceCreation} day{stat.daysSinceCreation !== 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
