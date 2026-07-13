"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { HeartRateChart } from "@/components/charts/HeartRateChart";
import { BloodPressureChart } from "@/components/charts/BloodPressureChart";
import { SpO2Chart } from "@/components/charts/SpO2Chart";
import { generateSimulatedVital } from "@/lib/vitals";
import type { VitalData } from "@/types/vitals";

export default function VitalsPage() {
  const [vitals, setVitals] = useState<VitalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchVitals();
  }, []);

  async function fetchVitals() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("vitals")
      .select("*")
      .eq("user_id", user.id)
      .order("recorded_at", { ascending: false })
      .limit(30);

    if (data) setVitals(data);
    setLoading(false);
  }

  async function generateBatchData() {
    setGenerating(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 10개의 시뮬레이션 데이터 생성 (5분 간격)
    const records = [];
    const now = Date.now();
    for (let i = 9; i >= 0; i--) {
      const simulated = generateSimulatedVital();
      records.push({
        ...simulated,
        user_id: user.id,
        recorded_at: new Date(now - i * 5 * 60 * 1000).toISOString(),
      });
    }

    await supabase.from("vitals").insert(records);
    await fetchVitals();
    setGenerating(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-xl text-gray-500">데이터를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">생체 데이터</h1>
          <p className="text-lg text-gray-500 mt-1">시간별 생체 신호 추이</p>
        </div>
        <button
          onClick={generateBatchData}
          disabled={generating}
          className="px-5 py-3 bg-blue-600 text-white text-lg font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {generating ? "생성 중..." : "테스트 데이터 10건 생성"}
        </button>
      </div>

      {vitals.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <p className="text-5xl mb-4">📊</p>
          <p className="text-xl text-gray-600 mb-2">차트를 표시할 데이터가 없습니다</p>
          <p className="text-lg text-gray-400">
            테스트 데이터를 생성하거나 대시보드에서 시뮬레이션을 실행하세요
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <HeartRateChart data={vitals} />
          <BloodPressureChart data={vitals} />
          <SpO2Chart data={vitals} />

          {/* 데이터 테이블 */}
          <div className="bg-white rounded-2xl p-6 border overflow-x-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">📋 최근 측정 기록</h3>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="pb-3 pr-4">시간</th>
                  <th className="pb-3 pr-4">심박수</th>
                  <th className="pb-3 pr-4">혈압</th>
                  <th className="pb-3 pr-4">SpO2</th>
                  <th className="pb-3">부정맥</th>
                </tr>
              </thead>
              <tbody>
                {vitals.slice(0, 10).map((v) => (
                  <tr key={v.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 text-gray-600">
                      {new Date(v.recorded_at).toLocaleString("ko-KR", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 pr-4 font-medium">
                      {v.heart_rate ?? "-"} bpm
                    </td>
                    <td className="py-3 pr-4 font-medium">
                      {v.systolic_bp ?? "-"}/{v.diastolic_bp ?? "-"} mmHg
                    </td>
                    <td className="py-3 pr-4 font-medium">
                      {v.spo2 ? Number(v.spo2).toFixed(1) : "-"}%
                    </td>
                    <td className="py-3">
                      {v.arrhythmia_detected ? (
                        <span className="text-red-600 font-bold">감지</span>
                      ) : (
                        <span className="text-green-600">정상</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
