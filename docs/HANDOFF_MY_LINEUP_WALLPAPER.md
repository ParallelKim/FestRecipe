# 핸드오프: 나만의 라인업 · 배경화면 · 대표곡 정책 (2026-07-28)

이 문서는 Cloud Agent 세션에서 진행한 **FestRecipe** 프론트/데이터 작업과 논의 결정을 다음 담당자(또는 QA)가 이어가기 위한 요약이다.

---

## 1. 브랜치 · PR

| 항목 | 내용 |
|------|------|
| **작업 브랜치** | `cursor/my-lineup-pick-ux-6b8f` |
| **베이스** | `main` |
| **PR** | [#4](https://github.com/ParallelKim/FestRecipe/pull/4) (라인업 UX, 배경화면, 플레이리스트 등 통합) |
| **상태** | 푸시 완료, **머지 전 QA 권장** |

별도 브랜치(이번 세션 범위 밖): `cursor/agent-skills-setup-6b8f` → PR #5 (Agent Skills).

---

## 2. 제품 결정 요약 (논의 반영)

### 2.1 타임테이블 · 나만의 라인업

- **「지금 선택」 시각 강조 제거** — FAB/시트 흐름상 불필요.
- **내 라인업만** 슬롯 강조: `lineupBg` + **1px `box-shadow` 액센트** (`--stage-accent`). `border-width` 변경 없음(레이아웃 시프트 방지).
- 스테이지 컬럼 본문: `theme.soft` 제거 → **중립 트랙 `#f3f4f6`**, 헤더색 + 컬럼 상단 액센트 띠로 구분.
- 타임테이블 **범례(내 라인업 설명) 제거**.
- 담기 UX: 타임테이블·라인업 **☆만** — `MyLineupPanel`에서 아티스트별 「담기」 세로 리스트 **삭제**.

### 2.2 플레이리스트 · YouTube

- 듣기 UI: **YouTube만** (곡별 「여기부터」·YouTube Music 문구 제거, 연속 재생은 상단 CTA).
- **아티스트 단독 듣기**: YTM Songs 인기순 **최소 10곡, 최대 20곡** (`public/data/playlists/*.json`의 `tracks` 전체).
- **요일/페스티벌/나만의 번들**: `targetSongCount`(티어 3~5)만 사용 → `bundlePlaylist.artistInputsFromPlaylists`가 `tracks` 앞 N곡만 수집.
- 플레이리스트 재생성: `python3 collector/build_playlists.py --festival incheon-pentaport-2026` (YTM API 필요).

### 2.3 홈

- 하단 **`#festivals`「페스티벌 목록」**: `index.json` 기준 **전체** 페스티벌(히어로 포함), `sortFestivalsForList` + D-day 뱃지.
- 현재 데이터는 펜타포트 1건만 등록 → 목록 1개.

### 2.4 배경화면 스튜디오 (`TimetableWallpaperStudio`)

최종 스펙(여러 번 UX 피드백 후 확정):

| 항목 | 결정 |
|------|------|
| **PNG 내용 기본** | **배경색 + 타임테이블만** (FestRecipe 워터마크·설명 문구·「내 라인업 N팀」 캡션 없음) |
| **타임테이블 렌더** | 메인과 동일 `TimetableGrid` + **위젯·시계 안전 밴드** 안에 contain 스케일·중앙 배치 |
| **위치/확대 조작** | 없음 (드래그·슬라이더 제거) |
| **PNG 형태** | **직사각** (`wallpaper-studio__canvas`, `border-radius: 0`). 미리보기 둥근 모서리는 **바깥 `preview` 크롬만** |
| **저장 해상도** | 칩 선택(이 기기 / iPhone / FHD+ / QHD+). Dialog 안 native `<select>` 사용 금지(모바일에서 깨짐). 이 기기는 screen×DPR(이중 적용 방지) |
| **배경색** | 프리셋 칩 + **react-colorful** (`HexColorPicker` / `HexColorInput`) — **`<input type="color">` 사용 금지**(Android 시스템 피커) |
| **텍스트 옵션** | **페스티벌명** · **날짜** — 기본 **OFF**, 켜면 **작은 캡션** |
| **페스티벌명 표기** | `Festival.shortName` 우선, 표시 시 **대문자** (`festivalShortLabel`) — 펜타포트: **`PENTAPORT`** |
| **잠금·홈 가림 영역** | 콘텐츠를 안전 밴드 안에 배치(PNG에도 반영). 오버레이 토글로 가림 구역 표시 |

진입: `MyLineupPanel` → `TimetableWallpaperEntry` → 「배경화면 편집」.

### 2.5 데이터 모델 추가

```json
// public/data/festivals/*.json
"shortName": "PENTAPORT"
```

- `Festival.shortName` — 연도·개최지 없는 통용 약어, 배경화면 등 짧은 라벨용.
- 신규 페스티벌 등록 시 **영문 대문자** 권장.

---

## 3. 주요 파일 맵

| 영역 | 파일 |
|------|------|
| 타임테이블 | `src/components/TimetableGrid.tsx`, `src/index.css` (`.tt-grid__*`) |
| 나만의 라인업 | `src/components/MyLineupPanel.tsx`, `src/lib/lineupDay.ts` |
| 플레이리스트 패널 | `src/components/ArtistPlaylistPanel.tsx`, `PlaylistHubActions.tsx` |
| 번들 곡 수 | `src/lib/bundlePlaylist.ts` |
| 배경화면 | `src/components/TimetableWallpaperStudio.tsx` |
| 배경 해상도/스케일 | `src/lib/wallpaperDevice.ts`, `src/lib/wallpaperLayout.ts` |
| shortName | `src/lib/festivalShortLabel.ts` |
| PNG 저장 | `src/lib/captureElementPng.ts` (html-to-image) |
| 플레이리스트 빌드 | `collector/build_playlists.py` |
| 홈 목록 | `src/pages/Home.tsx` |
| 페스티벌 상세 | `src/pages/FestivalDetail.tsx` |

---

## 4. 의존성 추가

- **`react-colorful`** — 배경색 「직접 지정」 UI.

---

## 5. QA 체크리스트 (머지 전)

- [ ] 모바일: 타임테이블 ☆ 담기/해제, 시트 닫기 후 상태 유지
- [ ] 아티스트 패널: YouTube 연속 재생, 곡 수 10+ (단독) vs 번들 3~5/아티스트
- [ ] 배경화면: 기본 PNG = 배경 + 타임테이블만, 모서리 직각, 해상도 라벨과 실제 비율
- [ ] 배경화면: 페스티벌명 ON → `PENTAPORT`만, 날짜 ON → `7.31 FRI` 등
- [ ] 배경화면: react-colorful 동작, **시스템 컬러 피커 안 뜸**
- [ ] 홈 `/#festivals` 스크롤, 목록 개수 = `index.json` 건수
- [ ] `npm run build` 통과

---

## 6. 미완 · 후속 (논의만 / 범위 밖)

- **PR #4 머지** 및 프로덕션 배포.
- 홈/SEO 문구에 남은 **「YouTube Music」** (`Home.tsx`, `HomeHelmet.tsx`) — 듣기 UI는 YouTube만인데 마케팅 문구 정리 여지.
- `docs/FRONTEND_AUDIT.md` 기준 **shadcn 점진 도입**, P0 접근성(`focus-visible`, `prefers-reduced-motion`).
- 프로젝트 전용 `festrecipe-ui` 스킬은 **제거됨** (PR #5 맥락).
- 페스티벌 추가 시: `index.json` + JSON + `build_playlists.py` 재실행.

---

## 7. 배경화면 UX 진화 (맥락용)

피드백을 거치며 다음을 **하지 않기로** 확정했다.

1. 배경화면 전용 `pxPerMin` / 작은 폰트로 그리드 재작성 → 메인과 어색함.
2. `transform` pan·zoom + `min-height` → 하단 여백·상단 잘림.
3. 안전 영역을 scale 계산에 과도 반영 → 타임테이블이 너무 작음.
4. OS `<input type="color">` → Android 기본 「색상 선택」 다이얼로그.
5. PNG에 라운드·FestRecipe·긴 공식 페스티벌명 기본 노출.

**현재 정답**: 메인 TT 스냅샷 축소 + 배경 + 선택적 짧은 캡션(`shortName`).

---

## 8. 커밋 참고

`main` 대비 브랜치 최신 커밋 예: `43593fb` (shortName PENTAPORT). 전체 이력:

```bash
git log main..cursor/my-lineup-pick-ux-6b8f --oneline
```

---

문의·이슈는 PR #4 코멘트 또는 이 문서 갱신으로 이어가면 된다.
