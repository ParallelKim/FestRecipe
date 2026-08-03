# FestRecipe UI·UX 레퍼런스 조사 (2026-08)

> 페스티벌 시간표·라인업 제품, 일정/타임라인 앱, 음악/플레이리스트 앱을 조사한 결과입니다.  
> **구조·내비·벤치마킹**은 이 문서를, **카피·용어**는 [`TONE_AND_MANNER.md`](./TONE_AND_MANNER.md), **섹션·과업 배치**는 [`UX_PRINCIPLES.md`](./UX_PRINCIPLES.md)를 따릅니다.

---

## 1. FestRecipe 제품 맥락 (조사 전제)

### 1.1 한 줄 포지션

**페스티벌 가기 전에, 라인업을 훑고(보기) · 대표곡으로 예습하고(듣기) · 내가 볼 무대만 정리해 현장에서 쓰게(계획) 하는 준비 도구.**

음악 스트리밍 앱이 아니라, **짧게 들러서 정보를 훑고 행동(듣기·담기)** 하는 맥락이다.

### 1.2 세 가지 가치

| 가치 | 사용자 질문 | 서비스 답 |
|------|-------------|-----------|
| **예습** | 모르는 아티스트가 많은데, 뭘 들어보지? | 라인업 아티스트 **대표곡**을 YouTube로 미리 들려준다 |
| **선택** | 시간이 겹치는데 누구를 볼까? | **타임테이블**과 대표곡을 같이 보며 판단을 돕는다 |
| **계획** | 내가 볼 무대만 정리해 두고 싶어 | **내 라인업** 담기 + **배경화면**으로 현장에서 쓸 수 있게 한다 |

### 1.3 겹치는 두 도메인

FestRecipe는 **한 제품 안에서 두 UX 도메인이 겹친다.**

| 도메인 | 유사 제품군 | FestRecipe에서 하는 일 | MVP 범위 |
|--------|-----------|------------------------|----------|
| **타임테이블·보내기** | 시간표 앱, 태스크/캘린더, 페스티벌 플래너 | 그리드·☆ 담기·내 라인업 강조·**배경화면 PNG** | 공개 단계별 라인업·stage3 그리드 |
| **플레이리스트·예습** | Spotify, SoundCloud (큐·플레이리스트 층) | 대표곡 **4스코프** 묶음·YouTube 핸드오프 | 앱 내 재생 없음 |

둘은 **풀 스케줄 앱 + 풀 음악 앱**이 아니라, **페스티벌 준비용으로 잘린 조각**이다.  
UI를 한 앱 패턴만 고르면 실패한다. **스케줄 = 메인 화면**, **음악 = 맥락별 핸드오프·시트**, **보내기 = 별도 작업 공간**으로 역할을 나누는 것이 레퍼런스·이론과 맞다.

### 1.4 예습 = 대표곡 듣기의 4가지 범위

코드·제품 정의 (`PlaylistTitleKind`, `useFestivalPlaylistActions`)와 일치한다.

| 범위 | 코드 | 무엇을 듣는지 | 진입·구현 |
|------|------|---------------|-----------|
| **페스티벌 전체** | `festival` | 전체 라인업 대표곡 묶음 | `openBundledPlaylist('festival', …)` |
| **요일** | `day` | 선택한 날 아티스트 대표곡 묶음 | `openBundledPlaylist('day', …)` |
| **아티스트** | `artist` | 한 팀 대표곡 (티어 3~5곡 등) | 슬롯/칩 탭 → 시트 → `buildWatchVideosUrl` |
| **커스텀** | `custom` | **내 라인업**에 담은 팀만 묶음 | `openMyLineupPlaylist()` → `playlistTitleForCustom` |

**계획 vs 예습 구분**

- **내 라인업 담기·비우기·배경화면** → 계획 (목록 관리·현장용 출력)
- **내 라인업 YouTube로** → 예습의 **custom** 스코프 (재생 행위)

### 1.5 MVP 기능 목록 (구현 기준)

