#!/usr/bin/env python3
"""
FestRecipe - Event Video Fetcher

아티스트별 공연 영상 + 재생목록 + description을 수집하여
Firestore 업로드용 정규화된 스키마로 저장한다.

스텝별 결과물:
  Step 1 (collect.py): 아티스트명 live 검색 → 제목 수집
  Step 2 (collect.py): 제목 → LLM으로 공연명 추출 → events.json + queries.json
  Step 3 (fetch_events.py): 공연명 기반 쿼리 확장 → 검색 → description 수집

디렉토리 구조:
  output/
    {artistId}/
      events.json              ← 공연명 목록 [{event_name, date, source_titles}]
      queries.json             ← 쿼리 확장 목록 [{query, strategy, event_name}]
      search_results/
        {eventSlug}/
          search.json          ← 검색 결과 [{query, full_videos, playlists}]
          descriptions.json    ← description 목록 [{videoId, title, description, timestamps}]

Usage:
  python3 fetch_events.py --artist "소음발광"
  python3 fetch_events.py --artist "소음발광" --event "2025 Pentaport Rock Festival"
  python3 fetch_events.py --all
"""

import subprocess
import json
import argparse
import asyncio
import re
import sys
from datetime import datetime, timedelta
from pathlib import Path

# ── paths ──────────────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
ARTISTS_JSON = PROJECT_ROOT / "public" / "data" / "artists.json"
OUTPUT_DIR = SCRIPT_DIR / "output"

# ── constants ──────────────────────────────────────────────────────────
SEARCH_LIMIT = 100
PLAYLIST_SEARCH_LIMIT = 20
DETAIL_DELAY = 0.5
DEFAULT_YEARS = 5

# YouTube sp 파라미터 (base64 인코딩된 바이너리 필터)
# 참고: https://ktsk.xyz/docs/programming/decoding-youtube-filters/
PLAYLIST_FILTER = "EgIQAw=="   # Playlist only
VIDEO_FILTER = "EgIQAQ="       # Video only


# ── helpers ────────────────────────────────────────────────────────────
def check_yt_dlp():
    try:
        r = subprocess.run(["yt-dlp", "--version"], capture_output=True, text=True, timeout=10)
        print(f"[yt-dlp] {r.stdout.strip()}")
        return True
    except FileNotFoundError:
        print("[ERROR] yt-dlp not found")
        return False


def valid_vid(vid):
    return bool(vid) and len(vid) == 11


def slugify(text):
    text = re.sub(r"[^\w\s-]", "", text.lower())
    return re.sub(r"[\s_]+", "-", text.strip())[:60]


def date_after(years):
    return (datetime.now() - timedelta(days=years * 365)).strftime("%Y%m%d")


def artist_dir(artist_id):
    d = OUTPUT_DIR / artist_id
    d.mkdir(parents=True, exist_ok=True)
    return d


# ── 쿼리 확장 ──────────────────────────────────────────────────────────
def expand_queries(artist_name, event_name):
    """
    공연명으로부터 검색 쿼리를 확장한다.
    날짜를 제거하고, 핵심 키워드만 추출하여 다양한 변형을 생성.

    전략:
      1. 공연명 전체 (날짜 제거)
      2. 핵심 키워드만 (페스티벌/콘서트명)
      3. 영문명 (있는 경우)
    """
    queries = []

    # 날짜 제거
    clean = re.sub(r'\d{4}\s*', '', event_name).strip()
    if clean != event_name:
        queries.append({"query": f"{artist_name} {clean} live", "strategy": "date_removed", "event": event_name})
    else:
        queries.append({"query": f"{artist_name} {clean} live", "strategy": "full", "event": event_name})

    # 핵심 키워드 (3단어 이하)
    words = clean.split()
    if len(words) > 3:
        short = ' '.join(words[:3])
        queries.append({"query": f"{artist_name} {short} live", "strategy": "short_3words", "event": event_name})

    # 장소명만 (@ 뒤)
    if '@' in clean:
        venue = clean.split('@')[-1].strip()
        queries.append({"query": f"{artist_name} {venue} live", "strategy": "venue_only", "event": event_name})

    # 영문 페스티벌명 (소문자)
    fest_words = ['festival', 'concert', 'fest', 'tour', 'live']
    for fw in fest_words:
        if fw in clean.lower():
            # 영문 키워드 중심 쿼리
            en_part = ' '.join(w for w in words if re.match(r'^[A-Za-z]+$', w) or w.lower() in fest_words)
            if en_part:
                queries.append({"query": f"{artist_name} {en_part} live", "strategy": "english_keywords", "event": event_name})

    return queries


