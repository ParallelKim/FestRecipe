# 프론트엔드 점검 (2026-07)

스킬: **web-design-guidelines**, **vercel-react-best-practices** (요약).

## 스택 스냅샷

| 항목 | 상태 |
|------|------|
| React 19 + Vite 8 + TS | ✓ |
| Tailwind v4 (`@import "tailwindcss"`) | 설치됨, **실사용은 `index.css` 커스텀 클래스 위주** (~2k LOC) |
| Framer Motion | 홈·페스티벌 히어로만 |
| 라우팅 | `/`, `/festival/:id` — **일자·선택 아티스트 URL 미반영** |
| 디자인 소스 | `index.css` `@theme` 토큰 + 레거시 `DESIGN.md` (재정의 예정) |

---

## Web Interface Guidelines (파일별)

### `src/App.tsx`

- `App.tsx:12` — `<main>` 있음 ✓; **본문 skip link 없음** (가이드라인: skip to main)
- `App.tsx:10-12` — 레이아웃 인라인 스타일 → 토큰/클래스로 통일 여지

### `src/components/DayTabs.tsx`

- `DayTabs.tsx:9-24` — `role="tablist"` / `role="tab"` / `aria-selected` ✓
- `DayTabs.tsx:13-22` — **`aria-controls` / `tabpanel` / `id` 연결 없음** (키보드 탭 패턴 불완전)
- `DayTabs.tsx:828-844` (`index.css`) — **`.day-tab:focus-visible` 없음**

### `src/components/PlaylistMobileDock.tsx`

- `PlaylistMobileDock.tsx:50` — FAB `aria-label` ✓
- `PlaylistMobileDock.tsx:782-793` — 시트 애니메이션 **`prefers-reduced-motion` 미처리**
- `PlaylistMobileDock.tsx:782` — **`overscroll-behavior: contain` 없음** (시트 내 스크롤 체이닝)
- `FestivalDetail.tsx:100` — Escape는 **데스크톱 `playlistSheetOpen`에만**; 모바일 시트·배경화면 스튜디오는 별도 처리 없음
- **포커스 트랩 / `inert` 배경** 없음 (dialog 패턴)

### `src/components/TimetableWallpaperStudio.tsx`

- `TimetableWallpaperStudio.tsx:120` — `role="dialog"` ✓
- **Escape 닫기·포커스 복귀·`overscroll-behavior`** 미구현

### `src/components/ArtistPlaylistPanel.tsx`

- `ArtistPlaylistPanel.tsx:118` — 아티스트 영역 `aria-label` ✓
- `ArtistPlaylistPanel.tsx:144` — 로딩 `aria-live="polite"` ✓
- `ArtistPlaylistPanel.tsx:110` — 로딩 문구 `…` vs `...` 혼재 (`불러오는 중…` ✓ / 다른 파일은 `...`)

### `src/components/TimetableGrid.tsx`

- `TimetableGrid.tsx:167-168` — 슬롯 `aria-label` / `aria-current` ✓
- `TimetableGrid.tsx` — 선택(`is-selected`)과 내 라인업(`is-in-lineup`) 클래스 분리 ✓
- 성능: 슬롯 수는 페스티벌 규모상 보통 &lt;50 — 가상화 불필요; **`content-visibility`** 는 장시간 그리드 시 검토

### `src/index.css` (공통)

- `index.css:103-128` — `.btn-primary` / `.btn-secondary` — **`:focus-visible` 링 없음** (hover/active만)
- `index.css:911-912,955-956,1171-1172,1192-1193` — `outline: none` + **일부 컴포넌트만** `:focus-visible` 대체 (칩·카드·슬롯·☆)
- `index.css:119` — `transition` 속성 명시 ✓ (`all` 아님)
- `index.css:816-818` — 시트 `@keyframes` — **`prefers-reduced-motion` 없음**
- `index.css:1132-1135` — 타임테이블 `:hover` — 터치 기기 OK; 가이드는 hover 피드백 권장

### `src/pages/FestivalDetail.tsx`

- `FestivalDetail.tsx:110` — `불러오는 중...` → **`…` 권장**
- `FestivalDetail.tsx:342-346` — 포스터 `alt` ✓; **`width`/`height` 없음** (CLS)
- `FestivalDetail.tsx:41-48` — `activeDayIndex`, `selectedArtist`, 시트 상태 — **URL 쿼리 없음** (공유·뒤로가기 복원 약함)
- `FestivalDetail.tsx` (~585줄) — **단일 페이지 과밀** (데이터·핸들러·3단계 라인업 UI)

### `src/pages/Home.tsx`

- `Home.tsx:182-186,228-232` — 장식 썸네일 `alt=""` ✓; **치수 속성 없음**
- `Home.tsx:140-223` — `motion.*` — **`prefers-reduced-motion` 미존중**

### `index.html`

