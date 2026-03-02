"use client";
import { ReactNode } from "react";
import { motion } from "framer-motion";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon = <span className="text-4xl block">🌱</span>,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex flex-col items-center justify-center p-12 bg-card rounded-3xl border border-dashed text-muted-foreground text-center ${className}`}
    >
      {icon && <div className="mb-4">{icon}</div>}
      <h3 className="font-bold text-xl text-foreground mb-2">{title}</h3>
      {description && <p className="text-sm mb-4 max-w-sm">{description}</p>}
      {action && <div>{action}</div>}
    </motion.div>
  );
}
