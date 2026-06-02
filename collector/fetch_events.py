#!/usr/bin/env python3
"""
FestRecipe - Event Video Fetcher

아티스트별 공연 영상 + 재생목록 + description을 수집하여
Firestore 업로드용 정규화된 스키마로 저장한다.

스텝별 결과물:
  Step 3 (fetch_events.py): 공연명 기반 쿼리 확장 → 검색 → description 수집
  Step 4 (TODO): LLM으로 셋리스트 정규화

디렉토리 구조:
  output/
    {artistId}/
      events.json              ← 공연명 목록
      queries.json             ← 쿼리 확장 목록
      search_results/
        {eventSlug}/
          search.json          ← 전체 검색 결과
          descriptions.json    ← Firestore 업로드용

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
import os
import urllib.request
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

# YouTube Data API v3
YT_API_KEY = os.environ.get("YT_API_KEY", "AIzaSyDCIAm3leATnX9jbJxfqGXhL4UAIvFVlGk")
YT_API_BASE = "https://www.googleapis.com/youtube/v3"

# YouTube sp 파라미터 (base64 인코딩된 바이너리 필터)
PLAYLIST_FILTER = "EgIQAw=="   # Playlist only


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
    """공연명으로부터 검색 쿼리 확장."""
    queries = []
    clean = re.sub(r'\d{4}\s*', '', event_name).strip()

    if clean != event_name:
        queries.append({"query": f"{artist_name} {clean} live", "strategy": "date_removed"})
    else:
        queries.append({"query": f"{artist_name} {clean} live", "strategy": "full"})

    words = clean.split()
    if len(words) > 3:
        queries.append({"query": f"{artist_name} {' '.join(words[:3])} live", "strategy": "short"})

    if '@' in clean:
        venue = clean.split('@')[-1].strip()
        queries.append({"query": f"{artist_name} {venue} live", "strategy": "venue"})

    return queries


# ── 검색 (yt-dlp) ─────────────────────────────────────────────────────
def search_playlists(artist_name, event_name, limit=PLAYLIST_SEARCH_LIMIT):
    """재생목록 전용 검색."""
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
    return [{"id": e["id"], "title": e.get("title", "")}
            for e in data.get("entries", []) if e.get("id") and len(e["id"]) > 10]


def search_full_videos(query, years=DEFAULT_YEARS, limit=SEARCH_LIMIT):
    """일반 영상 검색."""
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


# ── YouTube Data API v3 배치 수집 ─────────────────────────────────────
def api_fetch_videos(video_ids):
    """
    YouTube Data API v3 videos.list 배치 호출.
    최대 50개씩 분할. quota 비용: 1 unit per batch.
    반환: {videoId: {title, description, duration, viewCount, uploadDate, uploader}}
    """
    if not YT_API_KEY or not video_ids:
        return {}

    results = {}
    for i in range(0, len(video_ids), 50):
        batch = video_ids[i:i+50]
        ids_str = ",".join(batch)
        url = f"{YT_API_BASE}/videos?part=snippet,contentDetails,statistics&id={ids_str}&key={YT_API_KEY}"
        try:
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read())
                for item in data.get("items", []):
                    vid = item["id"]
                    snippet = item.get("snippet", {})
                    details = item.get("contentDetails", {})
                    stats = item.get("statistics", {})
                    results[vid] = {
                        "title": snippet.get("title", ""),
                        "description": snippet.get("description", ""),
                        "duration": details.get("duration", ""),
                        "viewCount": int(stats.get("viewCount", 0)),
                        "uploadDate": snippet.get("publishedAt", ""),
                        "uploader": snippet.get("channelTitle", ""),
                    }
        except Exception as e:
            print(f"    [API ERR] batch {i//50+1}: {e}")
    return results


def api_fetch_playlist_items(playlist_id, max_items=200):
    """YouTube Data API v3 playlistItems.list. 페이지네이션."""
    if not YT_API_KEY:
        return []

    items = []
    page_token = ""
    while len(items) < max_items:
        url = f"{YT_API_BASE}/playlistItems?part=snippet&playlistId={playlist_id}&maxResults=50&key={YT_API_KEY}"
        if page_token:
            url += f"&pageToken={page_token}"
        try:
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read())
                for item in data.get("items", []):
                    snippet = item.get("snippet", {})
                    vid = snippet.get("resourceId", {}).get("videoId", "")
                    if vid:
                        items.append({"id": vid, "title": snippet.get("title", "")})
                page_token = data.get("nextPageToken", "")
                if not page_token:
                    break
        except Exception as e:
            print(f"    [API ERR] pl {playlist_id}: {e}")
            break
    return items[:max_items]


# ── description 수집 (API 우선) ───────────────────────────────────────
def fetch_all_details(vids):
    """YouTube Data API v3 배치 호출로 description 수집."""
    if not vids:
        return {}
    video_ids = [v["id"] for v in vids]
    print(f"    [detail] API batch call for {len(video_ids)} videos...")
    return api_fetch_videos(video_ids)


# ── 코어: 공연별 수집 ─────────────────────────────────────────────────
async def fetch_event(artist_name, event_name, years=DEFAULT_YEARS, videos=None, playlists=None):
    """단일 공연: 이미 검색된 videos/playlists로 description 수집."""
    print(f"\n  [{artist_name}] {event_name}")

    queries = expand_queries(artist_name, event_name)

    # 이미 검색된 결과가 있으면 사용, 아니면 새로 검색
    if videos is None:
        videos = []
        for q in queries:
            videos.extend(search_full_videos(q["query"], years=years))
        # 중복 제거
        seen = set()
        unique = []
        for v in videos:
            if v["id"] not in seen:
                seen.add(v["id"])
                unique.append(v)
        videos = unique

    if playlists is None:
        playlists = []
        for q in queries:
            for pl in search_playlists(artist_name, q["query"]):
                if not any(p["id"] == pl["id"] for p in playlists):
                    playlists.append(pl)
    print(f"    queries: {len(queries)}")

    all_full_videos = {}
    all_playlists = []

    for q in queries:
        query = q["query"]
        for pl in search_playlists(artist_name, query):
            if not any(p["id"] == pl["id"] for p in all_playlists):
                all_playlists.append(pl)
        for v in search_full_videos(query, years=years):
            if v["id"] not in all_full_videos:
                all_full_videos[v["id"]] = v

    print(f"    playlists: {len(all_playlists)}, full videos: {len(all_full_videos)}")

    # 재생목록 내부 영상 (API 배치)
    playlists_data = []
    for pl in all_playlists:
        videos = api_fetch_playlist_items(pl["id"])
        if not videos:
            # 폴백: yt-dlp
            url = f"https://www.youtube.com/playlist?list={pl['id']}"
            r = subprocess.run(
                ["yt-dlp", "--flat-playlist", "--dump-single-json", "--no-warnings",
                 "--playlist-end", "100", url],
                capture_output=True, text=True, timeout=60
            )
            if r.returncode == 0:
                data = json.loads(r.stdout)
                videos = [{"id": e["id"], "title": e.get("title", "")}
                          for e in data.get("entries", []) if valid_vid(e.get("id", ""))]
        playlists_data.append({
            "playlistId": pl["id"],
            "playlistTitle": pl["title"],
            "playlistUrl": f"https://www.youtube.com/playlist?list={pl['id']}",
            "videoCount": len(videos),
            "videos": videos,
        })

    # 중복 제거
    pl_vids = set()
    for pl in playlists_data:
        for v in pl["videos"]:
            pl_vids.add(v["id"])
    full_unique = [v for v in all_full_videos.values() if v["id"] not in pl_vids]

    # description 수집 (API 배치)
    all_entries = full_unique + [{"id": vid} for vid in pl_vids]
    details = fetch_all_details(all_entries)

    # 타임스탬프 파싱 (":" 기반)
    full_videos_data = []
    for v in full_unique:
        vid = v["id"]
        d = details.get(vid, {})
        desc = d.get("description", "") or ""
        timestamps = []
        for line in desc.splitlines():
            stripped = line.strip()
            if ":" in stripped:
                parts = stripped.split(":")
                if 2 <= len(parts) <= 3:
                    try:
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
            "uploadDate": d.get("uploadDate", ""),
            "duration": d.get("duration", ""),
            "viewCount": d.get("viewCount", 0),
            "hasTimestamps": len(timestamps) >= 3,
            "timestamps": timestamps[:30],
        })

    # 재생목록 영상 (셋리스트 후보)
    playlist_entries = []
    for pl in playlists_data:
        for pv in pl["videos"]:
            if pv["id"] not in all_full_videos:
                playlist_entries.append({
                    "videoId": pv["id"],
                    "title": pv["title"],
                    "url": f"https://www.youtube.com/watch?v={pv['id']}",
                    "playlistId": pl["playlistId"],
                    "playlistTitle": pl["playlistTitle"],
                })

    with_desc = sum(1 for v in full_videos_data if v["description"])
    with_ts = sum(1 for v in full_videos_data if v["hasTimestamps"])
    print(f"    saved: {len(full_videos_data)}v ({with_desc} desc, {with_ts} ts), {len(playlist_entries)} pl")

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
    a_dir = artist_dir(artist["id"])
    slug = slugify(event_name)
    sr_dir = a_dir / "search_results" / slug
    sr_dir.mkdir(parents=True, exist_ok=True)

    # search.json
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
    (sr_dir / "search.json").write_text(
        json.dumps(search_data, ensure_ascii=False, indent=2), encoding="utf-8")

    # descriptions.json (Firestore 업로드용)
    descriptions = []
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
    (sr_dir / "descriptions.json").write_text(
        json.dumps(descriptions, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"  [save] {sr_dir}")


def load_events(artist_id):
    p = artist_dir(artist_id) / "events.json"
    return json.loads(p.read_text()) if p.exists() else []


def save_queries(artist_id, queries_list):
    (artist_dir(artist_id) / "queries.json").write_text(
        json.dumps(queries_list, ensure_ascii=False, indent=2), encoding="utf-8")


# ── 메인 ───────────────────────────────────────────────────────────────
async def fetch_all(artist, events, years=DEFAULT_YEARS):
    aid, aname = artist["id"], artist["name"]
    a_dir = artist_dir(aid)
    print(f"\n{'#'*60}\n# {aname} ({aid})\n# events: {len(events)}\n{'#'*60}")

    (artist_dir(aid) / "events.json").write_text(json.dumps(
        [{"event_name": e.get("event_name", e) if isinstance(e, dict) else e,
          "date": e.get("date", "unknown") if isinstance(e, dict) else "unknown"}
         for e in events], ensure_ascii=False, indent=2), encoding="utf-8")

    all_queries = []
    results = {}

    # Step A: 모든 공연의 쿼리 확장
    for ev in events:
        event_name = ev.get("event_name", ev) if isinstance(ev, dict) else ev
        if not event_name:
            continue
        qs = expand_queries(aname, event_name)
        for q in qs:
            q["event"] = event_name
        all_queries.extend(qs)
        results[event_name] = {"queries": qs, "full_videos": [], "playlists": []}

    # Step B: 모든 쿼리 실행 → 결과를 공연별 + unmatched로 분류
    unmatched = []  # 어떤 공연에도 매칭 안 된 영상

    for q in all_queries:
        query = q["query"]
        target_event = q["event"]

        # 재생목록 검색
        for pl in search_playlists(aname, query):
            existing = results[target_event]["playlists"]
            if not any(p["id"] == pl["id"] for p in existing):
                existing.append(pl)

        # 풀캠 검색
        for v in search_full_videos(query, years=years):
            matched = False
            # 어떤 공연의 키워드가 제목에 포함되는지 체크
            for ev in events:
                ev_name = ev.get("event_name", ev) if isinstance(ev, dict) else ev
                # 공연명 핵심 단어 (영문/한글)가 영상 제목에 있는지
                ev_words = set(w.lower() for w in ev_name.split() if len(w) > 2)
                title_lower = v["title"].lower()
                # 절반 이상의 키워드가 제목에 있으면 매칭
                hits = sum(1 for w in ev_words if w in title_lower)
                if hits > 0 and hits >= len(ev_words) // 2:
                    existing = results[ev_name]["full_videos"]
                    if not any(x["id"] == v["id"] for x in existing):
                        existing.append(v)
                    matched = True
                    break

            if not matched:
                unmatched.append(v)

    # Step C: unmatched 중에서 새 공연 후보 수동 확인용 저장
    if unmatched:
        unmatched_path = a_dir / "unmatched.json"
        unmatched_path.write_text(json.dumps(
            [{"id": v["id"], "title": v["title"]} for v in unmatched],
            ensure_ascii=False, indent=2
        ), encoding="utf-8")
        print(f"\n  [unmatched] {len(unmatched)} videos saved to {unmatched_path}")

    # Step D: 각 공연별로 description 수집 & 저장
    for ev in events:
        event_name = ev.get("event_name", ev) if isinstance(ev, dict) else ev
        if not event_name:
            continue
        result = await fetch_event(aname, event_name, years=years, videos=results[event_name]["full_videos"], playlists=results[event_name]["playlists"])
        all_queries.extend(result["queries"])
        save_results(artist, event_name, result)

    save_queries(aid, all_queries)


# ── CLI ───────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--artist", type=str)
    parser.add_argument("--event", type=str)
    parser.add_argument("--events", nargs="+", type=str)
    parser.add_argument("--all", action="store_true")
    parser.add_argument("--years", type=int, default=DEFAULT_YEARS)
    a = parser.parse_args()

    if not check_yt_dlp():
        sys.exit(1)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    artists = json.loads(ARTISTS_JSON.read_text())

    if a.artist and not a.event and not a.events:
        matched = [x for x in artists if a.artist.lower() in x.get("name", "").lower()]
        if not matched:
            print(f"[ERR] '{a.artist}' not found"); sys.exit(1)
        artist = matched[0]
        events = load_events(artist["id"])
        if not events:
            print(f"[ERR] No events.json"); sys.exit(1)
        asyncio.run(fetch_all(artist, events, years=a.years))

    elif a.artist and (a.event or a.events):
        matched = [x for x in artists if a.artist.lower() in x.get("name", "").lower()]
        artist = matched[0] if matched else {"id": a.artist.lower().replace(" ", "-"), "name": a.artist}
        events = [{"event_name": e, "date": "unknown"} for e in (a.events or [a.event])]
        asyncio.run(fetch_all(artist, events, years=a.years))

    elif a.all:
        dirs = [d for d in OUTPUT_DIR.iterdir() if d.is_dir() and (d / "events.json").exists()]
        for d in sorted(dirs):
            aid = d.name
            artist = next((x for x in artists if x["id"] == aid), {"id": aid, "name": aid})
            events = json.loads((d / "events.json").read_text())
            asyncio.run(fetch_all(artist, events, years=a.years))
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
