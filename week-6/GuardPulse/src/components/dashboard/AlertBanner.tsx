"use client";

import type { Alert } from "@/types/vitals";
import { VITAL_LABELS, ALERT_LEVEL_LABELS } from "@/lib/constants";

interface AlertBannerProps {
  alerts: Alert[];
}

export function AlertBanner({ alerts }: AlertBannerProps) {
  if (alerts.length === 0) return null;

  const latestAlert = alerts[0];
  const bgColors: Record<string, string> = {
    caution: "bg-yellow-100 border-yellow-400",
    warning: "bg-orange-100 border-orange-400",
    danger: "bg-red-100 border-red-500",
  };

  return (
    <div
      className={`rounded-xl border-2 p-4 mb-6 ${
        bgColors[latestAlert.alert_level]
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl">
          {latestAlert.alert_level === "danger" ? "🚨" : "⚠️"}
        </span>
        <div>
          <p className="text-lg font-bold text-gray-900">
            {ALERT_LEVEL_LABELS[latestAlert.alert_level]} —{" "}
            {VITAL_LABELS[latestAlert.vital_type as keyof typeof VITAL_LABELS] ??
              latestAlert.vital_type}
          </p>
          <p className="text-gray-700">
            {latestAlert.message ?? `측정값: ${latestAlert.value}`}
          </p>
        </div>
        <span className="ml-auto text-sm text-gray-500">
          {new Date(latestAlert.created_at).toLocaleString("ko-KR")}
        </span>
      </div>
      {alerts.length > 1 && (
        <p className="text-sm text-gray-500 mt-2 ml-12">
          외 {alerts.length - 1}건의 알림이 있습니다
        </p>
      )}
    </div>
  );
}
