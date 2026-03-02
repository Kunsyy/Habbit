'use client';

import React from 'react';
import { ActivityCalendar } from 'react-activity-calendar';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export interface HeatmapData {
  date: string;
  count: number;
  level: number;
}

interface ActivityHeatmapProps {
  data: HeatmapData[];
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const { resolvedTheme } = useTheme();
  
  // Theme configuration for the heatmap
  // Muted, violet-200, violet-400, violet-600, and an extra shade for the required 5 levels in ActivityCalendar by default
  const lightTheme = {
    light: ['#f1f5f9', '#ddd6fe', '#a78bfa', '#7c3aed', '#5b21b6'],
    dark: ['#1e293b', '#ddd6fe', '#a78bfa', '#7c3aed', '#5b21b6']
  };

  return (
    <Card className="col-span-1 border-border bg-card shadow-sm transition-all hover:shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-bold tracking-tight text-foreground">Activity Heatmap</CardTitle>
        <CardDescription>Your habit completions over the last 365 days</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center pb-6">
        <ActivityCalendar
          data={data}
          theme={lightTheme}
          colorScheme={resolvedTheme === 'dark' ? 'dark' : 'light'}
          blockSize={14}
          blockRadius={4}
          blockMargin={4}
          fontSize={14}
          showTotalCount={true}
          showColorLegend={true}
          labels={{
            legend: {
              less: 'Less',
              more: 'More'
            },
            totalCount: '{{count}} completions in the last year'
          }}
          tooltips={{
            activity: {
              text: (activity) => `${activity.count} completions on ${activity.date}`
            }
          }}
        />
      </CardContent>
    </Card>
  );
}
