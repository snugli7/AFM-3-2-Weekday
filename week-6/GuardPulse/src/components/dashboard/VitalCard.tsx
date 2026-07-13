"use client";

import { ALERT_LEVEL_COLORS, VITAL_UNITS } from "@/lib/constants";
import type { AlertLevel } from "@/types/vitals";

interface VitalCardProps {
  label: string;
  value: number | null;
  unit: string;
  icon: string;
  alertLevel: AlertLevel;
}

export function VitalCard({ label, value, unit, icon, alertLevel }: VitalCardProps) {
  const borderColor = ALERT_LEVEL_COLORS[alertLevel];
  const bgColors: Record<AlertLevel, string> = {
    normal: "bg-green-50",
    caution: "bg-yellow-50",
    warning: "bg-orange-50",
    danger: "bg-red-50",
  };
  const textColors: Record<AlertLevel, string> = {
    normal: "text-green-700",
    caution: "text-yellow-700",
    warning: "text-orange-700",
    danger: "text-red-700",
  };
  const statusLabels: Record<AlertLevel, string> = {
    normal: "정상",
    caution: "주의",
    warning: "경고",
    danger: "위험",
  };

  return (
    <div
      className={`rounded-2xl p-6 ${bgColors[alertLevel]} border-l-4`}
      style={{ borderLeftColor: borderColor }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-3xl">{icon}</span>
        <span
          className={`px-3 py-1 rounded-full text-sm font-bold ${textColors[alertLevel]} ${
            alertLevel === "normal" ? "bg-green-100" :
            alertLevel === "caution" ? "bg-yellow-100" :
            alertLevel === "warning" ? "bg-orange-100" : "bg-red-100"
          }`}
        >
          {statusLabels[alertLevel]}
        </span>
      </div>
      <p className="text-lg text-gray-600 mb-1">{label}</p>
      <p className="text-4xl font-bold text-gray-900">
        {value !== null ? value : "--"}
        <span className="text-xl text-gray-500 ml-1">{unit}</span>
      </p>
    </div>
  );
}
