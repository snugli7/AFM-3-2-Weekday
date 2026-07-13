"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ALERT_LEVEL_LABELS, VITAL_LABELS } from "@/lib/constants";
import type { Alert } from "@/types/vitals";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    fetchAlerts();
  }, []);

  async function fetchAlerts() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("alerts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) setAlerts(data);
    setLoading(false);
  }

  async function acknowledgeAlert(alertId: string) {
    await supabase
      .from("alerts")
      .update({ acknowledged: true })
      .eq("id", alertId);

    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
    );
  }

  async function acknowledgeAll() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("alerts")
      .update({ acknowledged: true })
      .eq("user_id", user.id)
      .eq("acknowledged", false);

    setAlerts((prev) => prev.map((a) => ({ ...a, acknowledged: true })));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-xl text-gray-500">알림을 불러오는 중...</p>
      </div>
    );
  }

  const unacknowledgedCount = alerts.filter((a) => !a.acknowledged).length;

  const levelStyles: Record<string, string> = {
    caution: "border-l-yellow-400 bg-yellow-50",
    warning: "border-l-orange-400 bg-orange-50",
    danger: "border-l-red-500 bg-red-50",
  };

  const levelIcons: Record<string, string> = {
    caution: "⚠️",
    warning: "🔶",
    danger: "🚨",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">알림 이력</h1>
          <p className="text-lg text-gray-500 mt-1">
            {unacknowledgedCount > 0
              ? `미확인 알림 ${unacknowledgedCount}건`
              : "모든 알림을 확인했습니다"}
          </p>
        </div>
        {unacknowledgedCount > 0 && (
          <button
            onClick={acknowledgeAll}
            className="px-5 py-3 bg-gray-600 text-white text-lg font-medium rounded-xl hover:bg-gray-700 transition-colors"
          >
            모두 확인
          </button>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <p className="text-5xl mb-4">✅</p>
          <p className="text-xl text-gray-600">알림이 없습니다</p>
          <p className="text-lg text-gray-400 mt-2">
            위험 상황이 발생하면 여기에 표시됩니다
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-xl border-l-4 p-5 ${
                levelStyles[alert.alert_level]
              } ${alert.acknowledged ? "opacity-60" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {levelIcons[alert.alert_level]}
                  </span>
                  <div>
                    <p className="text-lg font-bold text-gray-900">
                      {ALERT_LEVEL_LABELS[alert.alert_level]} —{" "}
                      {VITAL_LABELS[alert.vital_type as keyof typeof VITAL_LABELS] ??
                        alert.vital_type}
                    </p>
                    <p className="text-gray-600">
                      {alert.message ?? `측정값: ${alert.value}`}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {new Date(alert.created_at).toLocaleString("ko-KR")}
                    </p>
                  </div>
                </div>
                {!alert.acknowledged && (
                  <button
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    확인
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
