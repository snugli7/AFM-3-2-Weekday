# DEV.md - GuardPulse 개발 계획

## 선택된 아키텍처: Option 3 - Next.js Full-Stack Architecture

Next.js App Router 기반의 풀스택 아키텍처를 채택합니다. 프론트엔드와 백엔드(API Routes)를 하나의 Next.js 프로젝트에서 통합 관리하며, Supabase를 데이터베이스 및 실시간 통신 백엔드로 활용합니다.

### 기술 스택 요약

| 영역 | 기술 |
|------|------|
| **프레임워크** | Next.js 14+ (App Router, TypeScript) |
| **스타일링** | Tailwind CSS + shadcn/ui |
| **데이터베이스** | Supabase (PostgreSQL) |
| **인증** | Supabase Auth (소셜 로그인 포함) |
| **실시간 통신** | Supabase Realtime (WebSocket) |
| **알림** | FCM (푸시), Twilio (SMS) |
| **배포** | Vercel |
| **상태관리** | Zustand 또는 React Context |
| **차트/시각화** | Recharts 또는 Chart.js |

---

## 프로젝트 구조

```
GuardPulse/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # 루트 레이아웃
│   │   ├── page.tsx                  # 랜딩 페이지
│   │   ├── (auth)/                   # 인증 관련 라우트 그룹
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/              # 대시보드 라우트 그룹
│   │   │   ├── layout.tsx            # 사이드바 포함 레이아웃
│   │   │   ├── page.tsx              # 메인 대시보드
│   │   │   ├── vitals/page.tsx       # 생체 데이터 상세
│   │   │   ├── alerts/page.tsx       # 알림 이력
│   │   │   ├── family/page.tsx       # 가족 관리
│   │   │   └── settings/page.tsx     # 설정
│   │   ├── (guardian)/               # 보호자 전용 라우트 그룹
│   │   │   ├── layout.tsx
│   │   │   └── [userId]/page.tsx     # 착용자 모니터링 대시보드
│   │   └── api/                      # API Routes
│   │       ├── vitals/route.ts       # 생체 데이터 CRUD
│   │       ├── alerts/route.ts       # 알림 관리
│   │       ├── notifications/route.ts # 푸시/SMS 발송
│   │       └── webhooks/route.ts     # 외부 서비스 웹훅
│   ├── components/
│   │   ├── ui/                       # shadcn/ui 컴포넌트
│   │   ├── charts/                   # 차트 컴포넌트
│   │   │   ├── HeartRateChart.tsx
│   │   │   ├── BloodPressureChart.tsx
│   │   │   └── SpO2Chart.tsx
│   │   ├── dashboard/                # 대시보드 전용 컴포넌트
│   │   │   ├── VitalCard.tsx
│   │   │   ├── AlertBanner.tsx
│   │   │   └── StatusIndicator.tsx
│   │   └── layout/                   # 레이아웃 컴포넌트
│   │       ├── Sidebar.tsx
│   │       ├── Header.tsx
│   │       └── MobileNav.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts             # Supabase 클라이언트
│   │   │   ├── server.ts             # 서버 사이드 클라이언트
│   │   │   └── middleware.ts         # 인증 미들웨어
│   │   ├── utils.ts                  # 유틸리티 함수
│   │   └── constants.ts             # 상수 정의
│   ├── hooks/                        # 커스텀 훅
│   │   ├── useVitals.ts
│   │   ├── useAlerts.ts
│   │   └── useRealtimeVitals.ts
│   ├── types/                        # TypeScript 타입 정의
│   │   ├── vitals.ts
│   │   ├── user.ts
│   │   └── alert.ts
│   └── store/                        # 상태 관리
│       └── useAppStore.ts
├── public/
│   ├── icons/                        # PWA 아이콘
│   └── manifest.json                 # PWA 매니페스트
├── supabase/
│   └── migrations/                   # DB 마이그레이션
├── .env.local                        # 환경 변수 (git 제외)
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── MISSION.md
└── DEV.md
```

---

## 현재 상태 (2026-07-28 기준)