# ── 검색 ──────────────────────────────────────────────────────────────
def search_playlists(artist_name, event_name, limit=PLAYLIST_SEARCH_LIMIT):
    """재생목록 전용 검색. sp 파라미터 사용."""
    clean = re.sub(r'\d{4}\s*', '', event_name).strip()
    words = clean.split()
    if len(words) > 3:
        clean = ' '.join(words[:3])
    query = f"{artist_name} {clean} live"
    url = f"https://www.youtube.com/results?search_query={query}&sp={PLAYLIST_FILTER}"

    r = subprocess.run(
        ["yt-dlp", "--flat-playlist", "--dump-single-json", "--no-warnings",
         "--playlist-end", str(limit), url],
        capture_output=True, text=True, timeout=60
    )
    if r.returncode != 0:
        return []

    data = json.loads(r.stdout)
    playlists = []
    for e in data.get("entries", []):
        pid = e.get("id", "")
        if pid and len(pid) > 10:
            playlists.append({"id": pid, "title": e.get("title", "")})
    return playlists


def fetch_playlist_videos(playlist_id, limit=SEARCH_LIMIT):
    """재생목록 내부 영상 목록."""
    url = f"https://www.youtube.com/playlist?list={playlist_id}"
    r = subprocess.run(
        ["yt-dlp", "--flat-playlist", "--dump-single-json", "--no-warnings",
         "--playlist-end", str(limit), url],
        capture_output=True, text=True, timeout=60
    )
    if r.returncode != 0:
        return []
    data = json.loads(r.stdout)
    return [{"id": e["id"], "title": e.get("title", "")}
            for e in data.get("entries", []) if valid_vid(e.get("id", ""))]


def search_full_videos(query, years=DEFAULT_YEARS, limit=SEARCH_LIMIT):
    """일반 영상 검색. 쿼리를 그대로 사용."""
    r = subprocess.run(
        ["yt-dlp", f"ytsearch{limit}:{query}", "--flat-playlist",
         f"--dateafter={date_after(years)}", "--dump-single-json", "--no-warnings"],
        capture_output=True, text=True, timeout=60
    )
    if r.returncode != 0:
        return []
    data = json.loads(r.stdout)
    return [{"id": e["id"], "title": e.get("title", "")}
            for e in data.get("entries", []) if valid_vid(e.get("id", ""))]


# ── description 수집 ─────────────────────────────────────────────────
async def _fetch_detail(vid):
    try:
        p = await asyncio.create_subprocess_exec(
            "yt-dlp", f"https://www.youtube.com/watch?v={vid}",
            "--dump-single-json", "--no-playlist", "--no-warnings",
            stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE,
        )
        o, _ = await asyncio.wait_for(p.communicate(), 20)
        return json.loads(o) if p.returncode == 0 else None
    except:
        return None


async def fetch_all_details(entries, delay=DETAIL_DELAY):
    """순차 + 딜레이로 description 수집."""
    vids = [e["id"] for e in entries]
    results = {}
    for i, vid in enumerate(vids):
        d = await _fetch_detail(vid)
        if d:
            results[vid] = d
        if (i + 1) % 10 == 0 or i + 1 == len(vids):
            print(f"    [detail] {i+1}/{len(vids)}", end="\r")
        await asyncio.sleep(delay)
    print()
    return results


