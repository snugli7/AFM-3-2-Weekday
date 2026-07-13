"use client";

import type { AlertLevel } from "@/types/vitals";
import { ALERT_LEVEL_COLORS, ALERT_LEVEL_LABELS } from "@/lib/constants";

interface StatusIndicatorProps {
  level: AlertLevel;
  size?: "sm" | "md" | "lg";
}

export function StatusIndicator({ level, size = "md" }: StatusIndicatorProps) {
  const sizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <div className="flex items-center gap-2">
      <span
        className={`${sizes[size]} rounded-full inline-block ${
          level !== "normal" ? "animate-pulse" : ""
        }`}
        style={{ backgroundColor: ALERT_LEVEL_COLORS[level] }}
      />
      <span className={`font-medium ${textSizes[size]}`}>
        {ALERT_LEVEL_LABELS[level]}
      </span>
    </div>
  );
}
