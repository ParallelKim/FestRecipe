# 예상 셋리스트(레시피) — 보류·복원 가이드

> **상태:** MVP에서는 **대표곡 플레이리스트**만 제공한다.  
> 예상 셋리스트 / 풀캠 타임스탬프 / 지능형 레시피는 **고도화 단계에서 복원**한다.  
> 이 문서는 카피·데이터모델·수집 파이프라인·남은 코드를 한곳에 모아 복원 비용을 줄이기 위한 기록이다.

관련: [`collector/README.md`](../collector/README.md) (향후 고도화 섹션), [`docs/SEO.md`](./SEO.md)

---

## 1. 제품 포지셔닝 (원 카피)

### 브랜드 한 줄

| 용도 | 카피 |
|------|------|
| 홈 타이틀 / OG | `FestRecipe — AI가 말아주는 페스티벌 셋리스트` |
| 홈 디스크립션 | `페스티벌 전날 밤, AI가 예상한 셋리스트를 유튜브로 바로 들어보세요.` |
| 홈 동적 디스크립션 | `… 현재 {N}개 페스티벌 등록됨.` |
| 페스티벌 타이틀 | `{페스티벌명} — 예상 셋리스트 \| FestRecipe` |
| 페스티벌 디스크립션 | `{페스티벌명}({start} ~ {end}, {location}) {N}개 팀 출연. 아티스트별 AI 예상 셋리스트를 유튜브로 바로 들어보세요.` |
| keywords | `페스티벌, 셋리스트, AI, 유튜브, 인디음악, 페스티벌 셋리스트` |
| Schema WebSite.alternateName | `페스티벌 셋리스트` |
| Schema WebSite.description | `AI가 말아주는 페스티벌 셋리스트` |
| OG/Twitter image alt | `AI가 말아주는 페스티벌 셋리스트 — FestRecipe` |

### UI 카피 (상세 우측 패널 — 구 `setlist-recipe-panel`)

| 위치 | 카피 |
|------|------|
| 패널 부제 | `과거 공연 데이터 기반 예상 셋리스트 · 확률 수치 없음` |
| 전체 재생 CTA | `예상 셋리스트 전체 재생 (유튜브)` |
| 구간 재생 안내 | `특정 곡부터 재생 시작하기:` |
| 섹션 라벨 | `예상 셋리스트` |
| 섹션 보조 | `각 곡을 열어 지난 공연 영상을 바로 확인하세요` |
| 공식 음원 라벨 | `공식 음원` |
| 곡 타입 뱃지 | `발매곡` / `미발매곡` / `커버곡` |
| 통계 문구 | `최근 {totalConcertCount}회 중 {appearanceCount}회` |
| 커버 표기 | `커버 / {originalArtist}` |
| 빈 상태 제목 | `셋리스트 준비 중` |
| 미선택 안내 | `예상 셋리스트와 지난 공연 영상 링크가 표시됩니다.` |
| 라인업(1단계) 안내 | `현재 요일 미구분 전체 라인업이 공개되었습니다. 아티스트를 선택해 최근 setlist 레시피를 구경해 보세요.` |
| 레시피 뱃지 | `레시피 준비 완료` / `레시피 준비 중` |
| 풀캠 링크 라벨(확장 행) | 공연 라벨 + 풀캠/클립 링크 |

### 현재 MVP 카피 (참고 — 복원 시 되돌릴 대상)

| 용도 | 현재 |
|------|------|
| 홈 타이틀 | `FestRecipe — 페스티벌 라인업 & 대표곡 플레이리스트` |
| 홈 디스크립션 | YouTube Music 대표곡 3~5곡 플레이리스트 |
| 페스티벌 타이틀 | `{페스티벌명} — 대표곡 플레이리스트 \| FestRecipe` |
| 우측 패널 | `ArtistPlaylistPanel` (대표곡, 인지도 티어) |

---

## 2. 핵심 제품 규칙 (복원 시 유지)

1. **확률 수치를 UI에 노출하지 않는다.**  
   (`appearanceCount` / `totalConcertCount`는 “최근 N회 중 M회” 형태로만 표현)
