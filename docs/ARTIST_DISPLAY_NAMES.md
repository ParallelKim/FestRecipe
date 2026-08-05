# 아티스트 표기명

UI·타임테이블·플레이리스트 제목의 `name`은  
`public/data/artists.json`에서 **사람이 검수**한다. 자동 알고리즘으로 고르지 않는다.

## 원칙

1. `lineupStage === stage3_timetable`이면 **공식 타임테이블 표기**가 SSOT다.  
   포스터·YTM·통용 표기와 달라도 TT를 따른다.
2. TT에 원어 병기가 있으면 그대로 둔다 (한 줄로 이어 쓸 수 있음).
3. 비전시 프로그램(개막 행사 등)은 `name` 대상이 아니다.
4. 수집 파이프라인은 `englishName` / `ytmBrowseId` / `ytmName`만 쓰고 **화면용 `name`을 덮어쓰지 않는다.**

## 필드

| 필드 | 역할 |
|------|------|
| `name` | 화면 표기 (SSOT) |
| `englishName` | 검색·YTM 매칭 |
| `koreanName` | (선택) 한글 통용 참고 |
| `ytmName` | 수집 원문 (참고만) |
| `country` | 해외만 ISO. 없으면 국내 |
| `composedOf` | 콜라보 유닛일 때 구성원 id[] |
| `playlistMode` | `merge` — 멤버 PL 병합 |

## 콜라보·피처링

공식 TT가 **두 아티스트의 콜라보 유닛**으로 올리면, 슬롯 `artistId`도 그 유닛 하나로 둔다.  
멤버를 각각 별도 슬롯으로 쪼개지 않는다.

| 필드 | 역할 |
|------|------|
| `name` | TT 표기 그대로 (예: `블랙홀 X 방수미`) |
| `composedOf` | 구성원 `artistId[]` (예: `["blackhole", "bang-sumi"]`) |
| `playlistMode` | `merge` — 멤버 대표곡을 병합해 듣기 (기본) |

플레이리스트:

1. 전용 `playlists/{collabId}.json`이 있으면 그걸 쓴다 (`selection: composedOf_merge`). 콜라보 싱글이 YTM에 있으면 앞에 두고, 없으면 멤버 인기곡을 합친다.
2. 전용 파일이 없으면 런타임에서 `composedOf` 멤버 PL을 라운드로빈 병합한다 (`playlistData.ts`).
3. 멤버 중 YTM 채널이 없는 경우(예: 방수미)는 해당 멤버 PL 없이 나머지 멤버만으로도 `playlistReady`로 본다.

UI는 TT `name`을 메인으로 두고, `composedOf` 멤버명을 `Feat. …` 보조 라인으로 보여 준다.

### 사례: JUMF 2026 `blackhole-x-bangsumi`

- TT: `블랙홀 X 방수미` (숨, 8.15 19:10–19:50)
- 구성: 메탈 밴드 블랙홀 + 국악 방수미 (콜라보 앨범 「소름」 등)
- YTM: 콜라보 크레딧이 Black Hole(`UCJXby81Qr0ruqh_RR_ZA4kw`) 쪽으로 묶여 있고, 방수미 단독 아티스트 채널은 없음 → `bang-sumi`는 메타만, PL은 블랙홀·병합 경로

## 검수

- [ ] TT 있는 페스티벌이면 `name`이 공식 TT와 같은가
- [ ] TT ≠ 포스터면 TT를 따랐는가
- [ ] `playlists/<id>.json`의 `artistName`이 `artists.json`의 `name`과 같은가
- [ ] 콜라보 슬롯이면 `composedOf`가 채워져 있고, 멤버 id가 `artists.json`에 있는가
- [ ] 콜라보 PL이 전용 파일이거나 멤버 PL 병합으로 듣기 가능한가

출처 URL·로컬 사본은 해당 페스티벌 JSON의 `timetableSource`에 둔다. 문서에 페스티벌별 검수 목록을 쌓지 않는다.
