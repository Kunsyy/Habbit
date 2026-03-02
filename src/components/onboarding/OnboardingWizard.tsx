"use client";

import { useEffect, useState } from "react";
import { StepTimezone } from "./StepTimezone";
import { StepNotifications } from "./StepNotifications";
import { StepInstallPWA } from "./StepInstallPWA";
import { useAuth } from "@/hooks/useAuth";
import { subscribeToUserProfile, updateUserProfile } from "@/lib/firestore/users";

export function OnboardingWizard() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [showWizard, setShowWizard] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsub = subscribeToUserProfile(user.uid, (profile) => {
      if (!profile?.onboardingComplete) {
        setShowWizard(true);
      } else {
        setShowWizard(false);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const handleTimezoneNext = async (timezone: string) => {
    if (!user) return;
    await updateUserProfile(user.uid, { timezone });
    setStep(2);
  };

  const handleNotificationsNext = async (token?: string) => {
    if (!user) return;
    if (token) {
      await updateUserProfile(user.uid, { fcmToken: token } as any);
    }
    setStep(3);
  };

  const handleFinish = async () => {
    if (!user) return;
    await updateUserProfile(user.uid, { onboardingComplete: true });
    setShowWizard(false);
  };

  if (loading || !showWizard) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md p-4">
      <div className="w-full max-w-md p-6 sm:p-8 bg-card border shadow-2xl rounded-2xl relative">
        <div className="absolute top-6 right-6 text-sm font-medium text-muted-foreground">
          Step {step} of 3
        </div>

        {step === 1 && <StepTimezone onNext={handleTimezoneNext} />}
        {step === 2 && <StepNotifications onNext={handleNotificationsNext} />}
        {step === 3 && <StepInstallPWA onFinish={handleFinish} />}
      </div>
    </div>
  );
}
