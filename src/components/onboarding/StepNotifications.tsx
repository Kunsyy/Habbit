"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, Share } from "lucide-react";

export function StepNotifications({ onNext }: { onNext: (token?: string) => void }) {
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream);
  }, []);

  const handleEnable = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        // Mock FCM token request for now
        const mockToken = "mock_fcm_token_" + Date.now();
        onNext(mockToken);
      } else {
        onNext();
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      onNext();
    }
  };

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
        <Bell className="w-12 h-12 text-primary" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Stay on track with reminders</h2>
        <p className="text-muted-foreground">
          Get gentle nudges to complete your habits at the right time.
        </p>
      </div>

      {isIOS && (
        <div className="bg-amber-500/10 text-amber-500 p-4 rounded-lg text-sm flex items-start gap-3 text-left">
          <Share className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">You'll need to install this app first</p>
            <p className="mt-1 opacity-90">To receive notifications on iOS, tap the share button and select "Add to Home Screen".</p>
          </div>
        </div>
      )}

      <div className="space-y-3 pt-4">
        <Button className="w-full" onClick={handleEnable}>
          Enable Notifications
        </Button>
        <Button variant="ghost" className="w-full" onClick={() => onNext()}>
          Maybe later
        </Button>
      </div>
    </div>
  );
}
