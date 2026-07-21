import { createClient } from "@supabase/supabase-js";

// 서버 전용 Supabase 클라이언트 (service_role 키 사용 → RLS 우회).
// ⚠️ 절대 클라이언트 컴포넌트/브라우저로 import 하지 말 것.
//    service_role 키가 노출되면 DB 전체가 열립니다.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase 환경변수(NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)가 없습니다."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
