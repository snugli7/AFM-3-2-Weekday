"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { VitalCard } from "@/components/dashboard/VitalCard";
import { AlertBanner } from "@/components/dashboard/AlertBanner";
import { StatusIndicator } from "@/components/dashboard/StatusIndicator";
import { getAlertLevel, getOverallAlertLevel, generateSimulatedVital } from "@/lib/vitals";
import { useRealtimeVitals } from "@/hooks/useRealtimeVitals";
import { useRealtimeAlerts } from "@/hooks/useAlerts";
import type { VitalData, Alert } from "@/types/vitals";

export default function DashboardPage() {
  const [latestVital, setLatestVital] = useState<VitalData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchLatestData();
  }, []);

  async function fetchLatestData() {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    setUserId(user.id);

    const { data: vitals } = await supabase
      .from("vitals")
      .select("*")
      .eq("user_id", user.id)
      .order("recorded_at", { ascending: false })
      .limit(1);

    if (vitals && vitals.length > 0) {
      setLatestVital(vitals[0]);
    }

    const { data: alertData } = await supabase
      .from("alerts")
      .select("*")
      .eq("user_id", user.id)
      .eq("acknowledged", false)
      .order("created_at", { ascending: false })
      .limit(5);

    if (alertData) {
      setAlerts(alertData);
    }

    setRealtimeConnected(true);
    setLoading(false);
  }

  // 실시간 생체 데이터 수신
  const handleNewVital = useCallback((vital: VitalData) => {
    setLatestVital(vital);

    // 서버에 위험 감지 요청
    fetch("/api/vitals/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vital_id: vital.id }),
    });
  }, []);

  // 실시간 알림 수신
  const handleNewAlert = useCallback((alert: Alert) => {
    setAlerts((prev) => [alert, ...prev.slice(0, 4)]);
  }, []);

  useRealtimeVitals({
    userId: realtimeConnected ? userId : null,
    onNewVital: handleNewVital,
  });

  useRealtimeAlerts({
    userId: realtimeConnected ? userId : null,
    onNewAlert: handleNewAlert,
  });

  async function handleSimulate() {
    setSimulating(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSimulating(false);
      return;
    }

    const simulated = generateSimulatedVital();

    const { data } = await supabase
      .from("vitals")
      .insert({ ...simulated, user_id: user.id })
      .select()
      .single();

    if (data) {
      setLatestVital(data);

      // 서버에서 위험 감지 처리
      const res = await fetch("/api/vitals/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vital_id: data.id }),
      });
      const result = await res.json();

      if (result.alerts && result.alerts.length > 0) {
        setAlerts((prev) => [...result.alerts, ...prev].slice(0, 5));
      }
    }

    setSimulating(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-xl text-gray-500">데이터를 불러오는 중...</p>
      </div>
    );
  }

  const overallLevel = latestVital ? getOverallAlertLevel(latestVital) : "normal";

  return (
    <div>
      {/* 상단 상태 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-lg text-gray-500">실시간 건강 상태 모니터링</p>
            {realtimeConnected && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                실시간 연결됨
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <StatusIndicator level={overallLevel} size="lg" />
          <button
            onClick={handleSimulate}
            disabled={simulating}
            className="px-5 py-3 bg-blue-600 text-white text-lg font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {simulating ? "전송 중..." : "데이터 시뮬레이션"}
          </button>
        </div>
      </div>

      {/* 알림 배너 */}
      <AlertBanner alerts={alerts} />

      {/* 생체 데이터 카드 */}
      {latestVital ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <VitalCard
            label="심박수"
            value={latestVital.heart_rate}
            unit="bpm"
            icon="💓"
            alertLevel={getAlertLevel("heart_rate", latestVital.heart_rate)}
          />
          <VitalCard
            label="수축기 혈압"
            value={latestVital.systolic_bp}
            unit="mmHg"
            icon="🩸"
            alertLevel={getAlertLevel("systolic_bp", latestVital.systolic_bp)}
          />
          <VitalCard
            label="산소포화도"
            value={latestVital.spo2 ? Number(latestVital.spo2) : null}
            unit="%"
            icon="🫁"
            alertLevel={getAlertLevel("spo2", latestVital.spo2 ? Number(latestVital.spo2) : null)}
          />
          <VitalCard
            label="이완기 혈압"
            value={latestVital.diastolic_bp}
            unit="mmHg"
            icon="💉"
            alertLevel={getAlertLevel("diastolic_bp", latestVital.diastolic_bp)}
          />
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <p className="text-5xl mb-4">⌚</p>
          <p className="text-xl text-gray-600 mb-2">아직 생체 데이터가 없습니다</p>
          <p className="text-lg text-gray-400">
            위의 &quot;데이터 시뮬레이션&quot; 버튼을 눌러 테스트해 보세요
          </p>
        </div>
      )}

      {/* 부정맥 상태 */}
      {latestVital && (
        <div className={`rounded-xl p-5 ${latestVital.arrhythmia_detected ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"}`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{latestVital.arrhythmia_detected ? "⚠️" : "✅"}</span>
            <div>
              <p className="text-lg font-bold">부정맥 감지</p>
              <p className={`text-lg ${latestVital.arrhythmia_detected ? "text-red-600 font-bold" : "text-green-600"}`}>
                {latestVital.arrhythmia_detected ? "부정맥이 감지되었습니다!" : "정상 리듬"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 마지막 측정 시간 */}
      {latestVital && (
        <p className="text-sm text-gray-400 mt-4 text-right">
          마지막 측정: {new Date(latestVital.recorded_at).toLocaleString("ko-KR")}
        </p>
      )}
    </div>
  );
}
