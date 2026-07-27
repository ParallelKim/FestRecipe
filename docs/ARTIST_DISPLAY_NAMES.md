# 아티스트 표기명 가이드 (MVP)

UI·타임테이블·플레이리스트 제목에 쓰는 이름은
`public/data/artists.json`의 **`name` 필드를 사람이 직접 검수·수정**한다.

자동 알고리즘으로 고르지 않는다. YTM 수집명(`ytmName`)은 검색·매칭 참고용이다.

## 출처 우선순위 (펜타포트 2026)

출연 아티스트 조사·타임테이블 반영에 쓴 소스를 표기명의 **1차 근거**로 둔다.

| 순위 | 소스 | 위치 / URL |
|------|------|------------|
| 1 | **일자별 공식 타임테이블** (금·토·일) | `sample/pentaport-timetable/pentaport-2026-{july31,august1,august2}-timetable.png` |
| 2 | 최종 라인업 포스터 | `sample/pentaport-timetable/pentaport-2026-final-lineup-poster.png` |
| 3 | 가이드 페이지 (이미지·일정 안내) | https://songdo.life/guides/songdo-pentaport-rock-festival-2026-guide |
| — | 공식 사이트 (메타) | https://www.pentaport.co.kr |

festival JSON에도 동일 출처가 기록되어 있다 (`timetableSource`).

### 충돌 시 규칙

- **일자별 타임테이블에 적힌 철자·대소문자·한글/영문 선택을 `name`으로 채택**한다.
- 포스터는 라틴 브랜드가 많은 편이다 (예: `HYUKOH`, `Band Nah`).  
  같은 아티스트가 TT에는 `혁오`, `나상현씨밴드`로 나오면 **TT를 따른다**.
- 원어 병기(예: `Flesh Juicer 血肉果汁機`, `Song Dongye 宋冬野`)는 TT에 있으면 **그대로** 둔다.
- 비전시 프로그램(개막 행사, 펜타로빅, 드리머부스 등)은 아티스트 `name` 대상이 아니다.

## 필드 역할

| 필드 | 역할 |
|------|------|
| `name` | **공식 화면 표기** (위 출처로 큐레이션, SSOT) |
| `englishName` | 로마자/영문 검색·YTM 매칭용 |
| `koreanName` | (선택) 한글 통용명 참고 |
| `ytmName` | 수집 당시 YouTube Music 아티스트명 원문 (참고만) |
| `country` | 해외 아티스트만 ISO 코드. 없으면 국내로 간주 |

## 검수 체크리스트

- [ ] `name`이 해당 페스티벌 **공식 TT(또는 라인업 포스터) 표기와 같은가**
- [ ] TT와 포스터가 다르면 TT를 따랐는가
- [ ] YTM명(`ytmName`)과 달라도, TT 근거가 있으면 TT 우선인가
- [ ] `playlists/<id>.json`의 `artistName`이 `artists.json`의 `name`과 같은가

## 수정 방법

```bash
# 1) sample/… 공식 TT 이미지를 눈으로 확인
# 2) public/data/artists.json 의 name 수정
# 3) public/data/playlists/<id>.json 의 artistName 맞춤
# 4) 커밋
```

수집 파이프라인(`collector/`)은 YTM 매칭용으로 `englishName` / `ytmBrowseId`를 쓰고,
**화면용 `name`을 덮어쓰지 않도록** 유지한다.
