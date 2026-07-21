"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { VitalCard } from "@/components/dashboard/VitalCard";
import { HeartRateChart } from "@/components/charts/HeartRateChart";
import type { VitalData } from "@/types/vitals";

const PARTICIPANT_CODE = "SELF-001";
const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

interface StepRow {
  step_count: number;
  recorded_at: string;
  synced_at: string;
}
interface HeartRateRow {
  bpm: number;
  recorded_at: string;
  synced_at: string;
}
interface SleepRow {
  duration_minutes: number;
  recorded_at: string;
  synced_at: string;
}

// 로컬(한국시간) 날짜 키 "YYYY-MM-DD"
function localDateKey(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE"); // sv-SE → YYYY-MM-DD
}

export default function SelfDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [todaySteps, setTodaySteps] = useState(0);
  const [weekAvgSteps, setWeekAvgSteps] = useState(0);
  const [heartRates, setHeartRates] = useState<HeartRateRow[]>([]);
  const [sleepMinutes, setSleepMinutes] = useState<number | null>(null);
  const [lastReceived, setLastReceived] = useState<string | null>(null);

  useEffect(() => {
    void fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const supabase = createClient();

    const now = Date.now();
    const since8d = new Date(now - 8 * MS_PER_DAY).toISOString();
    const since24h = new Date(now - 24 * MS_PER_HOUR).toISOString();

    const [stepsRes, hrRes, sleepRes, logRes] = await Promise.all([
      supabase
        .from("vitals_steps")
        .select("step_count, recorded_at, synced_at")
        .eq("participant_code", PARTICIPANT_CODE)
        .gte("recorded_at", since8d)
        .order("recorded_at", { ascending: true }),
      supabase
        .from("vitals_heartrate")
        .select("bpm, recorded_at, synced_at")
        .eq("participant_code", PARTICIPANT_CODE)
        .gte("recorded_at", since24h)
        .order("recorded_at", { ascending: false })
        .limit(1000),
      supabase
        .from("vitals_sleep")
        .select("duration_minutes, recorded_at, synced_at")
        .eq("participant_code", PARTICIPANT_CODE)
        .order("recorded_at", { ascending: false })
        .limit(1),
      supabase
        .from("sync_log")
        .select("synced_at")
        .eq("participant_code", PARTICIPANT_CODE)
        .order("synced_at", { ascending: false })
        .limit(1),
    ]);

    // --- 걸음수: 날짜별 합계 → 오늘 / 최근 7일(오늘 제외) 평균 ---
    const steps = (stepsRes.data ?? []) as StepRow[];
    const dailyTotals = new Map<string, number>();
    for (const s of steps) {
      const key = localDateKey(s.recorded_at);
      dailyTotals.set(key, (dailyTotals.get(key) ?? 0) + s.step_count);
    }
    const todayKey = new Date().toLocaleDateString("sv-SE");
    setTodaySteps(dailyTotals.get(todayKey) ?? 0);

    // 오늘을 제외한 최근 7일 평균 (데이터가 있는 날만 평균에 반영)
    const pastDays: number[] = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date(now - i * MS_PER_DAY).toLocaleDateString("sv-SE");
      if (dailyTotals.has(d)) pastDays.push(dailyTotals.get(d)!);
    }
    const avg =
      pastDays.length > 0
        ? Math.round(pastDays.reduce((a, b) => a + b, 0) / pastDays.length)
        : 0;
    setWeekAvgSteps(avg);

    // --- 심박 ---
    setHeartRates((hrRes.data ?? []) as HeartRateRow[]);

    // --- 수면 ---
    const sleep = (sleepRes.data ?? []) as SleepRow[];
    setSleepMinutes(sleep.length > 0 ? sleep[0].duration_minutes : null);

    // --- 마지막 수신 시각: sync_log 우선, 없으면 데이터의 synced_at 최대값 ---
    let latest: string | null = logRes.data?.[0]?.synced_at ?? null;
    const allSynced = [
      ...steps.map((s) => s.synced_at),
      ...(hrRes.data ?? []).map((h: HeartRateRow) => h.synced_at),
      ...sleep.map((s) => s.synced_at),
    ];
    for (const t of allSynced) {
      if (!latest || new Date(t) > new Date(latest)) latest = t;
    }
    setLastReceived(latest);

    setLoading(false);
  }

  // ---- 파생 값 & 알림 규칙 ----
  const hoursSinceReceived = lastReceived
    ? (Date.now() - new Date(lastReceived).getTime()) / MS_PER_HOUR
    : Infinity;

  // (a) 6시간 이상 미수신
  const noDataAlert = hoursSinceReceived >= 6;
  // (b) 최근 7일 평균 대비 오늘 걸음수 50% 미만 (평균이 있을 때만)
  const lowActivityAlert = weekAvgSteps > 0 && todaySteps < weekAvgSteps * 0.5;

  const sleepHours =
    sleepMinutes !== null ? Math.floor(sleepMinutes / 60) : null;
  const sleepMins = sleepMinutes !== null ? sleepMinutes % 60 : null;

  // HeartRateChart 는 {recorded_at, heart_rate} 만 사용하므로 매핑 후 캐스팅
  const hrChartData = heartRates.map((h) => ({
    recorded_at: h.recorded_at,
    heart_rate: h.bpm,
  })) as unknown as VitalData[];

  const latestBpm = heartRates.length > 0 ? heartRates[0].bpm : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-xl text-gray-500">데이터를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">내 건강 모니터링</h1>
        <p className="text-lg text-gray-500 mt-1">
          참가자 <span className="font-mono">{PARTICIPANT_CODE}</span> · 자가 테스트
        </p>
      </div>

      {/* 확인 알림 배지 */}
      {(noDataAlert || lowActivityAlert) && (
        <div className="flex flex-wrap gap-3 mb-6">
          {noDataAlert && (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 border border-red-200 text-red-700 font-bold">
              ⚠️ 데이터 미수신 - 기기 확인 필요
            </span>
          )}
          {lowActivityAlert && (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 font-bold">
              🚶 활동량 확인 필요
            </span>
          )}
        </div>
      )}

      {/* 카드 3종 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <VitalCard
          label="오늘 걸음수"
          value={todaySteps}
          unit="걸음"
          icon="🚶"
          alertLevel={lowActivityAlert ? "warning" : "normal"}
        />
        <VitalCard
          label="현재 심박수"
          value={latestBpm}
          unit="bpm"
          icon="💓"
          alertLevel="normal"
        />
        <VitalCard
          label="어젯밤 수면"
          value={sleepHours}
          unit={sleepHours !== null ? `시간 ${sleepMins}분` : "시간"}
          icon="😴"
          alertLevel="normal"
        />
      </div>

      {/* 심박 추이 그래프 (최근 24시간) */}
      <div className="mb-8">
        {hrChartData.length > 0 ? (
          <HeartRateChart data={hrChartData} />
        ) : (
          <div className="bg-white rounded-2xl p-6 border text-center text-gray-400">
            최근 24시간 심박 데이터가 없습니다.
          </div>
        )}
      </div>

      {/* 부가 정보 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-base">
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-gray-500 mb-1">최근 7일 평균 걸음수</p>
          <p className="text-2xl font-bold text-gray-900">
            {weekAvgSteps > 0 ? weekAvgSteps.toLocaleString() : "--"}
            <span className="text-base text-gray-500 ml-1">걸음</span>
          </p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-gray-500 mb-1">마지막 데이터 수신</p>
          <p className="text-2xl font-bold text-gray-900">
            {lastReceived
              ? new Date(lastReceived).toLocaleString("ko-KR")
              : "수신 기록 없음"}
          </p>
          {lastReceived && (
            <p className="text-sm text-gray-400 mt-1">
              약 {Math.floor(hoursSinceReceived)}시간 전
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
