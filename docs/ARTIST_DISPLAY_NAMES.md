# 아티스트 표기명 가이드 (MVP)

UI·타임테이블·플레이리스트 제목에 쓰는 이름은
`public/data/artists.json`의 **`name` 필드를 사람이 직접 검수·수정**한다.

자동 알고리즘으로 “완벽히” 고르지 않는다. YTM 수집명은 참고용이다.

## 필드 역할

| 필드 | 역할 |
|------|------|
| `name` | **공식 화면 표기** (큐레이션 대상, SSOT) |
| `englishName` | 로마자/영문 검색·매칭용 |
| `koreanName` | (선택) 한글 통용명 참고 |
| `ytmName` | 수집 당시 YouTube Music 아티스트명 원문 (참고·검수용) |
| `country` | 해외 아티스트만 ISO 코드. 없으면 국내로 간주 |

## 선정 가이드 (검수 시)

1. **해외 액트** (`country` 있음)  
   - 한글 음독 금지. YTM/원어/통용 로마자를 `name`에 둔다.  
   - 예: `Khruangbin`, `Pixies`, `宋冬野`, `never young beach`

2. **국내 — 라틴 브랜드**  
   - 채널·음원이 라틴 브랜드면 그대로.  
   - 예: `QWER`, `HYUKOH`, `LEENALCHI`, `Broken Valentine`

3. **국내 — 한글 통용명**  
   - 팬·언론이 한글로 부르는 이름이 표준이면 한글.  
   - 예: `나상현씨밴드`, `쏜애플`, `향우회`, `백현진`  
   - YTM이 `Socialclub Hyangwu`, `챈슬러, 권진아`처럼 어색하면 **무시하고 한글 통용명**

4. **YTM을 그대로 쓰면 안 되는 경우**  
   - 콜라보 나열 (`챈슬러, 권진아`)  
   - 핸들/축약 (`westealoranges`, `Fat Hamster`만)  
   - 번역 병기만 긴 경우 → 주표기만 남기기

## 검수 체크리스트

새 페스티벌/아티스트를 넣을 때:

- [ ] 타임테이블에 한글 음독 해외명이 남아 있지 않은가
- [ ] 국내 솔로·한글 밴드가 어색한 로마자만으로 보이지 않는가
- [ ] `ytmName`과 `name`이 다르면, 차이가 의도된 큐레이션인가
- [ ] 플레이리스트 JSON의 `artistName`이 `artists.json`의 `name`과 같은가

## 수정 방법

```bash
# 1) public/data/artists.json 의 name 수정
# 2) 해당 public/data/playlists/<id>.json 의 artistName 도 맞춤 (선택이지만 권장)
# 3) 커밋
```

수집 파이프라인(`collector/`)은 YTM 매칭용으로 `englishName` / `ytmBrowseId`를 쓰고,
**화면용 `name`을 덮어쓰지 않도록** 유지한다.
