"use client";

import { useEffect, useState, useCallback, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { VitalCard } from "@/components/dashboard/VitalCard";
import { AlertBanner } from "@/components/dashboard/AlertBanner";
import { StatusIndicator } from "@/components/dashboard/StatusIndicator";
import { getAlertLevel, getOverallAlertLevel } from "@/lib/vitals";
import { useRealtimeVitals } from "@/hooks/useRealtimeVitals";
import { useRealtimeAlerts } from "@/hooks/useAlerts";
import type { VitalData, Alert } from "@/types/vitals";

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default function GuardianMonitorPage({ params }: PageProps) {
  const { userId: wearerId } = use(params);
  const [wearerName, setWearerName] = useState("");
  const [latestVital, setLatestVital] = useState<VitalData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    checkAccessAndFetch();
  }, [wearerId]);

  async function checkAccessAndFetch() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // 보호자 권한 확인
    const { data: connection } = await supabase
      .from("family_connections")
      .select("*")
      .eq("guardian_id", user.id)
      .eq("wearer_id", wearerId)
      .eq("status", "accepted")
      .single();

    if (!connection) {
      setLoading(false);
      return;
    }

    setAuthorized(true);

    // 착용자 이름 조회
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", wearerId)
      .single();

    if (profile) setWearerName(profile.name);

    // 최근 생체 데이터
    const { data: vitals } = await supabase
      .from("vitals")
      .select("*")
      .eq("user_id", wearerId)
      .order("recorded_at", { ascending: false })
      .limit(1);

    if (vitals && vitals.length > 0) {
      setLatestVital(vitals[0]);
    }

    // 미확인 알림
    const { data: alertData } = await supabase
      .from("alerts")
      .select("*")
      .eq("user_id", wearerId)
      .eq("acknowledged", false)
      .order("created_at", { ascending: false })
      .limit(5);

    if (alertData) setAlerts(alertData);

    setLoading(false);
  }

  // 실시간 모니터링
  const handleNewVital = useCallback((vital: VitalData) => {
    setLatestVital(vital);
  }, []);

  const handleNewAlert = useCallback((alert: Alert) => {
    setAlerts((prev) => [alert, ...prev.slice(0, 4)]);
  }, []);

  useRealtimeVitals({
    userId: authorized ? wearerId : null,
    onNewVital: handleNewVital,
  });

  useRealtimeAlerts({
    userId: authorized ? wearerId : null,
    onNewAlert: handleNewAlert,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-xl text-gray-500">불러오는 중...</p>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <p className="text-5xl mb-4">🔒</p>
          <p className="text-xl text-gray-600">접근 권한이 없습니다</p>
          <p className="text-lg text-gray-400 mt-2">
            착용자가 보호자로 초대하고 수락된 상태여야 모니터링할 수 있습니다
          </p>
        </div>
      </div>
    );
  }

  const overallLevel = latestVital ? getOverallAlertLevel(latestVital) : "normal";

  return (
    <div className="max-w-5xl mx-auto p-6 lg:p-8">
      {/* 상단 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {wearerName}님 모니터링
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-lg text-gray-500">보호자 대시보드</p>
            <span className="flex items-center gap-1 text-sm text-green-600">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              실시간
            </span>
          </div>
        </div>
        <StatusIndicator level={overallLevel} size="lg" />
      </div>

      {/* 알림 */}
      <AlertBanner alerts={alerts} />

      {/* 생체 데이터 */}
      {latestVital ? (
        <>
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

          {/* 부정맥 */}
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

          <p className="text-sm text-gray-400 mt-4 text-right">
            마지막 측정: {new Date(latestVital.recorded_at).toLocaleString("ko-KR")}
          </p>
        </>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <p className="text-5xl mb-4">⌚</p>
          <p className="text-xl text-gray-600">아직 생체 데이터가 없습니다</p>
        </div>
      )}
    </div>
  );
}
