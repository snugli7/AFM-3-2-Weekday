"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { VitalData } from "@/types/vitals";

interface UseRealtimeVitalsOptions {
  userId: string | null;
  onNewVital: (vital: VitalData) => void;
}

export function useRealtimeVitals({ userId, onNewVital }: UseRealtimeVitalsOptions) {
  const callbackRef = useRef(onNewVital);
  callbackRef.current = onNewVital;

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    const channel = supabase
      .channel("vitals-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "vitals",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callbackRef.current(payload.new as VitalData);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
}
