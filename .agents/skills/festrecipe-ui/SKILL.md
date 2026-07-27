---
name: festrecipe-ui
description: FestRecipe 페스티벌 라인업·플레이리스트 UI 작업 시 사용. 타임테이블 슬롯 강조(선택 vs 내 라인업), 모바일 플레이리스트 시트/아티스트 카드, 스테이지 테마, DESIGN.md 토큰 준수. "팝오버", "시트", "타임테이블", "강조", "나만의 플레이리스트" UI 개선 요청에 적용.
---

# FestRecipe UI

## 먼저 읽을 것

1. 저장소 루트 **`DESIGN.md`** — 색·타이포·버튼·카드 규칙 (Airtable-style, primary는 near-black `#181d26`)
2. **`src/lib/stageTheme.ts`** — 스테이지별 `bg` / `accent` / `lineupBg`
3. **`src/index.css`** — `tt-grid__*`, `playlist-*`, `playlist-artist-card`, `wallpaper-studio`

## 시각적 역할 분리 (필수)

| 상태 | 의미 | 표현 |
|------|------|------|
| **지금 선택** (`is-selected`) | 슬롯 탭 → 플레이리스트 패널에 열림 | 잉크 링(2px), `z-index` 상승, 스테이지 `accent` 테두리 |
| **내 라인업** (`is-in-lineup`) | ☆로 담음, 배경화면·번들 강조 | 스테이지 `lineupBg` 연한 배경만 (링과 혼동 금지) |
| **둘 다** | 선택 + 담김 | 연한 배경 + 잉크 링 |

타임테이블: `TimetableGrid.tsx`에서 `is-selected` 클래스가 DOM에 반드시 붙어야 함.

## 아티스트 패널 / 모바일 시트

- 아티스트 선택 시 **`PlaylistHubActions` 숨김** — 한 화면에 허브+상세 중복 금지
- 레이아웃: `playlist-artist-card` (eyebrow → 이름 → 메타 → 연속 재생 primary → ☆ 라인업)
- 모바일 **닫기**는 아티스트만 해제하고 시트는 유지 (허브로 복귀)
- 일자: `activeDay`만 — 플레이리스트·배경화면·비우기에 여러 날짜 혼합 금지 (`src/lib/lineupDay.ts`)

## 작업 순서 제안

1. 관련 컴포넌트·CSS 읽기
2. 필요 시 **`web-design-guidelines`** 또는 **`frontend-design`** 스킬 워크플로 병행 (접근성 vs 미적 방향)
3. `npm run build`로 타입·빌드 확인
4. 과한 hover/애니메이션 추가 자제 — 모바일 탭·포커스는 `blurAfterTap` 유지

## 함께 쓰기 좋은 설치 스킬

- `web-design-guidelines` — UI/UX·접근성 감사
- `frontend-design` — 새 화면 미적 방향 (단, FestRecipe는 DESIGN.md가 우선)
- `vercel-react-best-practices` — React 19 리팩터·성능
- `find-skills` — 추가 스킬 검색 (`npx skills find <query>`)
