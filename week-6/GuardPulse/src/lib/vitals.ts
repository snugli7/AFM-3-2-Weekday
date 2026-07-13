import { DEFAULT_THRESHOLDS } from "./constants";
import type { AlertLevel, VitalData } from "@/types/vitals";

type ThresholdKey = keyof typeof DEFAULT_THRESHOLDS;

export function getAlertLevel(
  vitalType: ThresholdKey,
  value: number | null
): AlertLevel {
  if (value === null) return "normal";

  const thresholds = DEFAULT_THRESHOLDS[vitalType];
  if (!thresholds) return "normal";

  if (value < thresholds.danger.min || value > thresholds.danger.max)
    return "danger";
  if (value < thresholds.warning.min || value > thresholds.warning.max)
    return "warning";
  if (value < thresholds.caution.min || value > thresholds.caution.max)
    return "caution";

  return "normal";
}

export function getOverallAlertLevel(vital: VitalData): AlertLevel {
  const levels: AlertLevel[] = [
    getAlertLevel("heart_rate", vital.heart_rate),
    getAlertLevel("systolic_bp", vital.systolic_bp),
    getAlertLevel("diastolic_bp", vital.diastolic_bp),
    getAlertLevel("spo2", vital.spo2),
  ];

  if (vital.arrhythmia_detected) return "danger";
  if (levels.includes("danger")) return "danger";
  if (levels.includes("warning")) return "warning";
  if (levels.includes("caution")) return "caution";
  return "normal";
}

// MVP용 시뮬레이션 데이터 생성
export function generateSimulatedVital(): Omit<VitalData, "id" | "user_id" | "created_at"> {
  return {
    heart_rate: Math.round(60 + Math.random() * 40),
    systolic_bp: Math.round(110 + Math.random() * 30),
    diastolic_bp: Math.round(65 + Math.random() * 20),
    spo2: Math.round((95 + Math.random() * 5) * 100) / 100,
    temperature: Math.round((36 + Math.random() * 1.5) * 10) / 10,
    arrhythmia_detected: Math.random() < 0.05,
    recorded_at: new Date().toISOString(),
  };
}
