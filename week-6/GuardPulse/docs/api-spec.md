# GuardPulse 데이터 수신 API 명세

> 이 문서는 **안드로이드 동기화 앱**(별도 프로젝트)이 참고하는 명세입니다.
> 워치에서 모은 걸음수·심박·수면 데이터를 이 API로 올리면 Supabase에 저장되고,
> 웹 대시보드 `/self` 에 표시됩니다.

---

## 개요

| 항목 | 값 |
|---|---|
| 경로 | `POST /api/sync` |
| 인증 | `Authorization: Bearer <SYNC_API_KEY>` |
| Content-Type | `application/json` |
| participant_code | 현재 `SELF-001` 고정 |
| 중복 처리 | `participant_code + recorded_at` 같은 레코드는 **덮어쓰기(upsert)** |

- `SYNC_API_KEY` 는 서버 `.env.local` 에 저장된 값과 **정확히 일치**해야 합니다.
- 키가 없거나 틀리면 `401 Unauthorized` 를 반환합니다.
- 시각(`recorded_at`, `sleep_start`, `sleep_end`)은 **ISO 8601** 형식을 권장합니다.
  타임존을 포함하세요. 예: `2026-07-20T09:00:00+09:00` (한국시간).

---

## 요청(Request)

세 종류(steps / heartrate / sleep)를 한 번에 배치로 보낼 수 있습니다.
필요 없는 종류는 생략하거나 빈 배열로 두면 됩니다.

```http
POST /api/sync HTTP/1.1
Host: <배포주소 또는 http://localhost:3000>
Authorization: Bearer 6a63a7c3...(본인 키)
Content-Type: application/json
```

```json
{
  "participant_code": "SELF-001",
  "steps": [
    { "recorded_at": "2026-07-20T09:00:00+09:00", "step_count": 1200 },
    { "recorded_at": "2026-07-20T10:00:00+09:00", "step_count": 850 }
  ],
  "heartrate": [
    { "recorded_at": "2026-07-20T09:00:00+09:00", "bpm": 72 },
    { "recorded_at": "2026-07-20T09:10:00+09:00", "bpm": 78 }
  ],
  "sleep": [
    {
      "recorded_at": "2026-07-20T00:30:00+09:00",
      "sleep_start": "2026-07-20T00:30:00+09:00",
      "sleep_end": "2026-07-20T07:00:00+09:00",
      "duration_minutes": 390
    }
  ]
}
```

### 필드 설명

**steps[]** — 걸음수 (버킷 단위: 예. 1시간마다 걸음수)
| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `recorded_at` | string(ISO8601) | ✅ | 측정 시각 |
| `step_count` | integer | ✅ | 해당 시각 버킷의 걸음수 |

> 대시보드의 "오늘 걸음수"는 **오늘 날짜 레코드들의 `step_count` 합**으로 계산합니다.
> 삼성헬스가 누적값을 준다면, 앱에서 시간 구간별 증가분으로 쪼개 보내는 것을 권장합니다.

**heartrate[]** — 심박
| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `recorded_at` | string(ISO8601) | ✅ | 측정 시각 |
| `bpm` | integer | ✅ | 분당 심박수 |

**sleep[]** — 수면 (보통 하루 1건, 어젯밤 세션)
| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `recorded_at` | string(ISO8601) | ✅ | 수면 세션 대표 시각(보통 잠든 시각) |
| `duration_minutes` | integer | ✅ | 총 수면 시간(분) |
| `sleep_start` | string(ISO8601) | ⬜ | 잠든 시각 |
| `sleep_end` | string(ISO8601) | ⬜ | 깬 시각 |

---

## 응답(Response)

### ✅ 성공 — `200 OK`
```json
{
  "ok": true,
  "inserted": { "steps": 2, "heartrate": 2, "sleep": 1 },
  "sync_log_id": 42
}
```
- `inserted` : 종류별로 upsert 처리된 레코드 수.
- `sync_log_id` : 이번 수신이 `sync_log` 테이블에 남긴 기록의 id.

### ❌ 인증 실패 — `401 Unauthorized`
```json
{ "ok": false, "error": "Unauthorized" }
```

### ❌ 잘못된 요청 — `400 Bad Request`
```json
{ "ok": false, "error": "잘못된 JSON 본문입니다." }
```

### ❌ 서버/DB 오류 — `500 Internal Server Error`
```json
{ "ok": false, "error": "<오류 메시지>" }
```
> 500이 발생해도 `sync_log` 에 `status='failed'` 로 실패 이력이 남습니다.

---

## curl 테스트 예시

로컬 개발 서버(`npm run dev`)를 켠 상태에서:

```bash
curl -X POST http://localhost:3000/api/sync \
  -H "Authorization: Bearer <본인_SYNC_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "steps": [{ "recorded_at": "2026-07-20T09:00:00+09:00", "step_count": 1200 }],
    "heartrate": [{ "recorded_at": "2026-07-20T09:00:00+09:00", "bpm": 72 }],
    "sleep": [{ "recorded_at": "2026-07-20T00:30:00+09:00", "duration_minutes": 390 }]
  }'
```

성공하면 `{"ok":true,...}` 가 돌아오고, `/self` 페이지에서 데이터가 보입니다.
