"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share } from "lucide-react";

export function StepInstallPWA({ onFinish }: { onFinish: () => void }) {
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
    }
  };

  if (isStandalone) {
    return (
      <div className="space-y-6 text-center">
        <div className="text-6xl mb-6">🎉</div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Already installed!</h2>
          <p className="text-muted-foreground">You're all set to build amazing habits.</p>
        </div>
        <Button className="w-full" onClick={onFinish}>
          Start tracking
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
        <Download className="w-12 h-12 text-primary" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Install the App</h2>
        <p className="text-muted-foreground">
          For the best experience, install Habbit on your device.
        </p>
      </div>

      <div className="bg-muted/50 p-6 rounded-lg text-left space-y-4">
        {isIOS ? (
          <div className="space-y-3">
            <p className="font-medium text-sm">To install on iOS:</p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                Tap the Share button <Share className="w-4 h-4" />
              </li>
              <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
              <li>Tap <strong>"Add"</strong> in the top right</li>
            </ol>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="font-medium text-sm">Install for quick access and offline use.</p>
            {deferredPrompt ? (
              <Button className="w-full mt-2" onClick={handleInstallClick}>
                Install Now
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Look for the install icon in your browser's address bar or menu.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="pt-4">
        <Button className="w-full" onClick={onFinish}>
          Start tracking
        </Button>
      </div>
    </div>
  );
}