- `index.html:6` — viewport zoom 허용 ✓
- `index.html:2` — `lang="ko"` ✓

---

## vercel-react-best-practices (요약)

1. **번들** — `framer-motion` 전 페이지 import 아님 ✓; shadcn 도입 시 **트리 쉐이킹·필요 컴포넌트만** (`bundle-barrel-imports`).
2. **워터폴** — `FestivalDetail` 초기 로드 `Promise.all` ✓; 아티스트 선택 시 플레이리스트는 순차 1건 ✓.
3. **리렌더** — `FestivalDetail` 상태 다수 → **페이지 분할** 또는 `useCallback`/`memo`는 핫패스(타임테이블)만 선택 적용.
4. **React 19** — `forwardRef` 불필요 패턴 유지 (`vercel-composition-patterns`).

---

## 우선순위 수정 제안 (shadcn 전)

| P | 항목 | 노력 |
|---|------|------|
| P0 | `.btn-primary` / `.day-tab` / 시트 닫기 버튼 `:focus-visible` | 소 |
| P0 | 시트·스튜디오 `prefers-reduced-motion` + `overscroll-behavior: contain` | 소 |
| P1 | `DayTabs` WAI-ARIA 완성 (`aria-controls`, `tabpanel`) | 중 |
| P1 | 모달/시트 Escape + (선택) focus trap | 중 |
| P1 | 로딩 카피 `…` 통일 | 소 |
| P2 | `?day=` / `?artist=` URL 동기화 (`nuqs` 등) | 중 |
| P2 | `FestivalDetail` 훅·패널 분리 | 중 |
| P2 | 포스터/썸네일 `width`/`height` 또는 aspect-ratio 고정 | 소 |

---

## 다음 PR: shadcn/ui 도입 가이드

### 전제 (이미 충족)

- **Tailwind CSS v4** + Vite 플러그인 있음 (`vite.config.ts`).
- **디자인 토큰**은 `@theme`에 정의됨 → shadcn `cssVariables`와 **1:1 매핑** 가능.

### 권장 방식: 점진 도입 (Big Bang 금지)

1. **초기화** (다음 PR 범위)
   ```bash
   npx shadcn@latest init
   ```
   - `components.json`: `rsc: false`, alias `@/`, style **new-york** 또는 **default**
   - `src/index.css`에 shadcn CSS variables를 **새 디자인 토큰**(shadcn init + `@theme` 정리)에 맞게 설정.

2. **1차 컴포넌트** (가장 ROI 높음)
   | shadcn | 대체 대상 | 이유 |
   |--------|-----------|------|
   | `Sheet` | `PlaylistMobileDock` 시트 | 접근성·스와이프·포커스 패턴 |
   | `Dialog` | `TimetableWallpaperStudio` | modal a11y |
   | `Button` | `.btn-primary` / `.btn-secondary` | focus ring 일원화 |
   | `Tabs` | `DayTabs` | ARIA 탭 완성 |
   | `Badge` | `headliner-badge`, 칩 메타 | |
   | `ScrollArea` | `.timetable-scroll` | 모바일 가로/세로 스크롤 |

3. **유지 커스텀** (shadcn으로 옮기지 말 것)
   - **`TimetableGrid`** — 도메인 특화 레이아웃; shadcn Table과 무관.
   - **스테이지 색** (`stageTheme.ts`) — 슬롯 인라인 스타일 유지.

4. **충돌 관리**
   - `index.css`의 `.btn-*`, `.playlist-sheet*`는 **마이그레이션 완료 시 제거**; 기간 중에는 BEM + shadcn 병행 가능하나 클래스 중복 주의.
   - **Framer Motion** — shadcn `Sheet` 애니메이션과 역할 겹침; 히어로만 motion 유지 권장.

5. **검증**
   - `npm run build` + 수동: 모바일 시트, 타임테이블 탭, 키보드 Tab 순서.
   - 스킬: PR 리뷰 시 `/web-design-guidelines` (시각 방향은 `/frontend-design` 또는 `shadcn/ui@shadcn`).

### shadcn PR에서 하지 말 것

- 전체 `index.css` Tailwind 유틸로 재작성
- 타임테이블 그리드 shadcn화
- `DESIGN.md` Airtable 규칙을 shadcn default에 그대로 얹지 말 것 — **다음 PR에서 토큰·컴포넌트 기준을 새로 잡을 것**

### 예상 PR 분할

| PR | 내용 |
|----|------|
| A | `shadcn init` + theme tokens + `Button` |
| B | `Sheet` → 플레이리스트 독 |
| C | `Tabs` → 일자 탭 + URL `?day=` |
| D | `Dialog` → 배경화면 스튜디오 |

---

## 스킬 재실행

```bash
# UI 감사
# Agent: /web-design-guidelines src/components/PlaylistMobileDock.tsx src/components/DayTabs.tsx

# 추가 스킬 검색
npx skills find shadcn
```