# ── 코어: 공연별 수집 ─────────────────────────────────────────────────
async def fetch_event(artist_name, event_name, years=DEFAULT_YEARS):
    """
    단일 공연에 대해 쿼리 확장 → 검색 → description 수집.
    모든 쿼리의 결과를 병합하여 저장.
    """
    print(f"\n  [{artist_name}] {event_name}")

    # 쿼리 확장
    queries = expand_queries(artist_name, event_name)
    print(f"    queries: {len(queries)}")
    for q in queries:
        print(f"      [{q['strategy']}] {q['query']}")

    # 모든 쿼리 실행 → 결과 병합
    all_full_videos = {}
    all_playlists = []

    for q in queries:
        query = q["query"]

        # 재생목록
        playlists = search_playlists(artist_name, query)
        for pl in playlists:
            if not any(p["id"] == pl["id"] for p in all_playlists):
                all_playlists.append(pl)

        # 풀캠
        full_videos = search_full_videos(query, years=years)
        for v in full_videos:
            if v["id"] not in all_full_videos:
                all_full_videos[v["id"]] = v

    print(f"    playlists: {len(all_playlists)}, full videos: {len(all_full_videos)}")

    # 재생목록 내부 영상 수집
    playlists_data = []
    for pl in all_playlists:
        videos = fetch_playlist_videos(pl["id"])
        playlists_data.append({
            "playlistId": pl["id"],
            "playlistTitle": pl["title"],
            "playlistUrl": f"https://www.youtube.com/playlist?list={pl['id']}",
            "videoCount": len(videos),
            "videos": videos,
        })

    # 재생목록 중복 제외
    pl_vids = set()
    for pl in playlists_data:
        for v in pl["videos"]:
            pl_vids.add(v["id"])

    full_unique = [v for v in all_full_videos.values() if v["id"] not in pl_vids]
    print(f"    unique full videos: {len(full_unique)} (excluded {len(all_full_videos) - len(full_unique)} dups)")

    # description 수집
    all_entries = full_unique + [{"id": vid, "title": "(playlist)"} for vid in pl_vids]

    if all_entries:
        details = await fetch_all_details(all_entries)
    else:
        details = {}

    # 결과 조립
    full_videos_data = []
    for v in full_unique:
        vid = v["id"]
        d = details.get(vid, {})
        desc = d.get("description", "") or ""
        timestamps = []
        for line in desc.splitlines():
            stripped = line.strip()
            if ":" in stripped:
                # MM:SS 또는 HH:MM:SS 형식이면 후보
                parts = stripped.split(":")
                if 2 <= len(parts) <= 3:
                    try:
                        # 첫 부분이 숫자여야 함
                        int(parts[0])
                        timestamps.append({"raw": stripped[:120]})
                    except ValueError:
                        pass

        full_videos_data.append({
            "videoId": vid,
            "title": d.get("title", v["title"]),
            "description": desc,
            "url": f"https://www.youtube.com/watch?v={vid}",
            "uploader": d.get("uploader", ""),
            "uploadDate": d.get("upload_date"),
            "duration": d.get("duration"),
            "viewCount": d.get("view_count"),
            "hasTimestamps": len(timestamps) >= 3,
            "timestamps": timestamps[:30],
        })

    # 재생목록 영상도 셋리스트 후보로 포함
    playlist_entries = []
    for pl in playlists_data:
        for pv in pl["videos"]:
            if pv["id"] not in all_full_videos:  # 풀캠에 없는 것만
                playlist_entries.append({
                    "videoId": pv["id"],
                    "title": pv["title"],
                    "url": f"https://www.youtube.com/watch?v={pv['id']}",
                    "playlistId": pl["playlistId"],
                    "playlistTitle": pl["playlistTitle"],
                    "source": "playlist",  # description 대신 재생목록 제목 기반
                })

    with_desc = sum(1 for v in full_videos_data if v["description"])
    with_ts = sum(1 for v in full_videos_data if v["hasTimestamps"])
    print(f"    saved: {len(full_videos_data)} videos ({with_desc} desc, {with_ts} with timestamps), {len(playlist_entries)} from playlists")

    return {
        "eventName": event_name,
        "queries": queries,
        "playlists": playlists_data,
        "fullVideos": full_videos_data,
        "playlistEntries": playlist_entries,
        "stats": {
            "queryCount": len(queries),
            "playlistCount": len(playlists_data),
            "playlistVideoCount": sum(p["videoCount"] for p in playlists_data),
            "playlistEntryCount": len(playlist_entries),
            "fullVideoCount": len(full_videos_data),
            "withDescription": with_desc,
            "withTimestamps": with_ts,
        },
    }


