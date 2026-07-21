// =============================================
// GuardPulse 자가 모니터링 테스트용 시드 데이터
//
// 실행: node scripts/seed-self-data.mjs
//
// - .env.local 에서 Supabase URL / service_role 키를 읽습니다.
//   (비밀번호를 코드에 넣지 않습니다)
// - SELF-001 참가자에게 최근 8일 걸음수 / 24시간 심박 / 7일 수면 데이터를
//   생성해 upsert 합니다. 여러 번 실행해도 중복되지 않습니다.
// =============================================
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

// --- .env.local 간단 파서 ---
function loadEnv(path) {
  const env = {};
  let text;
  try {
    text = readFileSync(path, "utf-8");
  } catch {
    return env;
  }
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

const env = loadEnv(".env.local");
const SUPABASE_URL =
  env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY =
  env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "❌ .env.local 에 NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 필요합니다."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const PARTICIPANT = "SELF-001";
const MS_HOUR = 60 * 60 * 1000;
const MS_DAY = 24 * MS_HOUR;
const now = Date.now();
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// --- 1) 걸음수: 최근 8일, 매일 07~22시 시간별 버킷 ---
const stepRows = [];
for (let day = 0; day < 8; day++) {
  const dayStart = new Date(now - day * MS_DAY);
  dayStart.setHours(0, 0, 0, 0);
  const maxHour = day === 0 ? new Date(now).getHours() : 22;
  for (let h = 7; h <= Math.min(maxHour, 22); h++) {
    const t = new Date(dayStart.getTime() + h * MS_HOUR);
    stepRows.push({
      participant_code: PARTICIPANT,
      step_count: rand(100, 900),
      recorded_at: t.toISOString(),
      synced_at: new Date().toISOString(),
    });
  }
}

// --- 2) 심박: 최근 24시간, 10분 간격 ---
const hrRows = [];
for (let m = 0; m <= 24 * 6; m++) {
  const t = new Date(now - m * 10 * 60 * 1000);
  hrRows.push({
    participant_code: PARTICIPANT,
    bpm: rand(58, 92),
    recorded_at: t.toISOString(),
    synced_at: new Date().toISOString(),
  });
}

// --- 3) 수면: 최근 7일 밤, 00:30 시작 ~ 6~8시간 ---
const sleepRows = [];
for (let day = 1; day <= 7; day++) {
  const night = new Date(now - day * MS_DAY);
  night.setHours(0, 30, 0, 0);
  const duration = rand(360, 480); // 6~8시간(분)
  const end = new Date(night.getTime() + duration * 60 * 1000);
  sleepRows.push({
    participant_code: PARTICIPANT,
    duration_minutes: duration,
    sleep_start: night.toISOString(),
    sleep_end: end.toISOString(),
    recorded_at: night.toISOString(),
    synced_at: new Date().toISOString(),
  });
}

async function upsert(table, rows) {
  const { error, count } = await supabase
    .from(table)
    .upsert(rows, {
      onConflict: "participant_code,recorded_at",
      count: "exact",
    });
  if (error) {
    console.error(`❌ ${table} 실패:`, error.message);
    process.exit(1);
  }
  console.log(`✅ ${table}: ${count ?? rows.length}건 upsert`);
}

console.log("시드 데이터 업로드 시작...");
await upsert("vitals_steps", stepRows);
await upsert("vitals_heartrate", hrRows);
await upsert("vitals_sleep", sleepRows);

// 수신 이력도 한 줄 남기기
await supabase.from("sync_log").insert({
  participant_code: PARTICIPANT,
  status: "success",
  steps_count: stepRows.length,
  heartrate_count: hrRows.length,
  sleep_count: sleepRows.length,
});

console.log("\n🎉 완료! http://localhost:3000/self 에서 확인하세요.");
