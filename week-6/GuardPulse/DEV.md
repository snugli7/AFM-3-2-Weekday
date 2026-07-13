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

## TODO 리스트

### Phase 0: 프로젝트 초기 설정 (우선순위: 최상)

- [ ] Next.js 프로젝트 생성 (`npx create-next-app@latest --typescript --tailwind --app`)
- [ ] shadcn/ui 초기화 및 기본 컴포넌트 설치
- [ ] Supabase 프로젝트 생성 및 환경 변수 설정
- [ ] Supabase 클라이언트 설정 (`lib/supabase/client.ts`, `server.ts`)
- [ ] 기본 레이아웃 구성 (Header, Sidebar, MobileNav)
- [ ] ESLint, Prettier 설정
- [ ] Git 초기화 및 `.gitignore` 설정

### Phase 1: 인증 시스템 (우선순위: 최상)

- [ ] Supabase Auth 설정 (이메일/비밀번호)
- [ ] 회원가입 페이지 (`/signup`)
- [ ] 로그인 페이지 (`/login`)
- [ ] 인증 미들웨어 (보호된 라우트)
- [ ] 사용자 프로필 테이블 생성 (역할: 착용자/보호자/관리자)
- [ ] 로그아웃 기능

### Phase 2: 데이터베이스 설계 및 구축 (우선순위: 최상)

- [ ] `users` 테이블 (프로필, 역할, 설정)
- [ ] `vitals` 테이블 (생체 데이터: 심박수, 혈압, SpO2, 체온)
- [ ] `alerts` 테이블 (위험 알림 이력)
- [ ] `family_connections` 테이블 (착용자-보호자 연결)
- [ ] `alert_thresholds` 테이블 (사용자별 위험 기준값)
- [ ] `notification_log` 테이블 (알림 발송 이력)
- [ ] Row Level Security (RLS) 정책 설정
- [ ] Supabase 마이그레이션 파일 작성

### Phase 3: 생체 데이터 수집 및 표시 (우선순위: 상)

- [ ] 생체 데이터 입력 API (`POST /api/vitals`)
- [ ] 생체 데이터 조회 API (`GET /api/vitals`)
- [ ] 메인 대시보드 페이지 (현재 생체 상태 카드)
- [ ] VitalCard 컴포넌트 (심박수, 혈압, SpO2 각각)
- [ ] 시뮬레이션 데이터 생성기 (MVP 테스트용, 실제 워치 연동 전)
- [ ] 생체 데이터 차트 (일별/주별 추이 - Recharts)
- [ ] 생체 데이터 상세 페이지 (`/vitals`)

### Phase 4: 위험 감지 시스템 (우선순위: 상)

- [ ] 사용자별 위험 기준값 설정 UI
- [ ] 위험 감지 로직 구현 (주의/경고/위험 3단계)
- [ ] 실시간 모니터링 (Supabase Realtime 구독)
- [ ] 위험 알림 생성 API (`POST /api/alerts`)
- [ ] AlertBanner 컴포넌트 (대시보드 상단 경고 표시)
- [ ] StatusIndicator 컴포넌트 (정상/주의/경고/위험 상태)
- [ ] 알림 이력 페이지 (`/alerts`)

### Phase 5: 가족(보호자) 시스템 (우선순위: 중)

- [ ] 가족 초대 기능 (이메일/링크)
- [ ] 가족 연결 관리 페이지 (`/family`)
- [ ] 보호자 전용 대시보드 (`/guardian/[userId]`)
- [ ] 보호자에게 알림 발송 (앱 내 알림)
- [ ] 착용자 상태 실시간 조회 (보호자 뷰)

### Phase 6: 알림 시스템 (우선순위: 중)

- [ ] FCM 푸시 알림 설정 및 연동
- [ ] Twilio SMS 알림 연동
- [ ] 알림 발송 API (`POST /api/notifications`)
- [ ] 알림 설정 페이지 (알림 수단 선택, 수신 시간대)
- [ ] 알림 발송 이력 조회

### Phase 7: PWA 및 시니어 친화 UX (우선순위: 중)

- [ ] PWA 매니페스트 설정
- [ ] Service Worker 설정 (오프라인 기본 지원)
- [ ] 반응형 디자인 (모바일 우선)
- [ ] 시니어 친화 UI (큰 글씨, 높은 대비, 단순한 네비게이션)
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

*최종 업데이트: 2026-07-07*
*아키텍처: Option 3 - Next.js Full-Stack (App Router)*
