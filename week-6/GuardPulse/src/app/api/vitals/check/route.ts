import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_THRESHOLDS } from "@/lib/constants";
import type { AlertLevel } from "@/types/vitals";

interface ThresholdRange {
  min: number;
  max: number;
}

function checkVitalLevel(
  value: number | null,
  thresholds: { caution: ThresholdRange; warning: ThresholdRange; danger: ThresholdRange }
): AlertLevel {
  if (value === null) return "normal";
  if (value < thresholds.danger.min || value > thresholds.danger.max) return "danger";
  if (value < thresholds.warning.min || value > thresholds.warning.max) return "warning";
  if (value < thresholds.caution.min || value > thresholds.caution.max) return "caution";
  return "normal";
}

// POST: 생체 데이터를 받아 위험 감지 후 알림 생성
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { vital_id } = body;

  // 해당 vital 데이터 조회
  const { data: vital, error: vitalError } = await supabase
    .from("vitals")
    .select("*")
    .eq("id", vital_id)
    .single();

  if (vitalError || !vital) {
    return NextResponse.json({ error: "Vital not found" }, { status: 404 });
  }

  // 사용자별 커스텀 임계값 조회 (없으면 기본값 사용)
  const { data: customThresholds } = await supabase
    .from("alert_thresholds")
    .select("*")
    .eq("user_id", user.id);

  const getThreshold = (vitalType: string) => {
    const custom = customThresholds?.find((t) => t.vital_type === vitalType);
    if (custom) {
      return {
        caution: { min: Number(custom.caution_min), max: Number(custom.caution_max) },
        warning: { min: Number(custom.warning_min), max: Number(custom.warning_max) },
        danger: { min: Number(custom.danger_min), max: Number(custom.danger_max) },
      };
    }
    return DEFAULT_THRESHOLDS[vitalType as keyof typeof DEFAULT_THRESHOLDS] ?? null;
  };

  const alertsToCreate: Array<{
    user_id: string;
    vital_id: string;
    vital_type: string;
    alert_level: string;
    value: number;
    message: string;
  }> = [];

  // 각 생체 항목 체크
  const checks = [
    { type: "heart_rate", value: vital.heart_rate, label: "심박수", unit: "bpm" },
    { type: "systolic_bp", value: vital.systolic_bp, label: "수축기 혈압", unit: "mmHg" },
    { type: "diastolic_bp", value: vital.diastolic_bp, label: "이완기 혈압", unit: "mmHg" },
    { type: "spo2", value: vital.spo2 ? Number(vital.spo2) : null, label: "산소포화도", unit: "%" },
  ];

  for (const check of checks) {
    const threshold = getThreshold(check.type);
    if (!threshold) continue;

    const level = checkVitalLevel(check.value, threshold);
    if (level !== "normal") {
      const levelLabel = level === "danger" ? "위험" : level === "warning" ? "경고" : "주의";
      alertsToCreate.push({
        user_id: user.id,
        vital_id: vital.id,
        vital_type: check.type,
        alert_level: level,
        value: check.value!,
        message: `${check.label} ${levelLabel}: ${check.value}${check.unit} (정상 범위 초과)`,
      });
    }
  }

  // 부정맥 감지
  if (vital.arrhythmia_detected) {
    alertsToCreate.push({
      user_id: user.id,
      vital_id: vital.id,
      vital_type: "arrhythmia",
      alert_level: "danger",
      value: 1,
      message: "부정맥이 감지되었습니다! 즉시 확인이 필요합니다.",
    });
  }

  // 알림 생성
  let createdAlerts: unknown[] = [];
  if (alertsToCreate.length > 0) {
    const { data } = await supabase
      .from("alerts")
      .insert(alertsToCreate)
      .select();
    createdAlerts = data ?? [];

    // 보호자에게 알림 발송 (warning/danger 등급만)
    for (const alert of (data ?? []) as any[]) {
      if (alert.alert_level === "warning" || alert.alert_level === "danger") {
        await notifyGuardians(supabase, alert);
      }
    }
  }

  return NextResponse.json({
    checked: true,
    alerts_created: createdAlerts.length,
    alerts: createdAlerts,
  });
}

async function notifyGuardians(supabase: any, alert: any) {
  // 착용자 이름 조회
  const { data: wearer } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", alert.user_id)
    .single();

  const wearerName = wearer?.name ?? "사용자";

  // 연결된 보호자 조회
  const { data: connections } = await supabase
    .from("family_connections")
    .select("guardian_id, guardian:profiles!family_connections_guardian_id_fkey(phone)")
    .eq("wearer_id", alert.user_id)
    .eq("status", "accepted");

  if (!connections || connections.length === 0) return;

  const { buildNotificationMessage, sendSMS, createInAppNotification } = await import("@/lib/notifications");
  const { title, body } = buildNotificationMessage(alert, wearerName);

  for (const conn of connections) {
    // 인앱 알림
    await createInAppNotification(supabase, alert.id, conn.guardian_id);

    // SMS (전화번호 있을 때)
    const guardian = conn.guardian as any;
    if (guardian?.phone) {
      const smsSuccess = await sendSMS(guardian.phone, `[GuardPulse] ${title}\n${body}`);
      await supabase.from("notification_log").insert({
        alert_id: alert.id,
        recipient_id: conn.guardian_id,
        channel: "sms",
        status: smsSuccess ? "sent" : "failed",
        sent_at: smsSuccess ? new Date().toISOString() : null,
      });
    }
  }
}
