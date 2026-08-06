# 아티스트 표기명

## 모델

아티스트는 **내부 id**로 관리한다. 페스티벌 화면 표기는 아티스트 엔티티가 아니라  
**페스티벌 → 아티스트 매핑 레이어**에 둔다.

```
artists.json          festivals/{id}.json
─────────────         ────────────────────
id (SSOT)             allArtists / slots: artistId만
name (카탈로그 기본명)  artistDisplays: { [artistId]: "공식 표기" }
aliases (검색 확장)    ← 화면 표기 SSOT는 여기
composedOf (콜라보)
```

UI 해석 순서: **`Festival.artistDisplays[id]` → `Artist.name` → `id`**  
(`mapArtistViews` / `useMobileFestival`)

## 원칙

1. `lineupStage === stage3_timetable`이면 해당 페스티벌의 **공식 타임테이블 표기**가  
   `artistDisplays`의 SSOT다. 포스터·YTM·통용 표기와 달라도 TT를 따른다.
2. TT에 원어 병기가 있으면 그대로 `artistDisplays`에 둔다.
3. 비전시 프로그램(개막 행사 등)은 표기 대상이 아니다.
4. 수집 파이프라인은 `englishName` / `ytmBrowseId` / `ytmName` / `aliases`만 쓰고  
   **`Artist.name`과 `Festival.artistDisplays`를 덮어쓰지 않는다.**
5. 같은 아티스트가 여러 페스티벌에 나와도 id는 하나. 페스티벌마다 표기가 다르면  
   각 페스티벌의 `artistDisplays`에만 다르게 적는다.  
   이표기는 (선택) `Artist.aliases`에 모아 검색·YTM 쿼리 확장에 쓴다.

## 필드

### `artists.json` (엔티티)

| 필드 | 역할 |
|------|------|
| `id` | 내부 식별자 (SSOT) |
| `name` | 카탈로그 기본 표기 (페스티벌 매핑이 없을 때 fallback) |
| `englishName` | 검색·YTM 매칭 |
| `koreanName` | (선택) 한글 통용 참고 |
| `ytmName` | 수집 원문 (참고만) |
| `aliases` | 검색·쿼리 확장용 이표기. **화면 표기 SSOT 아님** |
| `country` | 해외만 ISO. 없으면 국내 |
| `composedOf` | 콜라보 유닛일 때 구성원 id[] |
| `playlistMode` | `merge` — 멤버 PL 병합 |

### `festivals/{id}.json` (매핑)

| 필드 | 역할 |
|------|------|
| `allArtists` / `lineup` / `slots` | `artistId`만 (문자열 표기 금지) |
| `artistDisplays` | `artistId` → 이 페스티벌에서의 화면 표기 |

`allArtists`에 있는 모든 id에 대해 `artistDisplays` 항목을 두는 것을 권장한다  
(누락 시 UI는 `Artist.name`으로 fallback).

## 콜라보·피처링

공식 TT가 **두 아티스트의 콜라보 유닛**으로 올리면, 슬롯 `artistId`도 그 유닛 하나로 둔다.  
멤버를 각각 별도 슬롯으로 쪼개지 않는다.

| 위치 | 필드 | 역할 |
|------|------|------|
| 페스티벌 | `artistDisplays[collabId]` | TT 표기 (예: `블랙홀 X 방수미`) |
| 아티스트 | `composedOf` | 구성원 id[] (예: `["blackhole", "bang-sumi"]`) |
| 아티스트 | `playlistMode` | `merge` — 멤버 대표곡 병합 |

플레이리스트:

1. 전용 `playlists/{collabId}.json`이 있으면 그걸 쓴다 (`selection: composedOf_merge`).
2. 없으면 런타임에서 `composedOf` 멤버 PL을 라운드로빈 병합한다 (`playlistData.ts`).
3. 멤버 중 YTM 채널이 없는 경우(예: 방수미)는 나머지 멤버만으로도 `playlistReady`로 본다.

UI는 페스티벌 `artistDisplays` 표기를 메인으로 두고, `composedOf` 멤버명을 `Feat. …` 보조 라인으로 보여 준다.

### 사례: JUMF 2026 `blackhole-x-bangsumi`

- 슬롯 id: `blackhole-x-bangsumi`
- `jumf-2026.artistDisplays["blackhole-x-bangsumi"]`: `블랙홀 X 방수미`
- `composedOf`: 블랙홀 + 방수미 (방수미 단독 YTM 채널 없음 → 블랙홀·병합 PL)

## 검수

- [ ] stage3이면 `artistDisplays` 값이 공식 TT와 같은가
- [ ] 슬롯/라인업에 표기 문자열을 직접 넣지 않았는가 (id만)
- [ ] TT ≠ 포스터면 TT를 `artistDisplays`에 따랐는가
- [ ] 페스티벌마다 표기가 다르면 각 `artistDisplays`에만 반영하고, 필요 시 `aliases`에 이표기를 넣었는가
- [ ] 콜라보 슬롯이면 `composedOf`가 채워져 있고, 멤버 id가 `artists.json`에 있는가
- [ ] 콜라보 PL이 전용 파일이거나 멤버 PL 병합으로 듣기 가능한가

출처 URL·로컬 사본은 해당 페스티벌 JSON의 `timetableSource`에 둔다. 문서에 페스티벌별 검수 목록을 쌓지 않는다.
