"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface NotificationEntry {
  id: string;
  channel: string;
  status: string;
  sent_at: string | null;
  created_at: string;
  alert: {
    alert_level: string;
    vital_type: string;
    message: string;
  } | null;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    const res = await fetch("/api/notifications?limit=30");
    if (res.ok) {
      const data = await res.json();
      setNotifications(data);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-xl text-gray-500">불러오는 중...</p>
      </div>
    );
  }

  const channelLabels: Record<string, string> = {
    in_app: "앱 내 알림",
    sms: "SMS",
    push: "푸시 알림",
  };

  const channelIcons: Record<string, string> = {
    in_app: "📱",
    sms: "💬",
    push: "🔔",
  };

  const statusStyles: Record<string, string> = {
    sent: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    failed: "bg-red-100 text-red-700",
  };

  const statusLabels: Record<string, string> = {
    sent: "전송 완료",
    pending: "대기 중",
    failed: "실패",
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">알림 발송 이력</h1>
        <p className="text-lg text-gray-500 mt-1">
          보호자에게 전송된 알림 기록입니다
        </p>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <p className="text-5xl mb-4">📭</p>
          <p className="text-xl text-gray-600">발송된 알림이 없습니다</p>
          <p className="text-lg text-gray-400 mt-2">
            위험 상황 발생 시 보호자에게 자동으로 알림이 전송됩니다
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="flex items-center justify-between p-4 bg-white border rounded-xl"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {channelIcons[n.channel] ?? "📨"}
                </span>
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    {channelLabels[n.channel] ?? n.channel}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {n.alert?.message ?? "알림 내용 없음"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-right">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    statusStyles[n.status] ?? ""
                  }`}
                >
                  {statusLabels[n.status] ?? n.status}
                </span>
                <span className="text-sm text-gray-400">
                  {new Date(n.created_at).toLocaleString("ko-KR", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
