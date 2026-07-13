"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Alert } from "@/types/vitals";

interface UseRealtimeAlertsOptions {
  userId: string | null;
  onNewAlert: (alert: Alert) => void;
}

export function useRealtimeAlerts({ userId, onNewAlert }: UseRealtimeAlertsOptions) {
  const callbackRef = useRef(onNewAlert);
  callbackRef.current = onNewAlert;

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    const channel = supabase
      .channel("alerts-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "alerts",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callbackRef.current(payload.new as Alert);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
}
