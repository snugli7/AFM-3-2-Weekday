-- =============================================
-- GuardPulse 초기 데이터베이스 스키마
-- =============================================

-- 1. profiles (사용자 프로필)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('wearer', 'guardian', 'admin')),
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. vitals (생체 데이터)
CREATE TABLE vitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  heart_rate INTEGER,
  systolic_bp INTEGER,
  diastolic_bp INTEGER,
  spo2 NUMERIC(5,2),
  temperature NUMERIC(4,1),
  arrhythmia_detected BOOLEAN DEFAULT FALSE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vitals_user_recorded ON vitals(user_id, recorded_at DESC);

-- 3. alert_thresholds (사용자별 위험 기준값)
CREATE TABLE alert_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vital_type TEXT NOT NULL,
  caution_min NUMERIC,
  caution_max NUMERIC,
  warning_min NUMERIC,
  warning_max NUMERIC,
  danger_min NUMERIC,
  danger_max NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, vital_type)
);

-- 4. alerts (위험 알림 이력)
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vital_id UUID REFERENCES vitals(id),
  vital_type TEXT NOT NULL,
  alert_level TEXT NOT NULL CHECK (alert_level IN ('caution', 'warning', 'danger')),
  value NUMERIC NOT NULL,
  message TEXT,
  acknowledged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alerts_user_created ON alerts(user_id, created_at DESC);

-- 5. family_connections (착용자-보호자 연결)
CREATE TABLE family_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wearer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  guardian_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wearer_id, guardian_id)
);

-- 6. notification_log (알림 발송 이력)
CREATE TABLE notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES alerts(id),
  recipient_id UUID NOT NULL REFERENCES profiles(id),
  channel TEXT NOT NULL CHECK (channel IN ('push', 'sms', 'in_app')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Row Level Security (RLS)
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

-- profiles: 본인 프로필 조회/수정
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- profiles: 보호자가 연결된 착용자 프로필 조회
CREATE POLICY "Guardians can view connected wearers"
  ON profiles FOR SELECT USING (
    id IN (
      SELECT wearer_id FROM family_connections
      WHERE guardian_id = auth.uid() AND status = 'accepted'
    )
  );

-- vitals: 본인 데이터 전체 접근
CREATE POLICY "Users can manage own vitals"
  ON vitals FOR ALL USING (auth.uid() = user_id);

-- vitals: 보호자가 연결된 착용자 데이터 조회
CREATE POLICY "Guardians can view connected wearer vitals"
  ON vitals FOR SELECT USING (
    user_id IN (
      SELECT wearer_id FROM family_connections
      WHERE guardian_id = auth.uid() AND status = 'accepted'
    )
  );

-- alert_thresholds: 본인 설정 관리
CREATE POLICY "Users can manage own thresholds"
  ON alert_thresholds FOR ALL USING (auth.uid() = user_id);

-- alerts: 본인 알림 조회
CREATE POLICY "Users can view own alerts"
  ON alerts FOR ALL USING (auth.uid() = user_id);

-- alerts: 보호자가 연결된 착용자 알림 조회
CREATE POLICY "Guardians can view connected wearer alerts"
  ON alerts FOR SELECT USING (
    user_id IN (
      SELECT wearer_id FROM family_connections
      WHERE guardian_id = auth.uid() AND status = 'accepted'
    )
  );

-- family_connections: 관련된 사용자만 접근
CREATE POLICY "Users can view own connections"
  ON family_connections FOR SELECT USING (
    auth.uid() = wearer_id OR auth.uid() = guardian_id
  );

CREATE POLICY "Wearers can create connections"
  ON family_connections FOR INSERT WITH CHECK (auth.uid() = wearer_id);

CREATE POLICY "Users can update own connections"
  ON family_connections FOR UPDATE USING (
    auth.uid() = wearer_id OR auth.uid() = guardian_id
  );

-- notification_log: 수신자만 조회
CREATE POLICY "Users can view own notifications"
  ON notification_log FOR SELECT USING (auth.uid() = recipient_id);

-- =============================================
-- Realtime 활성화
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE vitals;
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
