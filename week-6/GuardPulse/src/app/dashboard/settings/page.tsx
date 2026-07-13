"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_THRESHOLDS, VITAL_LABELS, VITAL_UNITS } from "@/lib/constants";

interface ThresholdConfig {
  vital_type: string;
  caution_min: number;
  caution_max: number;
  warning_min: number;
  warning_max: number;
  danger_min: number;
  danger_max: number;
}

const VITAL_TYPES = ["heart_rate", "systolic_bp", "diastolic_bp", "spo2"] as const;

export default function SettingsPage() {
  const [thresholds, setThresholds] = useState<ThresholdConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const supabase = createClient();

  useEffect(() => {
    loadThresholds();
  }, []);

  async function loadThresholds() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("alert_thresholds")
      .select("*")
      .eq("user_id", user.id);

    // 저장된 값이 있으면 사용, 없으면 기본값
    const configs: ThresholdConfig[] = VITAL_TYPES.map((type) => {
      const saved = data?.find((d) => d.vital_type === type);
      if (saved) {
        return {
          vital_type: type,
          caution_min: Number(saved.caution_min),
          caution_max: Number(saved.caution_max),
          warning_min: Number(saved.warning_min),
          warning_max: Number(saved.warning_max),
          danger_min: Number(saved.danger_min),
          danger_max: Number(saved.danger_max),
        };
      }
      const defaults = DEFAULT_THRESHOLDS[type];
      return {
        vital_type: type,
        caution_min: defaults.caution.min,
        caution_max: defaults.caution.max,
        warning_min: defaults.warning.min,
        warning_max: defaults.warning.max,
        danger_min: defaults.danger.min,
        danger_max: defaults.danger.max,
      };
    });

    setThresholds(configs);
    setLoading(false);
  }

  function updateThreshold(index: number, field: keyof ThresholdConfig, value: number) {
    setThresholds((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t))
    );
  }

  async function saveThresholds() {
    setSaving(true);
    setMessage("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    for (const threshold of thresholds) {
      await supabase
        .from("alert_thresholds")
        .upsert(
          {
            user_id: user.id,
            vital_type: threshold.vital_type,
            caution_min: threshold.caution_min,
            caution_max: threshold.caution_max,
            warning_min: threshold.warning_min,
            warning_max: threshold.warning_max,
            danger_min: threshold.danger_min,
            danger_max: threshold.danger_max,
          },
          { onConflict: "user_id,vital_type" }
        );
    }

    setMessage("설정이 저장되었습니다!");
    setSaving(false);
    setTimeout(() => setMessage(""), 3000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-xl text-gray-500">설정을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">위험 기준값 설정</h1>
        <p className="text-lg text-gray-500 mt-1">
          각 생체 항목별 주의/경고/위험 범위를 설정합니다
        </p>
      </div>

      {message && (
        <div className="bg-green-50 text-green-700 p-4 rounded-xl mb-6 text-lg font-medium">
          ✅ {message}
        </div>
      )}

      <div className="space-y-6">
        {thresholds.map((threshold, index) => {
          const type = threshold.vital_type as keyof typeof VITAL_LABELS;
          const unit = VITAL_UNITS[type as keyof typeof VITAL_UNITS] ?? "";

          return (
            <div key={threshold.vital_type} className="bg-white rounded-2xl border p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {VITAL_LABELS[type]} ({unit})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 주의 */}
                <div className="bg-yellow-50 rounded-xl p-4">
                  <p className="text-sm font-bold text-yellow-700 mb-3">⚠️ 주의 범위</p>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      value={threshold.caution_min}
                      onChange={(e) => updateThreshold(index, "caution_min", Number(e.target.value))}
                      className="w-20 px-2 py-2 text-center border rounded-lg"
                    />
                    <span className="text-gray-500">~</span>
                    <input
                      type="number"
                      value={threshold.caution_max}
                      onChange={(e) => updateThreshold(index, "caution_max", Number(e.target.value))}
                      className="w-20 px-2 py-2 text-center border rounded-lg"
                    />
                  </div>
                </div>

                {/* 경고 */}
                <div className="bg-orange-50 rounded-xl p-4">
                  <p className="text-sm font-bold text-orange-700 mb-3">🔶 경고 범위</p>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      value={threshold.warning_min}
                      onChange={(e) => updateThreshold(index, "warning_min", Number(e.target.value))}
                      className="w-20 px-2 py-2 text-center border rounded-lg"
                    />
                    <span className="text-gray-500">~</span>
                    <input
                      type="number"
                      value={threshold.warning_max}
                      onChange={(e) => updateThreshold(index, "warning_max", Number(e.target.value))}
                      className="w-20 px-2 py-2 text-center border rounded-lg"
                    />
                  </div>
                </div>

                {/* 위험 */}
                <div className="bg-red-50 rounded-xl p-4">
                  <p className="text-sm font-bold text-red-700 mb-3">🚨 위험 범위</p>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      value={threshold.danger_min}
                      onChange={(e) => updateThreshold(index, "danger_min", Number(e.target.value))}
                      className="w-20 px-2 py-2 text-center border rounded-lg"
                    />
                    <span className="text-gray-500">~</span>
                    <input
                      type="number"
                      value={threshold.danger_max}
                      onChange={(e) => updateThreshold(index, "danger_max", Number(e.target.value))}
                      className="w-20 px-2 py-2 text-center border rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-400 mt-3">
                * 범위 안이면 정상, 범위 밖이면 해당 등급의 알림이 발생합니다
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={saveThresholds}
          disabled={saving}
          className="px-8 py-4 bg-rose-600 text-white text-xl font-semibold rounded-xl hover:bg-rose-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "저장 중..." : "설정 저장"}
        </button>
      </div>
    </div>
  );
}
