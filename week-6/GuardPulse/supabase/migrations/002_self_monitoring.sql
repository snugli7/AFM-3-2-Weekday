-- =============================================
-- GuardPulse 자가 모니터링(1인 MVP) 스키마
-- 참가자: SELF-001 (본인)
-- 데이터 흐름: 갤럭시워치 → 삼성헬스 → Health Connect
--            → 안드로이드 동기화 앱 → POST /api/sync → 아래 테이블
--
-- 기존 001_init.sql(로그인 기반 vitals/alerts 등)은 그대로 두고,
-- 이 파일은 새 테이블 4개만 추가합니다. (공존 가능)
-- 이 파일 전체를 Supabase SQL Editor에 붙여넣고 Run 하면 됩니다.
-- (IF NOT EXISTS 로 작성되어 여러 번 실행해도 안전합니다.)
-- =============================================

-- ---------------------------------------------
-- 1. vitals_steps (걸음수)
--    step_count = 해당 recorded_at 시점(버킷)의 걸음수.
--    "오늘 걸음수"는 오늘 날짜 레코드들의 step_count 합으로 계산합니다.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS vitals_steps (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  participant_code TEXT        NOT NULL DEFAULT 'SELF-001',
  step_count   INTEGER     NOT NULL,
  recorded_at  TIMESTAMPTZ NOT NULL,             -- 측정 시각 (기기 기준)
  synced_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- 업로드(수신) 시각
  -- 같은 참가자 + 같은 측정시각은 1건만 (중복 업로드 시 upsert 처리)
  UNIQUE (participant_code, recorded_at)
);
CREATE INDEX IF NOT EXISTS idx_steps_participant_recorded
  ON vitals_steps (participant_code, recorded_at DESC);

-- ---------------------------------------------
-- 2. vitals_heartrate (심박)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS vitals_heartrate (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  participant_code TEXT        NOT NULL DEFAULT 'SELF-001',
  bpm          INTEGER     NOT NULL,             -- 분당 심박수
  recorded_at  TIMESTAMPTZ NOT NULL,
  synced_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (participant_code, recorded_at)
);
CREATE INDEX IF NOT EXISTS idx_hr_participant_recorded
  ON vitals_heartrate (participant_code, recorded_at DESC);

-- ---------------------------------------------
-- 3. vitals_sleep (수면)
--    recorded_at = 수면 세션 시작 시각(그날 밤 기준).
--    duration_minutes = 총 수면 시간(분).
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS vitals_sleep (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  participant_code TEXT        NOT NULL DEFAULT 'SELF-001',
  duration_minutes INTEGER    NOT NULL,          -- 총 수면 시간(분)
  sleep_start  TIMESTAMPTZ,                      -- 잠든 시각(선택)
  sleep_end    TIMESTAMPTZ,                      -- 깬 시각(선택)
  recorded_at  TIMESTAMPTZ NOT NULL,             -- 수면 세션 대표 시각
  synced_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (participant_code, recorded_at)
);
CREATE INDEX IF NOT EXISTS idx_sleep_participant_recorded
  ON vitals_sleep (participant_code, recorded_at DESC);

-- ---------------------------------------------
-- 4. sync_log (수신 이력 - 성공/실패 기록)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS sync_log (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  participant_code TEXT        NOT NULL DEFAULT 'SELF-001',
  status       TEXT        NOT NULL CHECK (status IN ('success', 'failed')),
  steps_count      INTEGER NOT NULL DEFAULT 0,   -- 이번 배치에서 처리한 걸음 레코드 수
  heartrate_count  INTEGER NOT NULL DEFAULT 0,
  sleep_count      INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,                            -- 실패 시 사유
  recorded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- (공통 컬럼 규칙 준수) 로그 발생 시각
  synced_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_synclog_recorded
  ON sync_log (participant_code, synced_at DESC);

-- =============================================
-- Row Level Security (RLS)
--   * 쓰기(insert/upsert)는 서버의 service_role 키로만 수행 → RLS 우회.
--     따라서 anon/authenticated 에게는 INSERT/UPDATE/DELETE 정책을 주지 않습니다.
--   * 읽기는 로그인 없는 /self 대시보드가 anon 키로 조회 →
--     SELF-001 데이터에 한해 SELECT 만 허용합니다.
-- =============================================
ALTER TABLE vitals_steps     ENABLE ROW LEVEL SECURITY;
ALTER TABLE vitals_heartrate ENABLE ROW LEVEL SECURITY;
ALTER TABLE vitals_sleep     ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log         ENABLE ROW LEVEL SECURITY;

-- 읽기 전용 정책 (SELF-001 한정). DROP 후 재생성으로 재실행 안전.
DROP POLICY IF EXISTS "self read steps"     ON vitals_steps;
CREATE POLICY "self read steps"     ON vitals_steps
  FOR SELECT TO anon, authenticated USING (participant_code = 'SELF-001');

DROP POLICY IF EXISTS "self read heartrate" ON vitals_heartrate;
CREATE POLICY "self read heartrate" ON vitals_heartrate
  FOR SELECT TO anon, authenticated USING (participant_code = 'SELF-001');

DROP POLICY IF EXISTS "self read sleep"     ON vitals_sleep;
CREATE POLICY "self read sleep"     ON vitals_sleep
  FOR SELECT TO anon, authenticated USING (participant_code = 'SELF-001');

DROP POLICY IF EXISTS "self read synclog"   ON sync_log;
CREATE POLICY "self read synclog"   ON sync_log
  FOR SELECT TO anon, authenticated USING (participant_code = 'SELF-001');

-- (INSERT/UPDATE/DELETE 정책 없음 → service_role 로만 쓰기 가능)