### 운영 현황
- **프로덕션**: https://guardpulse-snugli7s-projects.vercel.app (Vercel, GitHub `master` push 시 자동 배포, Root Directory: `week-6/GuardPulse`)
- **SELF-001 자가 모니터링 트랙 가동 중**: 갤럭시워치 → Health Connect → 안드로이드 동기화 앱(`health-sync-app/`, 별도 프로젝트) → `POST /api/sync` → `/self` 대시보드
- 페이지 보호: `/dashboard`, `/guardian`, `/admin`, `/self` 로그인 필수

### 다음 작업 (2026-07-28 합의된 순서)
1. ~~정리 작업 (구 키 파일 삭제, DEV.md 현행화)~~ ← 완료
2. **안드로이드 앱 자동 동기화**: WorkManager 15분~1시간 주기, 포그라운드 서비스, 배터리 최적화 예외 안내
3. **데이터 미수신 감지** (자동 동기화 안정화 확인 후): 문구는 "확인 필요" 계열, 발송 채널은 이메일 우선(Twilio SMS 아님), 미수신 기준 시간은 설정값으로 분리
4. **수면 데이터 조회 로직**: 익일 동기화 결과 확인 후 판단

---

## TODO 리스트

### Phase 0: 프로젝트 초기 설정 (우선순위: 최상)

- [x] Next.js 프로젝트 생성 (`npx create-next-app@latest --typescript --tailwind --app`)
- [x] shadcn/ui 초기화 및 기본 컴포넌트 설치
- [x] Supabase 프로젝트 생성 및 환경 변수 설정
- [x] Supabase 클라이언트 설정 (`lib/supabase/client.ts`, `server.ts`)
- [x] 기본 레이아웃 구성 (Header, Sidebar, MobileNav)
- [x] ESLint 설정 (Prettier는 미도입)
- [x] Git 초기화 및 `.gitignore` 설정

### Phase 1: 인증 시스템 (우선순위: 최상)

- [x] Supabase Auth 설정 (이메일/비밀번호)
- [x] 회원가입 페이지 (`/signup`)
- [x] 로그인 페이지 (`/login`)
- [x] 인증 미들웨어 (보호된 라우트: `/dashboard`, `/guardian`, `/admin`, `/self`)
- [x] 사용자 프로필 테이블 생성 (역할: 착용자/보호자/관리자)
- [ ] 로그아웃 기능 ← **미구현** (UI에 signOut 없음)

### Phase 2: 데이터베이스 설계 및 구축 (우선순위: 최상)

- [x] `profiles` 테이블 (프로필, 역할, 설정)
- [x] `vitals` 테이블 (생체 데이터: 심박수, 혈압, SpO2, 체온)
- [x] `alerts` 테이블 (위험 알림 이력)
- [x] `family_connections` 테이블 (착용자-보호자 연결)
- [x] `alert_thresholds` 테이블 (사용자별 위험 기준값)
- [x] `notification_log` 테이블 (알림 발송 이력)
- [x] Row Level Security (RLS) 정책 설정
- [x] Supabase 마이그레이션 파일 작성 (`001_init.sql`, `002_self_monitoring.sql`)

### Phase 3: 생체 데이터 수집 및 표시 (우선순위: 상)

- [x] 생체 데이터 입력 API (`POST /api/vitals`)
- [x] 생체 데이터 조회 API (`GET /api/vitals`)
- [x] 메인 대시보드 페이지 (현재 생체 상태 카드)
- [x] VitalCard 컴포넌트 (심박수, 혈압, SpO2 각각)
- [x] 시뮬레이션 데이터 생성기 (대시보드 "데이터 시뮬레이션" 버튼)
- [x] 생체 데이터 차트 (HeartRate/BloodPressure/SpO2 차트)
- [x] 생체 데이터 상세 페이지 (`/dashboard/vitals`)
- [x] *(추가)* SELF-001 실데이터 수신 API (`POST /api/sync`, Bearer 키 인증) + `/self` 대시보드

### Phase 4: 위험 감지 시스템 (우선순위: 상)

- [x] 사용자별 위험 기준값 설정 UI (`/dashboard/settings`)
- [x] 위험 감지 로직 구현 (`/api/vitals/check`)
- [x] 실시간 모니터링 (Supabase Realtime 구독, `useRealtimeVitals`)
- [x] 위험 알림 생성 API (`POST /api/alerts`)
- [x] AlertBanner 컴포넌트 (대시보드 상단 경고 표시)
- [x] StatusIndicator 컴포넌트 (정상/주의/경고/위험 상태)
- [x] 알림 이력 페이지 (`/dashboard/alerts`)
- [ ] *(추가 예정)* SELF-001 데이터 미수신 감지 → 이메일 통지 (위 "다음 작업" 3번)

