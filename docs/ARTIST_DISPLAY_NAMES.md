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

## 검수

- [ ] TT 있는 페스티벌이면 `name`이 공식 TT와 같은가
- [ ] TT ≠ 포스터면 TT를 따랐는가
- [ ] `playlists/<id>.json`의 `artistName`이 `artists.json`의 `name`과 같은가

출처 URL·로컬 사본은 해당 페스티벌 JSON의 `timetableSource`에 둔다. 문서에 페스티벌별 검수 목록을 쌓지 않는다.
