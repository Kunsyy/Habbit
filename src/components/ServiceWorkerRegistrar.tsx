"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    serwist?: {
      register: () => void;
    };
  }
}

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window !== "undefined" && window.serwist) {
      window.serwist.register();
    }
  }, []);

  return null;
}
