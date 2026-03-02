"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex h-[calc(100vh-100px)] items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center p-12 bg-card rounded-3xl border border-dashed border-destructive/50 text-center max-w-md w-full shadow-sm"
      >
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Something went wrong!</h2>
        <p className="text-sm text-muted-foreground mb-8">
          We encountered an unexpected error while loading this page.
        </p>
        <button
          onClick={() => reset()}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-full font-bold hover:bg-primary/90 transition-colors shadow-sm"
        >
          Try again
        </button>
      </motion.div>
    </div>
  );
}
