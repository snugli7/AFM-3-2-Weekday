// 기본 위험 임계값 (사용자가 커스텀 가능)
export const DEFAULT_THRESHOLDS = {
  heart_rate: {
    caution: { min: 55, max: 95 },
    warning: { min: 50, max: 110 },
    danger: { min: 40, max: 130 },
  },
  systolic_bp: {
    caution: { min: 100, max: 135 },
    warning: { min: 90, max: 150 },
    danger: { min: 80, max: 180 },
  },
  diastolic_bp: {
    caution: { min: 65, max: 85 },
    warning: { min: 60, max: 95 },
    danger: { min: 50, max: 110 },
  },
  spo2: {
    caution: { min: 94, max: 100 },
    warning: { min: 90, max: 100 },
    danger: { min: 85, max: 100 },
  },
} as const;

export const ALERT_LEVEL_COLORS = {
  normal: "#22c55e",
  caution: "#eab308",
  warning: "#f97316",
  danger: "#ef4444",
} as const;

export const ALERT_LEVEL_LABELS = {
  normal: "정상",
  caution: "주의",
  warning: "경고",
  danger: "위험",
} as const;

export const VITAL_LABELS = {
  heart_rate: "심박수",
  systolic_bp: "수축기 혈압",
  diastolic_bp: "이완기 혈압",
  spo2: "산소포화도",
  temperature: "체온",
  arrhythmia_detected: "부정맥",
} as const;

export const VITAL_UNITS = {
  heart_rate: "bpm",
  systolic_bp: "mmHg",
  diastolic_bp: "mmHg",
  spo2: "%",
  temperature: "°C",
} as const;