| 기능 | 설명 |
|------|------|
| 라인업 보기 | stage1 전체 / stage2 일별 / stage3 타임테이블 |
| 대표곡 예습 | artist / day / festival / custom, YouTube 연속 재생 링크 |
| 내 라인업 | ☆ 담기, 날짜별 비우기, 타임테이블 슬롯 강조 |
| 배경화면 | 기기 비율 PNG, 위젯·시계 안전 밴드, 선택적 캡션 |

**MVP 밖 (고도화·보류):** 예상 셋리스트, 풀캠 타임스탬프, 앱 내 스트리밍, 곡별 「여기부터」 — [`SETLIST_RECIPE.md`](./SETLIST_RECIPE.md)

---

## 2. 페스티벌 시간표·라인업 제품 레퍼런스

### 2.1 서드파티 · 멀티 페스티벌 (스케줄이 핵심)

| 제품 | 지역/범위 | URL | 핵심 UX |
|------|-----------|-----|---------|
| **Setline** | 글로벌 | https://setlineapp.com/ | 개인 타임테이블, **클래시 자동 감지**, **리스트 ↔ 멀티스테이지 그리드** 전환, Live Mode(지금/다음), **잠금화면·Dynamic Island**, **스케줄 이미지·홈 위젯**, 오프라인 알림 |
| **Clash** | 글로벌 | https://www.getclashapp.com/ | **타임라인**으로 하루 전체, 클래시 플래그, **Spotify 내장** 미리듣기, 그룹·다중 페스티벌 스케줄 |
| **Frontstage** | 미국 중심 | https://www.frontstagefestivals.com/app | must-see/관심, **충돌 자동 표시**, **잠금화면 스케줄**, 오프라인 맵, **아티스트 샘플 듣기** |
| **Mela** | iOS | https://apps.apple.com/us/app/mela-music-festivals/id6670335074 | 오프라인, 친구 스케줄 비교, Live Activities |
| **festivalpilot** | 유럽 93개+ (2026) | https://festivalpilot.app/en/ | 그리드 TT, 북마크, **클래시 + 이유 설명**, **플랜 카드 이미지** 공유, Live Plan, Apple Watch, 계정 없음·오프라인 |
| **Festival Dust** | 북미 EDM 등 | https://apps.apple.com/us/app/festival-dust-music-festivals/id6450744307 | 수백 페스티벌, **그룹 합산 스케줄**, 전면 오프라인 |
| **FestivApp** | EU | https://festivapp.eu/ | 즐겨찾기 → **별도 리스트 + 타임라인 뷰**, 일자 스와이프 |
| **BlueCrazii** | 네덜란드·유럽 | https://bluecrazii.nl/ | 웹 플래너, 탭으로 세트 추가, **클래시 하이라이트**, **공유 링크·friend room** |
| **CoachellaPlus** | Coachella 웹 | https://coachellaplus.com/ | 스와이프 빌더, 충돌 해결(keep/skip/split), **캘린더·이미지 export**, 그룹 채팅 |

### 2.2 공식 단일 페스티벌 앱

| 제품 | URL | 스케줄 UX | 음악/듣기 |
|------|-----|-----------|-----------|
| **Glastonbury 2025** (Vodafone) | https://www.glastonburyfestivals.co.uk/news/download-our-2025-app-keep-your-phone-charged/ | Favourites → 개인 라인업, **클래시 하이라이트**, 공유·동기화, **홈 위젯**(now/up next) | **Spotify** 추천, Worthy FM |
| **Coachella Official** | https://play.google.com/store/apps/details?id=com.goldenvoice.coachellafest | 커스텀 스케줄, 시간순 정렬 | curated playlists (앱 설명) |
| **Tomorrowland Belgium** | https://www.tomorrowland.com/app/ | Line-up & Live Timetable, favourites → 개인 스케줄 | 라인업 new music; 별도 One World Radio 앱 |
| **Download Festival** | https://downloadfestival.co.uk/app/ | 스케줄 빌드, **가로/세로 뷰 토글**, 리마인더 | — |
| **SUMMER SONIC 2026** | https://www.summersonic.com/en/news/2026-06-29-42505/ | ♡ → My Timetable, 푸시 알림 | **플레이리스트 생성·試聴**, ♡ 즐겨찾기 |
| **펜타포트** (역사) | https://enter.etoday.co.kr/news/view/15428 | 나만의 시간표, Line up에 뮤직·영상 | 공식 앱 내 감상 |