2. 곡 분류: `released` | `unreleased` | `cover`
3. 재생 경험:
   - 공식 음원 URL이 있으면 `watch_videos?video_ids=` 로 **예상 셋리스트 전체 재생**
   - 곡별 “여기부터” 재정렬 재생 지원
   - 곡 행 확장 시 **지난 공연 풀캠 타임스탬프 / 라이브 클립** 링크
4. 데이터 소스 우선순위(고도화 목표):
   1. 발매곡 카탈로그(MVP `releases.json`)로 곡명 정규화
   2. 공연 영상 description / 타임스탬프에서 셋리스트 추출
   3. (선택) LLM 정규화 → 레시피 JSON → YouTube 딥링크

---

## 3. 데이터 모델

### 3.1 프론트 타입 (`src/types/index.ts` — 일부 잔존)

```ts
export type SongType = 'released' | 'unreleased' | 'cover'

export interface PastConcertLinks {
  concertLabel: string       // e.g. "2025 BML"
  youtubeFullcamUrl?: string // 풀캠 &t=XXs
  youtubeLiveClipUrl?: string
}

/** 통계 기반 예상 셋리스트 곡 — 확률 수치 없음 */
export interface SetlistSong {
  songTitle: string
  songType: SongType
  albumInfo?: AlbumInfo
  originalArtist?: string
  appearanceCount: number
  totalConcertCount: number
  youtubeOfficialUrl?: string
  pastConcertLinks?: PastConcertLinks[]
}
```

### 3.2 수집기 타입 (`src/services/setlistCollector.ts`)

```ts
export type SetlistSourceType = 'fullcam' | 'playlist'

export interface ConcertSetlist {
  concertLabel: string
  concertYear: string
  sourceType: SetlistSourceType
  youtubeFullcamVideoId: string | null
  youtubeFullcamUrl: string | null
  youtubePlaylistId: string | null
  youtubePlaylistUrl: string | null
  updatedAt: string
  songs: Array<{
    order: number
    songTitle: string
    songType: SongType
    timestampSeconds: number
    youtubeUrl: string
  }>
}
```

### 3.3 Firestore 경로

```
artists/{artistId}/setlistRecipes/{concertDocId}
```

- `concertDocId`: 공연 라벨을 파일명-safe 하게 sanitize한 값
- 업로더: `setlistCollector.ts` / `setlistCollectorScript.ts`

### 3.4 레거시 모크

- 과거 `FestivalService.getRecipeForArtist()` + 인메모리 `SETLIST_RECIPES` 사용
- 영희 전용 모크는 커밋 `2bf625a`에서 제거됨 (`chore: 영희 전용 모크 셋리스트 레시피 제거`)
- 복원 시 정적 JSON(`public/data/setlists/{artistId}.json`) 또는 Firestore를 권장

---

## 4. 수집 파이프라인 (보류 코드)

| 경로 | 역할 | 상태 |
|------|------|------|
| `collector/collect.py` | yt-dlp로 과거 공연·셋리스트 후보 수집 | 보류 |
| `collector/fetch_events.py` | 공연명 검색 → description 배치 수집 | 보류 |
| `collector/namu_crawler.py` | 나무위키 공연 이력 | 보류(CSR) |
| `src/services/setlistCollector.ts` | 풀캠 타임라인 / 재생목록 경로 수집 → Firestore | 레포에 잔존 |
| `src/services/setlistCollectorScript.ts` | CLI·Firestore 업로드 스크립트 변형 | 레포에 잔존 |

### 수집 경로 요약

**① 풀캠:** 검색 → 후보 필터 → description 타임라인 파싱 → `&t=` 딥링크  
**② 재생목록:** 재생목록 감지 → 영상 순서 = 셋리스트 순서 → 제목에서 곡명 추출

예시 CLI:

```bash
npx ts-node src/services/setlistCollector.ts --artist "너드커넥션" --id "nerd-connection"
npx ts-node src/services/setlistCollector.ts --artist "잔나비" --id "jannabi" --limit 10
```

의존성: `yt-dlp`, Firebase 환경변수(`VITE_FIREBASE_*` / `FIREBASE_*`)

---

## 5. UI 복원 체크리스트

프론트에서 예상 셋리스트를 다시 켤 때:

