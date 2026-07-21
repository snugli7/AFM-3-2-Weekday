<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:guardpulse-self-mvp-rules -->
# 자가 모니터링(SELF-001) 작업 금지사항

- 기존 `001_init.sql`의 테이블(`vitals`, `profiles`, `alerts` 등)과 `/api/vitals`, `/dashboard` 라우트를 수정·삭제하지 말 것
- `SUPABASE_SERVICE_ROLE_KEY`, `SYNC_API_KEY`를 클라이언트 컴포넌트/브라우저로 노출하지 말 것 (`admin.ts`는 서버 전용)
- `participant_code`는 `'SELF-001'` 고정 (다중 사용자 확장은 별도 승인 후)
- DB 접속 정보를 코드에 하드코딩하지 말 것 (항상 `.env.local`에서 읽기)
<!-- END:guardpulse-self-mvp-rules -->