### 2.3 페스티벌 앱 공통 UX 패턴 (업계 표준)

1. **♡/★/북마크** → 개인 스케줄 생성 (FestRecipe ☆와 동일 계열)
2. **클래시 감지** — 그리드·타임라인·배지로 시각화 (문구만으로 대체하지 않음)
3. **뷰 전환** — **그리드(공간)** vs **리스트/타임라인(시간 순)** (Setline, Download)
4. **현장 모드** — 지금 / 다음 / 무대 이동 (Live Mode, Live Plan)
5. **스케줄 아티팩트** — **이미지·위젯·잠금화면** (Setline, Frontstage, festivalpilot) ← FestRecipe 배경화면과 동일 욕구
6. **오프라인** — 현장 수신 불량 대비 (거의 전 제품)
7. **듣기** — 앱 내 풀 재생이 아니라 **미리듣기·Spotify 연동** (Clash, Frontstage, Glastonbury)

**FestRecipe 차별점:** 레퍼런스 대부분은 Spotify/샘플 또는 앱 내 재생. FestRecipe는 **YouTube Music 기반 대표곡 번들(일/전체/커스텀)** — 예습을 더 깊게 가져가되, UI는 **mini player가 아니라 링크·범위·큐**로 표현해야 한다.

### 2.4 레퍼런스에서 드문 패턴 (피해야 할 것)

「듣기·라인업」**전용 탭**에 **모아듣기 + 라인업 관리 + 배경화면**을 **세로 스크롤**로 쌓는 구성 — 업계 표준이 아니며, FestRecipe 레거시·fm-next가 공유하던 **비표준** 조합이다.

---

## 3. 일정·타임테이블 앱 레퍼런스 (스케줄 도메인)

FestRecipe 타임테이블 = **캘린더 + 멀티트랙 그리드 + 개인 필터(내 라인업)**.

### 3.1 뷰 모드 이론

| 뷰 | 적합한 질문 | 모바일 | FestRecipe 대응 |
|----|-------------|--------|-----------------|
| **그리드** (시간×스테이지) | 언제·어디서 겹치는지 | 가로 스크롤 | `TimetableGrid` |
| **아젠다/리스트** (시간순) | 다음에 뭐 하지? | 스캔에 유리 | Setline 리스트, Clash 타임라인 |
| **타임라인** (세로 축) | 하루 흐름·overlap | Fantastical, Clash | festivalpilot 「My Bands as day plan」 |

**외부 참고**

