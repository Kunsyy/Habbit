"use client";

import React, { useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useAppStore } from "@/store/useAppStore";

const ReactCanvasConfetti = dynamic(() => import("react-canvas-confetti"), { ssr: false });

export default function ConfettiOverlay() {
  const { triggerConfetti, setTriggerConfetti } = useAppStore();
  const confettiRef = useRef<any>(null);

  const onInit = useCallback(({ confetti }: { confetti: any }) => {
    confettiRef.current = confetti;
  }, []);

  useEffect(() => {
    if (triggerConfetti && confettiRef.current) {
      confettiRef.current({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
      setTriggerConfetti(false);
    }
  }, [triggerConfetti, setTriggerConfetti]);

  return (
    <ReactCanvasConfetti
      onInit={onInit}
      style={{
        position: "fixed",
        pointerEvents: "none",
        width: "100%",
        height: "100%",
        top: 0,
        left: 0,
        zIndex: 9999
      }}
    />
  );
}