# ── 저장 ──────────────────────────────────────────────────────────────
def save_results(artist, event_name, result):
    """공연별 결과를 아티스트 폴더 내 search_results/{eventSlug}/에 저장."""
    a_dir = artist_dir(artist["id"])
    slug = slugify(event_name)
    sr_dir = a_dir / "search_results" / slug
    sr_dir.mkdir(parents=True, exist_ok=True)

    # search.json — 전체 검색 결과
    search_path = sr_dir / "search.json"
    search_data = {
        "artistId": artist["id"],
        "artistName": artist["name"],
        "eventName": event_name,
        "fetchedAt": datetime.now().isoformat(),
        "stats": result["stats"],
        "queries": result["queries"],
        "playlists": result["playlists"],
        "fullVideos": result["fullVideos"],
    }
    search_path.write_text(json.dumps(search_data, ensure_ascii=False, indent=2), encoding="utf-8")

    # descriptions.json — Firestore 업로드용
    # 풀캠 description + 재생목록 영상 제목을 합쳐서 저장
    desc_path = sr_dir / "descriptions.json"
    descriptions = []

    # 풀캠 영상 (description 있는 것)
    for v in result["fullVideos"]:
        if v["description"]:
            descriptions.append({
                "videoId": v["videoId"],
                "title": v["title"],
                "url": v["url"],
                "uploader": v["uploader"],
                "uploadDate": v["uploadDate"],
                "source": "description",
                "description": v["description"],
                "timestamps": v["timestamps"],
                "hasTimestamps": v["hasTimestamps"],
            })

    # 재생목록 영상 (제목 = 셋리스트 후보)
    for e in result.get("playlistEntries", []):
        descriptions.append({
            "videoId": e["videoId"],
            "title": e["title"],
            "url": e["url"],
            "playlistId": e["playlistId"],
            "playlistTitle": e["playlistTitle"],
            "source": "playlist_title",
            "description": None,
            "timestamps": [],
            "hasTimestamps": False,
        })

    desc_path.write_text(json.dumps(descriptions, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"  [save] {sr_dir}")
    return sr_dir


# ── Step 2: events.json + queries.json 로드 ─────────────────────────
def load_events(artist_id):
    """Step 2 결과 로드."""
    events_path = artist_dir(artist_id) / "events.json"
    if not events_path.exists():
        return []
    return json.loads(events_path.read_text())


def save_queries(artist_id, queries_list):
    """쿼리 확장 결과 저장."""
    q_path = artist_dir(artist_id) / "queries.json"
    q_path.write_text(json.dumps(queries_list, ensure_ascii=False, indent=2), encoding="utf-8")


# ── 메인 ───────────────────────────────────────────────────────────────
async def fetch_all(artist, events, years=DEFAULT_YEARS):
    aid = artist["id"]
    aname = artist["name"]
    a_dir = artist_dir(aid)

    print(f"\n{'#'*60}\n# {aname} ({aid})\n# events: {len(events)}\n{'#'*60}")

    # events.json 저장 (Step 2 결과)
    events_path = a_dir / "events.json"
    events_path.write_text(json.dumps(
        [{"event_name": ev.get("event_name", ev) if isinstance(ev, dict) else ev,
          "date": ev.get("date", "unknown") if isinstance(ev, dict) else "unknown"}
         for ev in events],
        ensure_ascii=False, indent=2
    ), encoding="utf-8")

    all_queries = []
    results = []

    for ev in events:
        event_name = ev.get("event_name", ev) if isinstance(ev, dict) else ev
        if not event_name:
            continue

        result = await fetch_event(aname, event_name, years=years)
        all_queries.extend(result["queries"])
        results.append(result)
        save_results(artist, event_name, result)

    # queries.json 저장
    save_queries(aid, all_queries)

    return results


# ── CLI ───────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="FestRecipe Event Video Fetcher")
    parser.add_argument("--artist", type=str, help="아티스트명 (events.json 필요)")
    parser.add_argument("--event", type=str, help="단일 공연명 (수동 지정)")
    parser.add_argument("--events", nargs="+", type=str, help="공연명 목록 (수동)")
    parser.add_argument("--all", action="store_true", help="output/ 아티스트 폴더 전체 처리")
    parser.add_argument("--years", type=int, default=DEFAULT_YEARS)
    a = parser.parse_args()

    if not check_yt_dlp():
        sys.exit(1)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    artists = json.loads(ARTISTS_JSON.read_text())

    # 모드 1: events.json에서 읽기
    if a.artist and not a.event and not a.events:
        matched = [x for x in artists if a.artist.lower() in x.get("name", "").lower()]
        if not matched:
            print(f"[ERR] '{a.artist}' not found"); sys.exit(1)
        artist = matched[0]
        events = load_events(artist["id"])
        if not events:
            print(f"[ERR] No events.json for {artist['id']}. Run collect.py first.")
            sys.exit(1)
        asyncio.run(fetch_all(artist, events, years=a.years))
        return

    # 모드 2: 수동 지정
    if a.artist and (a.event or a.events):
        matched = [x for x in artists if a.artist.lower() in x.get("name", "").lower()]
        artist = matched[0] if matched else {"id": a.artist.lower().replace(" ", "-"), "name": a.artist}
        events = [{"event_name": e, "date": "unknown"} for e in (a.events or [a.event])]
        asyncio.run(fetch_all(artist, events, years=a.years))
        return

    # 모드 3: 전체 배치
    if a.all:
        artist_dirs = [d for d in OUTPUT_DIR.iterdir() if d.is_dir() and (d / "events.json").exists()]
        if not artist_dirs:
            print("[ERR] No artist dirs with events.json"); sys.exit(1)
        for ad in sorted(artist_dirs):
            artist_id = ad.name
            artist = next((x for x in artists if x["id"] == artist_id), {"id": artist_id, "name": artist_id})
            events = json.loads((ad / "events.json").read_text())
            asyncio.run(fetch_all(artist, events, years=a.years))
        return

    parser.print_help()


if __name__ == "__main__":
    main()
