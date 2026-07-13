import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  buildNotificationMessage,
  sendSMS,
  sendPushNotification,
  createInAppNotification,
} from "@/lib/notifications";

// POST: 알림 발생 시 연결된 보호자들에게 전달
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { alert_id } = body;

  if (!alert_id) {
    return NextResponse.json({ error: "alert_id is required" }, { status: 400 });
  }

  // 알림 정보 조회
  const { data: alert, error: alertError } = await supabase
    .from("alerts")
    .select("*")
    .eq("id", alert_id)
    .single();

  if (alertError || !alert) {
    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  }

  // 착용자 이름 조회
  const { data: wearer } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", alert.user_id)
    .single();

  const wearerName = wearer?.name ?? "사용자";

  // 연결된 보호자들 조회
  const { data: connections } = await supabase
    .from("family_connections")
    .select(`
      guardian_id,
      guardian:profiles!family_connections_guardian_id_fkey(id, name, phone)
    `)
    .eq("wearer_id", alert.user_id)
    .eq("status", "accepted");

  if (!connections || connections.length === 0) {
    return NextResponse.json({
      sent: false,
      reason: "No connected guardians",
    });
  }

  const { title, body: messageBody } = buildNotificationMessage(alert, wearerName);
  const results = [];

  for (const conn of connections) {
    const guardian = conn.guardian as any;
    const guardianId = conn.guardian_id;

    // 1. 인앱 알림
    const inAppSuccess = await createInAppNotification(supabase, alert_id, guardianId);
    results.push({ guardian_id: guardianId, channel: "in_app", success: inAppSuccess });

    // 2. SMS 알림 (전화번호가 있는 경우)
    if (guardian?.phone) {
      const smsMessage = `[GuardPulse] ${title}\n${messageBody}`;
      const smsSuccess = await sendSMS(guardian.phone, smsMessage);

      await supabase.from("notification_log").insert({
        alert_id,
        recipient_id: guardianId,
        channel: "sms",
        status: smsSuccess ? "sent" : "failed",
        sent_at: smsSuccess ? new Date().toISOString() : null,
      });

      results.push({ guardian_id: guardianId, channel: "sms", success: smsSuccess });
    }

    // 3. 푸시 알림 (FCM 토큰이 있는 경우 - 향후 구현)
    // TODO: profiles 테이블에 fcm_token 필드 추가 후 활성화
  }

  return NextResponse.json({
    sent: true,
    alert_id,
    recipients: connections.length,
    results,
  });
}

// GET: 알림 발송 이력 조회
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") ?? "20");

  const { data, error } = await supabase
    .from("notification_log")
    .select(`
      *,
      alert:alerts(alert_level, vital_type, message)
    `)
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
