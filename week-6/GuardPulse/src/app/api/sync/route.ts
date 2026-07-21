import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// 이 라우트는 항상 요청 시점에 실행 (캐시 금지)
export const dynamic = "force-dynamic";

const PARTICIPANT_CODE = "SELF-001";

interface StepRow {
  recorded_at: string;
  step_count: number;
}
interface HeartRateRow {
  recorded_at: string;
  bpm: number;
}
interface SleepRow {
  recorded_at: string;
  duration_minutes: number;
  sleep_start?: string;
  sleep_end?: string;
}

// Bearer 토큰 검증. 유효하면 true.
function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.SYNC_API_KEY;
  if (!expected) return false; // 키 미설정 시 무조건 거부(안전)
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return false;
  return match[1] === expected;
}

// POST /api/sync : 동기화 앱이 걸음수/심박/수면 배치를 업로드
export async function POST(request: NextRequest) {
  // 1) 인증
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  // 2) 바디 파싱
  let body: {
    participant_code?: string;
    steps?: StepRow[];
    heartrate?: HeartRateRow[];
    sleep?: SleepRow[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "잘못된 JSON 본문입니다." },
      { status: 400 }
    );
  }

  // 지금은 SELF-001 고정. 다른 코드가 오면 명시적으로 거부.
  const participant = body.participant_code ?? PARTICIPANT_CODE;
  if (participant !== PARTICIPANT_CODE) {
    return NextResponse.json(
      { ok: false, error: `지원하지 않는 participant_code: ${participant}` },
      { status: 400 }
    );
  }

  const steps = Array.isArray(body.steps) ? body.steps : [];
  const heartrate = Array.isArray(body.heartrate) ? body.heartrate : [];
  const sleep = Array.isArray(body.sleep) ? body.sleep : [];

  const supabase = createAdminClient();
  const inserted = { steps: 0, heartrate: 0, sleep: 0 };

  try {
    // 3) upsert (participant_code + recorded_at 중복 시 덮어쓰기)
    if (steps.length > 0) {
      const rows = steps.map((s) => ({
        participant_code: PARTICIPANT_CODE,
        step_count: s.step_count,
        recorded_at: s.recorded_at,
        synced_at: new Date().toISOString(),
      }));
      const { error, count } = await supabase
        .from("vitals_steps")
        .upsert(rows, {
          onConflict: "participant_code,recorded_at",
          count: "exact",
        });
      if (error) throw error;
      inserted.steps = count ?? rows.length;
    }

    if (heartrate.length > 0) {
      const rows = heartrate.map((h) => ({
        participant_code: PARTICIPANT_CODE,
        bpm: h.bpm,
        recorded_at: h.recorded_at,
        synced_at: new Date().toISOString(),
      }));
      const { error, count } = await supabase
        .from("vitals_heartrate")
        .upsert(rows, {
          onConflict: "participant_code,recorded_at",
          count: "exact",
        });
      if (error) throw error;
      inserted.heartrate = count ?? rows.length;
    }

    if (sleep.length > 0) {
      const rows = sleep.map((s) => ({
        participant_code: PARTICIPANT_CODE,
        duration_minutes: s.duration_minutes,
        sleep_start: s.sleep_start ?? null,
        sleep_end: s.sleep_end ?? null,
        recorded_at: s.recorded_at,
        synced_at: new Date().toISOString(),
      }));
      const { error, count } = await supabase
        .from("vitals_sleep")
        .upsert(rows, {
          onConflict: "participant_code,recorded_at",
          count: "exact",
        });
      if (error) throw error;
      inserted.sleep = count ?? rows.length;
    }

    // 4) 성공 로그 기록
    const { data: logRow } = await supabase
      .from("sync_log")
      .insert({
        participant_code: PARTICIPANT_CODE,
        status: "success",
        steps_count: inserted.steps,
        heartrate_count: inserted.heartrate,
        sleep_count: inserted.sleep,
      })
      .select("id")
      .single();

    return NextResponse.json({
      ok: true,
      inserted,
      sync_log_id: logRow?.id ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    // 5) 실패 로그 기록 (실패해도 로그 시도)
    await supabase.from("sync_log").insert({
      participant_code: PARTICIPANT_CODE,
      status: "failed",
      steps_count: inserted.steps,
      heartrate_count: inserted.heartrate,
      sleep_count: inserted.sleep,
      error_message: message.slice(0, 500),
    });

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
