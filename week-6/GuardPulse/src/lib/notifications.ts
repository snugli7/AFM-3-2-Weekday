import { ALERT_LEVEL_LABELS, VITAL_LABELS } from "./constants";

// 알림 메시지 생성
export function buildNotificationMessage(alert: {
  alert_level: string;
  vital_type: string;
  value: number;
  message?: string;
}, wearerName: string) {
  const level = ALERT_LEVEL_LABELS[alert.alert_level as keyof typeof ALERT_LEVEL_LABELS] ?? alert.alert_level;
  const vital = VITAL_LABELS[alert.vital_type as keyof typeof VITAL_LABELS] ?? alert.vital_type;

  return {
    title: `[${level}] ${wearerName}님 건강 이상 감지`,
    body: alert.message ?? `${vital}: ${alert.value} — 즉시 확인이 필요합니다.`,
  };
}

// SMS 전송 (Twilio)
export async function sendSMS(to: string, message: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.log("[SMS] Twilio not configured, skipping SMS send");
    return false;
  }

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: to,
          From: fromNumber,
          Body: message,
        }),
      }
    );

    if (!res.ok) {
      console.error("[SMS] Failed:", await res.text());
      return false;
    }

    return true;
  } catch (err) {
    console.error("[SMS] Error:", err);
    return false;
  }
}

// FCM 푸시 알림 전송
export async function sendPushNotification(
  fcmToken: string,
  title: string,
  body: string
): Promise<boolean> {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.log("[FCM] Firebase not configured, skipping push send");
    return false;
  }

  // FCM HTTP v1 API 사용 시 OAuth2 토큰 필요
  // MVP 단계에서는 설정 여부만 체크하고 로그 처리
  console.log(`[FCM] Would send to token: ${fcmToken.substring(0, 20)}...`);
  console.log(`[FCM] Title: ${title}`);
  console.log(`[FCM] Body: ${body}`);

  return true;
}

// 인앱 알림 (DB에 기록)
export async function createInAppNotification(
  supabase: any,
  alertId: string,
  recipientId: string
) {
  const { error } = await supabase.from("notification_log").insert({
    alert_id: alertId,
    recipient_id: recipientId,
    channel: "in_app",
    status: "sent",
    sent_at: new Date().toISOString(),
  });

  return !error;
}
