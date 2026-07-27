# 아티스트 표기명 가이드 (MVP)

UI·타임테이블·플레이리스트 제목에 쓰는 이름은
`public/data/artists.json`의 **`name` 필드를 사람이 직접 검수·수정**한다.

자동 알고리즘으로 고르지 않는다. YTM 수집명(`ytmName`)은 검색·매칭 참고용이다.

## 원칙: 타임테이블이 있으면 TT 표기를 따른다

페스티벌 `lineupStage`가 `stage3_timetable`이면 **공식 타임테이블에 적힌 철자·대소문자·한글/영문 선택**이 `name`의 SSOT다.
라인업 포스터·YTM명·통용 표기와 달라도 TT를 우선한다.

## 출처 우선순위 (펜타포트 2026)

| 순위 | 소스 | 위치 / URL |
|------|------|------------|
| 1 | **공식 사이트 타임테이블** (금·토·일 이미지) | https://pentaport.co.kr/108 |
| 2 | 동일 TT의 로컬 사본 | `sample/pentaport-timetable/pentaport-2026-{july31,august1,august2}-timetable.png` |
| 3 | 최종 라인업 포스터 | `sample/pentaport-timetable/pentaport-2026-final-lineup-poster.png` |
| 4 | 가이드 페이지 (보조) | https://songdo.life/guides/songdo-pentaport-rock-festival-2026-guide |

festival JSON `timetableSource`에도 동일 출처가 기록되어 있다.

### 충돌 시 규칙

- **일자별 타임테이블에 적힌 철자·대소문자·한글/영문 선택을 `name`으로 채택**한다.
- 포스터는 라틴 브랜드가 많은 편이다 (예: `HYUKOH`, `Band Nah`).  
  같은 아티스트가 TT에는 `혁오`, `나상현씨밴드`로 나오면 **TT를 따른다**.
- 원어 병기(예: `Flesh Juicer 血肉果汁機`, `Song Dongye 宋冬野`)는 TT에 있으면 **그대로** 둔다.
  TT가 두 줄(영문 / 원어)이어도 `name`에는 한 줄로 이어 쓴다.
- 비전시 프로그램(개막 행사, 펜타로빅, 드리머부스 등)은 아티스트 `name` 대상이 아니다.

### 펜타포트 2026 검수 메모 (공식 `/108` 기준)

공식 TT와 맞춰 둔 표기 예:

- `포져군단` (≠ 포저군단)
- `우륵과 풍각쟁이들`
- `never young beach`, `the geeks`, `baan` (소문자 유지)
- `MASSIVE ATTACK`, `PIXIES`, `KHRUANGBIN`, `CASUALLY CONNECTED` (대문자 유지)
- `팻햄스터 & 캉뉴` (`&` 유지)

## 필드 역할

| 필드 | 역할 |
|------|------|
| `name` | **공식 화면 표기** (위 출처로 큐레이션, SSOT) |
| `englishName` | 로마자/영문 검색·YTM 매칭용 |
| `koreanName` | (선택) 한글 통용명 참고 |
| `ytmName` | 수집 당시 YouTube Music 아티스트명 원문 (참고만) |
| `country` | 해외 아티스트만 ISO 코드. 없으면 국내로 간주 |

## 검수 체크리스트

- [ ] `lineupStage === stage3_timetable`이면 `name`이 **공식 TT** 표기와 같은가
- [ ] 펜타포트는 https://pentaport.co.kr/108 이미지를 봤는가
- [ ] TT와 포스터가 다르면 TT를 따랐는가
- [ ] YTM명(`ytmName`)과 달라도, TT 근거가 있으면 TT 우선인가
- [ ] `playlists/<id>.json`의 `artistName`이 `artists.json`의 `name`과 같은가

## 수정 방법

```bash
# 1) 공식 TT(펜타포트: https://pentaport.co.kr/108) 또는 sample/… 사본을 눈으로 확인
# 2) public/data/artists.json 의 name 수정
# 3) public/data/playlists/<id>.json 의 artistName·playlistTitle 맞춤
# 4) 커밋
```

수집 파이프라인(`collector/`)은 YTM 매칭용으로 `englishName` / `ytmBrowseId`를 쓰고,
**화면용 `name`을 덮어쓰지 않도록** 유지한다.