### Phase 5: 가족(보호자) 시스템 (우선순위: 중)

- [x] 가족 연결 관리 페이지 (`/dashboard/family`) + API (`/api/family`)
- [x] 보호자 전용 대시보드 (`/guardian/[userId]`)
- [x] 보호자에게 알림 발송 (앱 내 알림, `notification_log`)
- [x] 착용자 상태 실시간 조회 (보호자 뷰)
- [ ] 가족 초대 기능 (이메일/링크) — 연결 관리만 있음, 초대 발송은 미구현

### Phase 6: 알림 시스템 (우선순위: 중)

- [ ] FCM 푸시 알림 설정 및 연동 — 스텁만 있음 (`lib/notifications.ts`, 로그 출력)
- [x] Twilio SMS 알림 연동 (`sendSMS`, 환경 변수로 동작)
- [x] 알림 발송 API (`POST /api/notifications`)
- [ ] 알림 설정 페이지 (알림 수단 선택, 수신 시간대)
- [x] 알림 발송 이력 조회 (`/dashboard/notifications`)

### Phase 7: PWA 및 시니어 친화 UX (우선순위: 중)

- [x] PWA 매니페스트 설정 (`public/manifest.json`)
- [x] Service Worker 설정 (`public/sw.js`, `offline.html`)
- [x] 반응형 디자인 (모바일 우선)
- [x] 시니어 친화 UI (큰 글씨, 높은 대비, 단순한 네비게이션)
- [ ] 접근성(A11y) 점검 및 개선

### Phase 8: B2B API 및 관리자 (우선순위: 하 - MVP 이후)

- [ ] B2B API 엔드포인트 설계
- [ ] API 키 발급 및 인증
- [ ] 관리자 대시보드
- [ ] AI agent 연동 웹훅

---

## 필요한 외부 설정

### 필수 (MVP)

| 서비스 | 환경 변수 | 용도 | 비용 |
|--------|-----------|------|------|
| **Supabase** | `NEXT_PUBLIC_SUPABASE_URL` | 데이터베이스, 인증, 실시간 통신 | 무료 티어 가능 |
| | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 클라이언트 사이드 접근 | |
| | `SUPABASE_SERVICE_ROLE_KEY` | 서버 사이드 관리자 접근 | |
| **Vercel** | (자동 설정) | 배포 | 무료 티어 가능 |

### 선택 (알림 기능)

| 서비스 | 환경 변수 | 용도 | 비용 |
|--------|-----------|------|------|
| **Firebase (FCM)** | `FIREBASE_PROJECT_ID` | 푸시 알림 | 무료 |
| | `FIREBASE_CLIENT_EMAIL` | | |
| | `FIREBASE_PRIVATE_KEY` | | |
| **Twilio** | `TWILIO_ACCOUNT_SID` | SMS 알림 | 유료 (종량제) |
| | `TWILIO_AUTH_TOKEN` | | |
| | `TWILIO_PHONE_NUMBER` | | |

### .env.local 템플릿

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Firebase (FCM) - 푸시 알림용
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Twilio - SMS 알림용
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 개발 우선순위 요약

```
1. [Phase 0] 프로젝트 초기 설정          ← 지금 시작
2. [Phase 1] 인증 시스템                  ← 핵심 기반
3. [Phase 2] DB 설계                      ← 핵심 기반
4. [Phase 3] 생체 데이터 수집/표시         ← 핵심 기능
5. [Phase 4] 위험 감지 시스템             ← 핵심 기능
6. [Phase 5] 가족(보호자) 시스템          ← MVP 차별화
7. [Phase 6] 알림 시스템                  ← MVP 완성
8. [Phase 7] PWA / 시니어 UX             ← MVP 완성
9. [Phase 8] B2B API                     ← MVP 이후
```

---

*최종 업데이트: 2026-07-28*
*아키텍처: Option 3 - Next.js Full-Stack (App Router)*
