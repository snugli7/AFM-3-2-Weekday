export type AlertLevel = "normal" | "caution" | "warning" | "danger";

export interface VitalData {
  id: string;
  user_id: string;
  heart_rate: number | null;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  spo2: number | null;
  temperature: number | null;
  arrhythmia_detected: boolean;
  recorded_at: string;
  created_at: string;
}

export interface AlertThreshold {
  id: string;
  user_id: string;
  vital_type: string;
  caution_min: number;
  caution_max: number;
  warning_min: number;
  warning_max: number;
  danger_min: number;
  danger_max: number;
}

export interface Alert {
  id: string;
  user_id: string;
  vital_type: string;
  alert_level: AlertLevel;
  value: number;
  message: string;
  acknowledged: boolean;
  created_at: string;
}
