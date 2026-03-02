"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function StepTimezone({ onNext }: { onNext: (timezone: string) => void }) {
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );

  const commonTimezones = [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Asia/Tokyo",
    "Australia/Sydney",
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Set your timezone</h2>
        <p className="text-muted-foreground">We need this to accurately track your daily habits.</p>
      </div>

      <Card className="p-4 bg-muted/50 border-border">
        <div className="space-y-4">
          <div className="text-sm font-medium">Detected Timezone</div>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              {commonTimezones.includes(timezone) ? null : (
                <SelectItem value={timezone}>{timezone}</SelectItem>
              )}
              {commonTimezones.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Button className="w-full" onClick={() => onNext(timezone)}>
        Looks good!
      </Button>
    </div>
  );
}
