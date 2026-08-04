# 핸드오프: knip 데드 코드 제거 · CSS/BEM → Tailwind/shadcn (2026-08-04)

이 문서는 Cloud Agent 세션에서 진행한 **FestRecipe** 프론트 정리·리팩터 작업을 다음 담당자(또는 QA/머지 담당)가 이어가기 위한 요약이다.

**선행 머지:** `main`에 PR #14 (`FestivalDetail` 제거, `/festival/:id` → 모바일 UI 통일) 반영 완료.

---

## 1. 브랜치 · PR

| 항목 | 내용 |
|------|------|
| **작업 브랜치** | `cursor/dead-code-knip-css-refactor-938d` |
| **베이스** | `main` |
| **PR** | [#15](https://github.com/ParallelKim/FestRecipe/pull/15) — knip + CSS/BEM 정리 |
| **상태** | **머지 완료** (`main` @ `abb206a`). 후속: `cursor/knip-types-handoff-cleanup-1a26` |

### 커밋 이력 (`main` 대비)

```bash
git log main..cursor/dead-code-knip-css-refactor-938d --oneline
```

| 커밋 | 요약 |
|------|------|
| `8c0fca6` | Phase 1: knip 추가, 데드 모듈·의존성 제거 |
| `c9b0432` | Phase 2: Hero/Home/Wallpaper BEM → Tailwind/shadcn |
| `2baf9a0` | 담기 버튼: TT 담김 ★ 흰색, 아티스트 시트 ButtonGroup |
| `ddc0518` | 데드 CSS 삭제, `Container`/`SiteHeader`, Tabs `folder` variant, Spinner |
| `ef40a59` | `tt-grid` → `MobileTimetable.module.css` 격리 |

---

## 2. 작업 요약

### 2.1 Phase 1 — knip 데드 코드

- `knip.json` + `npm run knip` 추가.
- **삭제 모듈 예:** `useFestivalPlaylistActions`, `useMyLineup`, `artistOfficialName`, `blurAfterTap`, `festivalLinks`, `festivalShortLabel`, `headliners`, `lineupDay`, `playlistBundleOrder`, `stageTheme` 등.
- **의존성 제거:** `react-colorful` (배경화면은 shadcn/Tailwind로 이미 전환된 상태).
- knip entry: `prerender.js`, `setlistCollector*` 유지.

### 2.2 Phase 2 — BEM/CSS → Tailwind/shadcn

| 영역 | 변경 |
|------|------|
| `MobileFestivalHero` | BEM 제거, Tailwind + `Button` |
| `Home` | `home-*` 제거 |
| `MobileWallpaperStudio` | shadcn `ButtonGroup`/`Toggle` |
| `MobileTimetable` | `lineup-pick-btn` → `MobileLineupButton` |
| `index.css` | 대량 레거시 블록 삭제 (~900줄 → 토큰·hero만) |

### 2.3 레이아웃·shadcn 정리 (세션 후반)

| 항목 | 내용 |
|------|------|
| **레이아웃** | `Container`, `SiteHeader` (`TopNav.tsx` 삭제) |
| **로딩** | shadcn `Spinner` (`LoadingState`) |
| **일자 탭** | 글로벌 `.day-tab` CSS 제거 → `TabsList variant="folder"` (`tabs.tsx` cva) |
| **타임테이블** | `index.css`의 `tt-grid` 전부 → `MobileTimetable.module.css` |

### 2.4 shadcn 스타일 원칙 (이번 세션 결정)

1. **variant 우선** — shadcn 컴포넌트는 글로벌 CSS 오버라이드보다 `cva` variant 확장 (예: Tabs `folder`).
2. **className은 레이아웃** — 색·타이포는 시맨틱 토큰 (`bg-background`, `text-muted-foreground`).
3. **도메인 전용 CSS** — 타임테이블 그리드는 CSS Module로 컴포넌트에 격리 (절대 배치·CSS 변수·export 모드).

---

## 3. `index.css` 잔여 커스텀 선택자

글로벌 컴포넌트 선택자는 **사실상 제거 완료**. 남은 것:

| 항목 | 용도 |
|------|------|
| `@keyframes hero-drift` | `Home.tsx` 히어로 포스터 패럴랙스 |
| `@theme` (상단) | FestRecipe/Airtable 커스텀 토큰 |
| `@theme inline` + `:root` + `.dark` | shadcn 시맨틱 토큰 매핑 |
| `@layer base` | shadcn 기본 border/body |

타임테이블 스타일은 **`src/mobile/ui/MobileTimetable.module.css`** 만 참조.

---

## 4. 주요 파일 맵

| 영역 | 파일 |
|------|------|
| 라우팅 | `src/App.tsx` — `SiteHeader`, `/festival/:id` → `FestivalMobile` |
| 레이아웃 | `src/components/layout/Container.tsx`, `SiteHeader.tsx` |
| 페스티벌 UI | `src/pages/FestivalMobile.tsx`, `src/mobile/ui/MobileApp.tsx` |
| 타임테이블 | `src/mobile/ui/MobileTimetable.tsx`, `MobileTimetable.module.css` |
| 담기 버튼 | `src/mobile/ui/MobileLineupButton.tsx` (`tone`, `grouped`) |
| 일자 탭 | `src/mobile/ui/MobileDayBar.tsx`, `src/components/ui/tabs.tsx` (`folder` variant) |
| 배경화면 | `src/mobile/ui/MobileWallpaperStudio.tsx` |
| 히어로 | `src/mobile/ui/MobileFestivalHero.tsx` |
| 홈 | `src/pages/Home.tsx` |
| 글로벌 CSS | `src/index.css` (토큰 + hero-drift만) |
| 데드 코드 검사 | `knip.json`, `npm run knip` |

**삭제됨:** `src/components/TopNav.tsx`, 레거시 `FestivalDetail` 및 knip 대상 모듈 일괄.

---

## 5. knip 잔여 (런타임 무관)

`npm run knip` 실행 시 **미사용 exported types**만 보고됨 (10건):

- `FestivalSignatureTheme`, `MyLineupEntry`, `types/index.ts` 내 여러 interface 등.
- 후속: export 정리 또는 knip `ignore` 검토 (선택).

---

## 6. QA 체크리스트 (머지 전)

- [x] 세션 중 `npm run build` 통과
- [x] 담당자 스모크: 타임테이블·배경화면 export 문제 없음 (2026-08-04 확인)
- [ ] 모바일: TT 슬롯 담기/해제, 담김 시 액센트 배경 + ★ 흰색
- [ ] 아티스트 시트: YouTube | 담기 `ButtonGroup` 행 연결
- [ ] 일자 탭: `folder` variant 폴더 ink-fill 스타일
- [ ] 상단 `SiteHeader` sticky·링크
- [ ] 홈 히어로 `hero-drift` 애니메이션
- [ ] 배경화면 PNG export (타임테이블만, 담기 버튼 숨김)
- [ ] `npm run knip` (타입 경고만 있는지 확인)

---

## 7. 미완 · 후속

- [x] **PR #15 draft → open → 머지** (`main`, `abb206a`, 2026-08-04).
- [x] knip 미사용 **exported types** 정리 — 후속 브랜치 `cursor/knip-types-handoff-cleanup-1a26`.
- `hero-drift`를 `@theme` 유틸/애니메이션으로 이전 (선택, 저우선).
- [x] `docs/HANDOFF_MY_LINEUP_WALLPAPER.md` — 아카이브 표시 + 현행 경로 표 추가.

---

## 8. 아키텍처 스냅샷 (머지 후 기대 상태)

```
/festival/:id     → FestivalMobile → MobileApp (TT · 라인업 · 배경화면)
/festival/:id/m   → redirect to /festival/:id
/                 → Home + SiteHeader
```

스타일 계층:

1. shadcn/ui + Tailwind (대부분 UI)
2. CSS Module (`MobileTimetable`만)
3. `index.css` (디자인 토큰 + hero-drift)

---

문의·이슈는 PR #15 코멘트 또는 이 문서 갱신으로 이어가면 된다.