- [Calendar UI Examples (Eleken)](https://www.eleken.co/blog-posts/calendar-ui) — Fantastical: 그리드 + 타임라인 토글, 개요·디테일 한 화면
- [UX Patterns Guide – Calendar view](https://uxpatternsguide.com/patterns/calendar-view/) — 모드 전환 시 선택·충돌·timezone 유지
- [Awesome calendar app designs (Justinmind)](https://www.justinmind.com/ui-design/best-calendar-app-designs-how-prototype) — day/week/month/agenda 유연 전환
- [JYU: Timetable views on mobile](https://jyx.jyu.fi/jyx/Record/jyx_123456789_73124) — agenda·day list·week·grid 비교; 좁은 화면에서 agenda 우수 사례

### 3.2 일정 앱 UX 원칙 (벤치마킹)

1. **뷰 토글** — Google Calendar, Fantastical: month/week/day/agenda (단일 뷰 강제 X)
2. **모바일 제스처** — 일 스와이프, 세로 이벤트 리스트
3. **선택일 디테일** — 좁은 화면은 month 셀 축소 → **선택일 아젠다** fallback
4. **충돌·overlap** — 명시적 시각 상태 (색·아이콘)
5. **보내기** — 캘린더 export (CoachellaPlus), 이미지 (festivalpilot)

### 3.3 FestRecipe 시사점 (스케줄)

- **그리드만**이면 「선택」은 커버하지 「다음 뭐지?」는 약함 → **리스트/타임라인 보조 뷰**가 레퍼런스 표준
- **배경화면 PNG** = Setline·festivalpilot 「스케줄 이미지」와 같은 **export 아티팩트** 계층
- **내 라인업 강조** = 「내 일정만」필터 — **그리드 오버레이**, 별도 관리 허브가 아님
- **날짜** = 전역 맥락 → **한 곳**에만 (탭·섹션마다 pill 반복 X)

---

## 4. 음악·플레이리스트 앱 레퍼런스 (예습 도메인)

FestRecipe는 **앱 내 스트리밍 없음** → Spotify/SoundCloud **전체 크롬을 복사하면 기대가 어긋남**.

### 4.1 Spotify · Apple Music 구조

| 계층 | 역할 | 패턴 |
|------|------|------|
| Browse/Library | 찾기·저장 | 탭, 카드, 플레이리스트 행 |
| **Mini Player** | 재생 중 항상 접근 | 탭 바 **위** 고정 ([Spotify APPSPEC](https://appspec.md/starters/spotify)) |
| **Now Playing** | 몰입·큐 | 큰 아트, scrubber, Queue (Up Next / Later) |
| Discovery | 새 곡 | preview, Smart Shuffle ([Spotify Stream On 2023](https://newsroom.spotify.com/2023-03-08/new-home-page-scroll-clips-previews/)) |

Apple Music: Mini Player → Now Playing → Queue, 드래그 재정렬, Play Next / Add to Queue ([Apple Support – Queue](https://support.apple.com/guide/iphone/queue-up-your-music-ipha4521ef7d/ios)).

**음악 앱 가정:** 재생이 **앱 안**에서 계속 → mini player가 정당화됨.

### 4.2 FestRecipe 예습 4스코프 ↔ 음악 앱

| FestRecipe | 음악 앱 유사물 | FestRecipe UI |
|------------|----------------|---------------|
| **artist** | 아티스트 Top Tracks | 시트: 듣기 + 곡 목록, **외부 링크** |
| **day** | 테마/일자 플레이리스트 | 날짜 맥락에서 「이 날」 |
| **festival** | 컴필레이션 | 「페스티벌 전체」 |
| **custom** | 사용자 큐 / Custom playlist | 라인업 맥락, **한 CTA** |

### 4.3 페스티벌 앱의 「듣기」 (중간 패턴)

- **Clash / Frontstage:** Spotify·instant sample — 짧은 미리듣기, 앱 안
- **SUMMER SONIC:** 플레이리스트 생성·試聴
- **Glastonbury:** Spotify 추천

→ 예습 = 탐색·샘플·큐 구성까지 앱 안 가능, **긴 연속 재생**은 외부도 허용.  
FestRecipe = **연속 재생은 YouTube만** → **「열기」 CTA + 곡 목록**; mini player 흉내 부적절.

### 4.4 FestRecipe 시사점 (음악)

- **custom** = Spotify **Queue** — 범위·곡 수·CTA **한 줄**, 라인업 맥락에만
- **artist** = **한 시트** (듣기+목록 한 과업)
- **day / festival** = 플레이리스트 **범위가 UI에 명시** — 동시에 4버튼 나란히 X, **맥락별 진입점**
- **핸드오프 후** — 날짜·라인업 상태 유지 (YouTube로 나갔다 돌아올 때)

---

## 5. 모바일 웹/앱 UX 이론 (FestRecipe 적용)

### 5.1 기본 가정

| 가정 | FestRecipe |
|------|------------|
| 짧은 방문 (1~3분) | 긴 설명·긴 스크롤 허브 부담 |
| 한 손·엄지 | 하단·중앙 주요 터치; 상단 날짜·⋯ |
| 외부 핸드오프 | YouTube — mini player 기대 X, 상태 보존 필요 |
| 목적 혼합 금지 | 스케줄 크롬 + 음악 크롬 한 화면에 쌓지 않기 |

### 5.2 정보 계층 · Primary surface

- **Primary** = 타임테이블 (Setline, Download, 공식 앱 공통)
- **Secondary** = 묶음 듣기, 배경화면
- **Transient** = 아티스트 시트 (한 팀 대표곡)

타임테이블을 작게 하고 「듣기·라인업」 전체 페이지를 크게 두는 구조는 계층 역전.

### 5.3 내비게이션 패턴

| 패턴 | 적합 | FestRecipe |
|------|------|------------|
| 하단 탭 2개 | 동급 독립 공간 | 스케줄|계획 탭은 **같은 허브 변형**처럼 보일 수 있음 |
| 스택 + 시트 | 메인 + 세부 | 타임테이블 + 아티스트 시트 + 라인업 도크/시트 |
| Progressive disclosure | 필요 시만 노출 | 전체/배경화면은 ⋯·export 액션 |

### 5.4 엄지 구역 · 한 화면 한 과업

- ☆ = 슬롯 옆 (그리드 맥락)
- YouTube CTA = 시트 하단 또는 **라인업 도크**
- 타임테이블 **아래까지 스크롤**해야 듣기에 닿는 구조 = 엄지 이론 위반

과업 단위는 [`UX_PRINCIPLES.md`](./UX_PRINCIPLES.md) §2와 동일.

### 5.5 Hick's Law (선택지)

예습 4스코프는 **동시 4버튼**이 아니라:

- **artist** → 탭 시 시트
- **day / festival** → 날짜·페스티벌 맥락 (헤더 ⋯ 등)
- **custom** → 라인업 있을 때만

---

## 6. 레퍼런스에서의 도메인 결합 패턴

### 패턴 A — 스케줄 주, 음악 얇게 (서드파티 다수)

```
[타임테이블/리스트] 메인
  → ♡/★ 담기
  → 클래시 해결
  → Live: now/next (현장)
  → 이미지/위젯 export
  → (옵션) 샘플 / Spotify
```

Setline, festivalpilot, Frontstage, Download.

### 패턴 B — 공식 메가앱

```
홈 허브 → Line-up / Timetable / Map / News
스케줄 = Favourites + 알림 + 위젯
음악 = Spotify 또는 별도 라디오 앱
```

Glastonbury, Tomorrowland, SUMMER SONIC.

### 패턴 C — 웹 플래너

```
브라우저 플랜 → 충돌 해결 → 캘린더/이미지 export → 공유
```

CoachellaPlus, BlueCrazii.

---

## 7. FestRecipe 포지션 지도

```
                    스케줄 강함 ──────────────────►
                    Setline, Clash, festivalpilot
                              │
                              │  ★ FestRecipe
                              │    그리드 + 내 라인업 + PNG
                              │    + YouTube 4스코프 예습
                              │
                    공식 맵앱 ─┼─ Glastonbury, Tomorrowland
                              │
                    음악 강함 ──────────────────►
                    Spotify, Apple Music
```

| 비교 대상 | FestRecipe 관계 |
|-----------|-----------------|
| Setline 등 | 배경화면/위젯·클래시·Live — 웹으로 유사 가치 (사전 준비) |
| Spotify 등 | 4스코프 큐 논리 — **핸드오프**로 구현 |
| 공식 앱 | Favourites·알림·맵 — FestRecipe는 **사전 준비** 집중, 맵/현장 기능 없음 |

---

## 8. 벤치마킹 매트릭스 (FestRecipe)

### 8.1 스케줄 도메인 — 가져올 것

| 레퍼런스 | 가져올 UX | FestRecipe 현재 (조사 시점) |
|----------|-----------|------------------------------|
| Setline | 그리드 ↔ 리스트 토글 | 그리드만 |
| Clash / festivalpilot | 클래시 시각 + (이유) | 그리드 암시 위주 |
| Setline / Frontstage | Now / Next (Live) | 사전 준비 제품 — 선택 |
| Setline / festivalpilot | 스케줄 이미지·위젯 | **배경화면 스튜디오** (강점) |
| Download | 가로/세로 스케줄 토글 | stage3 가로 스크롤 |
| Fantastical / Google Cal | 날짜 맥락 한 곳 + 뷰 모드 | 탭마다 day pill 반복 (레거시) |

### 8.2 음악 도메인 — 가져올 것 (핸드오프 모델)

| 레퍼런스 | 가져올 UX | FestRecipe |
|----------|-----------|------------|
| Spotify Queue | custom = 큐, CTA 한 줄 | 라인업 섹션/도크에만 |
| Artist page | 한 시트 = 듣기+목록 | FmArtistSheet 방향 |
| Mini player | 재생 중 크롬 | **사용 안 함** |
| Playlist scope | 범위 UI에 명시 | 4스코프 진입점 분리 |

### 8.3 섞지 말 것 (레퍼런스가 분리하는 것)

| 섞으면 실패 | 레퍼런스 처리 |
|-------------|---------------|
| 대표곡 시트 안 라인업 관리 | 상세 vs My Line-up 분리 |
| 묶음 듣기 3종 + 라인업 YouTube 나란히 | 타임라인 vs preview 분리 |
| 배경화면 + 듣기 한 탭 | export는 플랜 완료 후 액션 |
| 날짜 라벨 반복 | 전역 날짜 한 곳 |
| 같은 액션 두 UI | [`UX_PRINCIPLES.md`](./UX_PRINCIPLES.md) §3.4 |

---

## 9. 설계 원칙 (레퍼런스 + 도메인 합산)

UI·`/m` 신규 설계 시 PR 체크리스트로 사용한다.

1. **Primary = 타임테이블** — 전체 화면; 탭으로 밀지 않기
2. **개인 스케줄 = 필터/강조** — ♡/☆ → 그리드 오버레이; 별도 허브 페이지 최소화
3. **뷰 2종 고려** — 그리드(겹침) + 리스트/타임라인(다음 행동)
4. **예습 4스코프** — 각각 **진입점 하나** (중복 CTA 금지)
5. **artist** — 시트만 (듣기 + 곡 목록)
6. **custom** — 라인업 큐; mini player 대신 「N팀 · YouTube로」 도크/시트
7. **day / festival** — 날짜·페스티벌 맥락 (⋯·메뉴 등)
8. **배경화면** — export 액션; 듣기 탭과 분리
9. **레이아웃 안정** — 담기·상태 전환 시 시프트 없음 ([`HANDOFF_MY_LINEUP_WALLPAPER.md`](./HANDOFF_MY_LINEUP_WALLPAPER.md))
10. **핸드오프** — YouTube 전 명확한 제목·곡 수; 돌아올 때 날짜·라인업 유지

### 9.1 권장 화면 구조 (와이어프레임 개요)

레퍼런스 합산 시 **비표준 탭 2개 + 3섹션 스크롤** 대안:

```
[헤더: 날짜 pill + ⋯ (이 날 / 전체 / 배경화면)]

[타임테이블 그리드 — 전체 높이]

[라인업 도크 — 있을 때만]
  「N팀 · YouTube로」 → 확장 시 칩·비우기

[아티스트 시트 — artist 스코프]
[배경화면 스튜디오 — 모달]
```

---

## 10. 관련 문서

| 문서 | 역할 |
|------|------|
| [`UX_PRINCIPLES.md`](./UX_PRINCIPLES.md) | 과업 계층·섹션 규칙 |
| [`TONE_AND_MANNER.md`](./TONE_AND_MANNER.md) | 카피·용어 (예습·내 라인업·대표곡) |
| [`HANDOFF_MY_LINEUP_WALLPAPER.md`](./HANDOFF_MY_LINEUP_WALLPAPER.md) | 배경화면·라인업 제품 결정 |
| [`SETLIST_RECIPE.md`](./SETLIST_RECIPE.md) | MVP 범위 vs 고도화 |
| [`LINEUP_STAGE_AND_DDAY.md`](./LINEUP_STAGE_AND_DDAY.md) | 공개 단계 |

---

## 11. 변경 이력

- **2026-08-03** — 최초 작성. 페스티벌 앱·일정 앱·음악 앱 레퍼런스 조사, 두 도메인 겹침, 예습 4스코프, 벤치마킹 매트릭스·설계 원칙 정리 (`cursor/sheet-lineup-title-dedup-938d`).