1. **카피/SEO**
   - [ ] `index.html` 기본 meta를 위 §1 표로 복원 (또는 기능 플래그에 따라 분기)
   - [ ] `HomeHelmet` / `FestivalHelmet` 타이틀·디스크립션·Schema
   - [ ] `docs/SEO.md` OG 표 갱신
2. **패널**
   - [ ] 우측 패널을 `setlist-recipe-panel` 개념으로 복원 (또는 탭: 대표곡 | 예상 셋리스트)
   - [ ] `SetlistSong[]` 리스트 + 타입/앨범 뱃지 + 최근 N회 중 M회
   - [ ] `watch_videos` 전체 재생 / 곡부터 재생
   - [ ] `pastConcertLinks` 확장 행 (풀캠·클립)
3. **데이터**
   - [ ] `FestivalService.getRecipeForArtist` (또는 `getSetlistForArtist`) 복구
   - [ ] 정적 JSON 또는 Firestore `setlistRecipes` 연결
4. **수집**
   - [ ] `collector/collect.py` + `fetch_events.py`를 MVP releases 파이프라인 뒤에 연결
   - [ ] 곡명 정규화에 `releases.json` 활용

참고 UI 스냅샷 커밋(패널 문구·구조): `2bf625a`의 부모 트리 `src/pages/FestivalDetail.tsx`  
(`git show 2bf625a^:src/pages/FestivalDetail.tsx`)

---

## 6. SEO / 메타 복원 스니펫

### HomeHelmet (구)

```ts
const title = 'FestRecipe — AI가 말아주는 페스티벌 셋리스트'
const description = `페스티벌 전날 밤, AI가 예상한 셋리스트를 유튜브로 바로 들어보세요. 현재 ${festivalCount}개 페스티벌 등록됨.`
// Schema
alternateName: '페스티벌 셋리스트'
description: 'AI가 말아주는 페스티벌 셋리스트'
```

### FestivalHelmet (구)

```ts
const title = `${festivalName} — 예상 셋리스트 | FestRecipe`
const desc = `${festivalName}(${startDate} ~ ${endDate}, ${location}) ${artistCount}개 팀 출연. 아티스트별 AI 예상 셋리스트를 유튜브로 바로 들어보세요.`
```

### index.html (구)

```html
<title>FestRecipe — AI가 말아주는 페스티벌 셋리스트</title>
<meta name="description" content="페스티벌 전날 밤, AI가 예상한 셋리스트를 유튜브로 바로 들어보세요." />
<meta name="keywords" content="페스티벌, 셋리스트, AI, 유튜브, 인디음악, 페스티벌 셋리스트" />
```

---

## 7. MVP와의 관계

| 레이어 | MVP (현재) | 고도화 (이 문서) |
|--------|-----------|------------------|
| 페스티벌/아티스트 | 큐레이션 JSON | 동일 |
| 곡 데이터 | YouTube Music 발매곡·인기순 | + 공연 셋리스트 통계 |
| 인지도 | 타임테이블 늦은 슬롯 | 셋리스트 빈도(`appearanceCount`)와 병행 가능 |
| 재생 | 대표곡 3~5곡 딥링크 | 예상 셋리스트 전체 + 풀캠 타임스탬프 |
| 카피 | 대표곡 플레이리스트 | AI/예상 셋리스트 |

발매곡 카탈로그(`collector/output/{id}/releases.json`, `public/data/playlists/`)는 셋리스트 복원 시 **곡명 정규화 기준**으로 재사용한다.

---

## 8. 변경 이력 (관련 커밋)

| 커밋 | 내용 |
|------|------|
| `2bf625a` | 영희 전용 모크 셋리스트 레시피 제거 |
| `156f8b2` 등 MVP 파이프라인 | 대표곡 플레이리스트로 제품 축 전환, 셋리스트 UI 카피 교체 |
| 잔존 | `src/services/setlistCollector*.ts`, `SetlistSong` 타입, `collector/collect.py` / `fetch_events.py` |

문서 작성 기준 브랜치/시점: 프론트 폴리시 작업 중 (`cursor/frontend-polish-6b8f` 전후).  
복원 전 반드시 `main`의 최신 SEO·플레이리스트 카피와 충돌 여부를 확인한다.
