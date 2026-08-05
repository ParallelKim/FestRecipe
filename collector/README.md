# FestRecipe Collector

## 현재 MVP 목표

셋리스트/예상 재생목록 고도화는 **나중으로 미룬다.**  
지금은 아래 3단계만 안정적으로 구축한다.

```
페스티벌 정보 수집
    → 아티스트 리스트업
    → 아티스트 발매곡 수집 (YouTube Music 기반)
```

발매곡은 **YouTube Music 카탈로그** 를 기준으로 하며,  
수집에는 **`ytmusicapi`** 로 아티스트/앨범/트랙을 조회한다.  
(`YT_API_KEY`가 있으면 `videos.list`로 duration 등을 선택 보강)

---

## 파이프라인

| Step | 스크립트 | 입력 | 출력 |
|------|----------|------|------|
| 1. 페스티벌 | (큐레이션) `public/data/festivals/*.json` | 페스티벌 메타 + 라인업/타임테이블 | 동일 경로 |
| 2. 아티스트 | `sync_artists.py` | festivals/*.json | `artists.json` 정합 검사, `output/_artist_index.json` |
| 3. 발매곡 | `fetch_releases.py` | artists (+ optional `YT_API_KEY`) | `output/{artistId}/releases.json` |
| 4. 대표곡 PL | `build_playlists.py` | releases + 타임테이블 니중도 | `public/data/playlists/{id}.json` |

오케스트레이션:

```bash
pip install -r requirements.txt

# Step 1→2: 페스티벌에서 아티스트 동기화 (+ allArtists 채우기)
python3 pipeline.py --write-festivals

# Step 1→3: 동기화 후 페스티벌 아티스트 발매곡 수집
python3 pipeline.py --write-festivals --releases

# 소량 테스트 + 대표곡 플레이리스트
python3 pipeline.py --releases --playlists --artist-id hyukoh,khruangbin,silica-gel
python3 build_playlists.py --artist-id hyukoh,khruangbin,silica-gel
```

### Step 4 — 대표곡 플레이리스트

인지도는 **타임테이블 슬롯이 늦을수록 높다**고 간주한다.

| 티어 | 기준 (상대 순위) | 곡 수 |
|------|------------------|-------|
| high | 가장 늦은 상위 25% | 5 |
| mid | 상위 25~60% | 4 |
| low | 나머지 / 타임테이블 없음 | 3 |

곡 선정은 YouTube Music Songs 플레이리스트 **인기순**을 사용한다.  
결과는 `public/data/playlists/{artistId}.json` 으로 프론트에 제공된다.

### Step 1 — 페스티벌 정보

현재는 공식 라인업/타임테이블을 바탕으로 `public/data/festivals/{id}.json` 을 관리한다.

필수 필드: `id`, `name`, `startDate`, `endDate`, `location`, `lineupStage`, `lineup`  
아티스트 참조는 `lineup[].slots[].artistId` (또는 `lineup[].artists[]`) 로 둔다.

`index.json` 의 `festivals` 배열과 파일명이 일치해야 한다.

### Step 2 — 아티스트 리스트업

```bash
python3 sync_artists.py
python3 sync_artists.py --write-festivals   # allArtists / day.artists 자동 채움
python3 sync_artists.py --add-missing       # 미등록 ID를 artists.json placeholder로 추가
```

- 페스티벌에 등장하는 artistId를 모아 `_artist_index.json` 에 저장
- `artists.json` 누락 / index 불일치를 경고
- placeholder로 추가된 항목의 **`name`은 사람이 검수**한다 → [`docs/ARTIST_DISPLAY_NAMES.md`](../docs/ARTIST_DISPLAY_NAMES.md)
- 수집 파이프라인은 YTM 매칭용 필드를 쓰며, 큐레이션된 화면용 `name`을 덮어쓰지 않는다
- **콜라보 유닛** (`composedOf`): TT가 `A X B`처럼 한 슬롯이면 유닛 id 하나로 두고 멤버를 `composedOf`에 적는다. 전용 PL이 없으면 프론트가 멤버 PL을 병합한다. 파이프라인은 `composedOf`/`playlistMode`를 지우지 않는다. 예: `blackhole-x-bangsumi` → [`docs/ARTIST_DISPLAY_NAMES.md`](../docs/ARTIST_DISPLAY_NAMES.md) §콜라보·피처링

### Step 3 — YouTube Music 발매곡

```bash
python3 fetch_releases.py --artist-id hyukoh
python3 fetch_releases.py --artist-id hyukoh,khruangbin,silica-gel
python3 fetch_releases.py --from-index --limit 5
python3 fetch_releases.py --all
```

수집 전략 (`ytmusicapi`):

1. YouTube Music 아티스트 검색 → `browseId` 확정
2. albums / singles 목록 확장 (`get_artist_albums`)
3. 각 앨범·싱글의 트랙 (`get_album`) + songs 플레이리스트 병합
4. LIVE 앨범 트랙 제외(기본) 후 `releases.json` 저장
5. (선택) `YT_API_KEY` 있으면 `videos.list`로 조회수·게시일 보강

결과 스키마 요약:

```json
{
  "artistId": "hyukoh",
  "source": "youtube_music",
  "provider": "ytmusicapi",
  "ytmArtist": { "browseId": "UC...", "name": "HYUKOH", "url": "https://music.youtube.com/channel/UC..." },
  "releaseGroups": [{ "title": "23", "releaseType": "album", "year": "2017" }],
  "releases": [
    {
      "videoId": "...",
      "songTitle": "TOMBOY",
      "albumTitle": "23",
      "youtubeMusicUrl": "https://music.youtube.com/watch?v=..."
    }
  ]
}
```

---

## 환경 변수

| 변수 | 설명 |
|------|------|
| `YT_API_KEY` | (선택) YouTube Data API v3 키 — duration/조회수 보강용 |

---

## 향후 고도화 (보류)

아래 스크립트는 **예상 셋리스트 / 라이브 아카이브** 용이며 MVP 밖이다.  
제품 경계는 [`docs/PRODUCT.md`](../docs/PRODUCT.md).

| 파일 | 상태 | 설명 |
|------|------|------|
| `collect.py` | 보류 | 과거 공연 영상·셋리스트 후보 수집 (yt-dlp) |
| `fetch_events.py` | 보류 | 공연명 기반 검색 → description 수집 |
| `namu_crawler.py` | 보류 | 나무위키 공연 이력 (CSR 이슈로 보류) |

고도화 시 예상 흐름:

1. 발매곡 카탈로그(MVP)를 기준으로 곡명 정규화
2. 공연 영상 description / 타임스탬프에서 셋리스트 추출
3. LLM 정규화 → 예상 셋리스트 → YouTube 재생목록 링크

---

## 디렉토리

```
collector/
├── pipeline.py          # MVP 오케스트레이터
├── sync_artists.py      # Step 2
├── fetch_releases.py    # Step 3 (YouTube Music / Search API)
├── yt_api.py            # YouTube Data API v3 공통 클라이언트
├── requirements.txt
├── collect.py           # [보류] 셋리스트 고도화
├── fetch_events.py      # [보류] 공연 영상 고도화
├── namu_crawler.py      # [보류]
└── output/              # gitignored
    ├── _artist_index.json
    ├── _releases_summary.json
    └── {artistId}/releases.json
```

## 의존성

```bash
pip install -r requirements.txt
```

- Python 3.10+
- YouTube Data API v3 (`YT_API_KEY`)
- yt-dlp: 고도화 스크립트(`collect.py` / `fetch_events.py`)에서만 필요
