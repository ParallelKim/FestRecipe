#!/usr/bin/env python3
"""
FestRecipe - Event Video Fetcher

Step 1: {아티스트명} live 검색 → 제목 수집 → LLM으로 공연명 추출
Step 2: {아티스트명} {공연명} live 검색 → 재생목록 + 풀캠 영상 수집
Step 3: 풀캠 영상의 description 전부 수집 → 저장

재생목록 검색:
  YouTube 검색 URL에 sp 파라미터를 사용하여 재생목록 전용 필터링.
  sp는 base64로 인코딩된 바이너리 필터 플래그.
  참고:
      - https://ktsk.xyz/docs/programming/decoding-youtube-filters/
      - https://github.com/yt-dlp/yt-dlp/issues/11192 (yt-dlp playlist search issue)
      - https://github.com/yt-dlp/yt-dlp/issues/2786 (filter for playlists)

  실험으로 확인한 sp 값:
    EgIQAw== → Playlist only
    EgIQAQ=  → Video only
    EgIQAg== → Channel only

  검색 URL 형식:
    https://www.youtube.com/results?search_query={query}&sp=EgIQAw==

  ytsearch{N} 형식은 재생목록 필터링을 지원하지 않으므로
  yt-dlp에 YouTube 검색 URL을 직접 전달하는 방식 사용.

Usage:
  # Phase 2 결과(events.json)에서 읽어서 수집
  python3 fetch_events.py --from-events output/nflying_events.json --artist "엔플라잉"

  # 수동 지정
  python3 fetch_events.py --artist "터치트" --events "2025 Pentaport" "remnant Concert"

  # output/의 모든 events.json 배치 처리
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
SEARCH_LIMIT = 100       # 공연명당 ytsearch 수
PLAYLIST_SEARCH_LIMIT = 20  # 재생목록 검색 수
DETAIL_DELAY = 0.5       # description 수집 요청 간 딜레이 (초)
DEFAULT_YEARS = 5        # 수집 기간 (년)

# YouTube 검색 결과 타입/피처 필터 (sp 파라미터)
# sp는 base64로 인코딩된 바이너리 필터 플래그.
# 참고: https://ktsk.xyz/docs/programming/decoding-youtube-filters/
#
# 구조:
#   - 첫 2 bytes: 헤더 (0x12 + 카운터)
#   - 이후 2 bytes씩 필터 워드
#   - 카운터 bit 0이 1이면 마지막 필터는 3 bytes
#
# Type 필터 (2 bytes):
#   Video:    0x10 0x01
#   Channel:  0x10 0x02
#   Playlist: 0x10 0x03
#   Movie:    0x10 0x04
#
# Features 필터 (2 bytes):
#   Live: 0x40 0x01
#   4K:   0x70 0x01
#   HD:   0x20 0x01
#
# 실험으로 확인한 sp 값:
#   EgIQAw== → Playlist only (Type=Playlist)
#   EgIQAQ=  → Video only (Type=Video)
#   EgIQAg== → Channel only (Type=Channel)
#
# 참고: 검색어에 "live" 키워드를 추가하던 것을 sp의 Live 필터로 대체 가능
#   → 검색어는 아티스트명만 깔끔하게, 필터는 sp로 분리
PLAYLIST_FILTER = "EgIQAw=="
VIDEO_FILTER = "EgIQAQ="


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


# ── Step 2a: 재생목록 검색 ────────────────────────────────────────────
def search_playlists(artist_name, event_name, limit=PLAYLIST_SEARCH_LIMIT):
    """
    아티스트명 + 공연명으로 재생목록 전용 검색.

    YouTube 검색 결과를 재생목록으로만 필터링하기 위해 sp 파라미터 사용.
    sp 파라미터는 base64로 인코딩된 바이너리 필터 플래그.
    참고:
      - https://ktsk.xyz/docs/programming/decoding-youtube-filters/
      - https://github.com/yt-dlp/yt-dlp/issues/11192 (yt-dlp playlist search issue)

    EgIQAw== 바이너리 분석:
      hex: 12 02 10 03
      - 0x12 0x02: YouTube sp 파라미터 헤더
      - 0x10: Type 필터 활성화
      - 0x03: Playlist 타입 (0x01=Video, 0x02=Channel, 0x03=Playlist)

    yt-dlp에 YouTube 검색 URL을 직접 전달하여 재생목록 검색 결과를 얻는다.
    ytsearch{N} 형식은 재생목록 필터링을 지원하지 않으므로 URL 기반 검색 사용.

    반환: list[{"id": playlistId, "title": str}]
    """
    query = f"{artist_name} {event_name} live"
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
        if pid and len(pid) > 10:  # playlist ID는 보통 10자 이상
            playlists.append({"id": pid, "title": e.get("title", "")})

    return playlists


def fetch_playlist_videos(playlist_id, limit=SEARCH_LIMIT):
    """
    재생목록 내부 영상 목록 수집.
    반환: list[{"id": videoId, "title": str}]
    """
    url = f"https://www.youtube.com/playlist?list={playlist_id}"
    r = subprocess.run(
        ["yt-dlp", "--flat-playlist", "--dump-single-json", "--no-warnings",
         "--playlist-end", str(limit), url],
        capture_output=True, text=True, timeout=60
    )
    if r.returncode != 0:
        return []

    data = json.loads(r.stdout)
    videos = []
    for e in data.get("entries", []):
        vid = e.get("id", "")
        if valid_vid(vid):
            videos.append({"id": vid, "title": e.get("title", "")})

    return videos


# ── Step 2b: 풀캠 영상 검색 ───────────────────────────────────────────
def search_full_videos(artist_name, event_name, years=DEFAULT_YEARS, limit=SEARCH_LIMIT):
    """
    아티스트명 + 공연명으로 일반 영상 검색 (풀캠 포함).
    반환: list[{"id": videoId, "title": str}]
    """
    query = f"{artist_name} {event_name} live"
    r = subprocess.run(
        ["yt-dlp", f"ytsearch{limit}:{query}", "--flat-playlist",
         f"--dateafter={date_after(years)}", "--dump-single-json", "--no-warnings"],
        capture_output=True, text=True, timeout=60
    )
    if r.returncode != 0:
        return []

    data = json.loads(r.stdout)
    videos = []
    for e in data.get("entries", []):
        vid = e.get("id", "")
        if valid_vid(vid):
            videos.append({"id": vid, "title": e.get("title", "")})

    return videos


# ── Step 3: description 순차 수집 ─────────────────────────────────────
async def _fetch_one_detail(vid):
    """단일 영상 description 수집. 타임아웃 20초."""
    try:
        p = await asyncio.create_subprocess_exec(
            "yt-dlp",
            f"https://www.youtube.com/watch?v={vid}",
            "--dump-single-json", "--no-playlist", "--no-warnings",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        o, _ = await asyncio.wait_for(p.communicate(), 20)
        return json.loads(o) if p.returncode == 0 else None
    except (asyncio.TimeoutError, json.JSONDecodeError):
        return None


async def fetch_all_details(entries, delay=DETAIL_DELAY):
    """
    영상 목록의 description을 순차 + 딜레이로 수집.
    YouTube rate limit 대응: 동시 요청 없이 순차 처리.
    """
    vids = [e["id"] for e in entries]
    results = {}

    print(f"  [detail] {len(vids)} videos, sequential (delay={delay}s)")

    for i, vid in enumerate(vids):
        d = await _fetch_one_detail(vid)
        if d:
            results[vid] = d

        if (i + 1) % 10 == 0 or i + 1 == len(vids):
            print(f"    [detail] {i+1}/{len(vids)}", end="\r")

        await asyncio.sleep(delay)

    print()
    print(f"  [detail] done: {len(results)}/{len(vids)} with description")
    return results


# ── 저장 ──────────────────────────────────────────────────────────────
def save_event_result(artist_id, event_name, event_date, playlists_data, full_videos_data):
    """
    공연별 결과 저장.

    playlists_data: [{"playlistId", "playlistTitle", "videos": [{videoId, title}]}]
    full_videos_data: [{"videoId", "title", "description", "url", "uploader", ...}]
    """
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    slug = slugify(event_name)
    out_path = OUTPUT_DIR / f"{artist_id}_{slug}.json"

    output = {
        "artistId": artist_id,
        "eventName": event_name,
        "eventDate": event_date,
        "fetchedAt": datetime.now().isoformat(),
        "playlists": playlists_data,
        "fullVideos": full_videos_data,
        "stats": {
            "playlistCount": len(playlists_data),
            "playlistVideoCount": sum(len(p["videos"]) for p in playlists_data),
            "fullVideoCount": len(full_videos_data),
            "fullVideoWithDesc": sum(1 for v in full_videos_data if v.get("description")),
        },
    }

    out_path.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    stats = output["stats"]
    print(f"  [save] {event_name[:40]:40s} → {out_path.name}")
    print(f"         playlists: {stats['playlistCount']} ({stats['playlistVideoCount']} videos)")
    print(f"         full videos: {stats['fullVideoCount']} ({stats['fullVideoWithDesc']} with desc)")

    return out_path


# ── Phase 2 결과 파일 로드 ────────────────────────────────────────────
def load_events(events_path):
    """Phase 2 결과 로드. 기대 형식: list[{"event_name": str, "date": str}]"""
    return json.loads(Path(events_path).read_text())


# ── 메인 오케스트레이터 ───────────────────────────────────────────────
async def fetch_event(artist_name, event_name, event_date, years=DEFAULT_YEARS):
    """
    단일 공연에 대한 전체 수집:
      1. 재생목록 검색 → 내부 영상 수집
      2. 풀캠 영상 검색 → description 수집
    """
    print(f"\n  [{artist_name}] {event_name}")

    # Step 2a: 재생목록 수집
    print(f"    searching playlists...")
    playlists = search_playlists(artist_name, event_name)
    print(f"    playlists: {len(playlists)}")

    playlists_data = []
    for pl in playlists:
        videos = fetch_playlist_videos(pl["id"])
        playlists_data.append({
            "playlistId": pl["id"],
            "playlistTitle": pl["title"],
            "playlistUrl": f"https://www.youtube.com/playlist?list={pl['id']}",
            "videoCount": len(videos),
            "videos": videos,
        })
        print(f"      [{pl['title'][:40]}] {len(videos)} videos")

    # Step 2b: 풀캠 영상 수집
    print(f"    searching full videos...")
    full_videos = search_full_videos(artist_name, event_name, years=years)
    print(f"    full videos: {len(full_videos)}")

    # 재생목록에 이미 포함된 영상은 제외
    pl_vids = set()
    for pl in playlists_data:
        for v in pl["videos"]:
            pl_vids.add(v["id"])

    full_videos_unique = [v for v in full_videos if v["id"] not in pl_vids]
    print(f"    unique full videos: {len(full_videos_unique)} (excluded {len(full_videos) - len(full_videos_unique)} duplicates)")

    # Step 3: description 수집
    if full_videos_unique:
        details = await fetch_all_details(full_videos_unique)
    else:
        details = {}

    # 결과 조립
    full_videos_data = []
    for v in full_videos_unique:
        vid = v["id"]
        title = v["title"]
        desc = ""
        uploader = ""
        upload_date = None
        duration = None
        view_count = None

        if vid in details:
            d = details[vid]
            title = d.get("title", title)
            desc = d.get("description", "") or ""
            uploader = d.get("uploader", "")
            upload_date = d.get("upload_date")
            duration = d.get("duration")
            view_count = d.get("view_count")

        full_videos_data.append({
            "videoId": vid,
            "title": title,
            "description": desc,
            "url": f"https://www.youtube.com/watch?v={vid}",
            "uploader": uploader,
            "uploadDate": upload_date,
            "duration": duration,
            "viewCount": view_count,
        })

    return playlists_data, full_videos_data


async def fetch_all(artist, events, years=DEFAULT_YEARS):
    """전체 공연에 대해 순차 수집."""
    artist_name = artist["name"]
    artist_id = artist["id"]
    print(f"\n{'#'*60}\n# {artist_name} ({artist_id})\n# events: {len(events)}\n{'#'*60}")

    results = []
    for ev in events:
        event_name = ev.get("event_name", "")
        event_date = ev.get("date", "unknown")
        if not event_name:
            continue

        playlists_data, full_videos_data = await fetch_event(
            artist_name, event_name, event_date, years=years
        )

        save_event_result(artist_id, event_name, event_date, playlists_data, full_videos_data)
        results.append({"eventName": event_name, "playlists": len(playlists_data), "fullVideos": len(full_videos_data)})

    return results


# ── CLI ───────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="FestRecipe Event Video Fetcher")
    parser.add_argument("--from-events", type=str, help="Phase 2 events.json 파일 경로")
    parser.add_argument("--artist", type=str, help="아티스트명")
    parser.add_argument("--events", nargs="+", type=str, help="수동 지정 공연명 목록")
    parser.add_argument("--all", action="store_true", help="output/의 모든 events.json 배치 처리")
    parser.add_argument("--years", type=int, default=DEFAULT_YEARS, help=f"수집 기간 (기본: {DEFAULT_YEARS}년)")
    a = parser.parse_args()

    if not check_yt_dlp():
        sys.exit(1)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    artists = json.loads(ARTISTS_JSON.read_text())

    # ── 모드 1: Phase 2 결과 파일 ──
    if a.from_events:
        events = load_events(a.from_events)
        artist_id = Path(a.from_events).stem.replace("_events", "")
        artist = next((x for x in artists if x["id"] == artist_id), {"id": artist_id, "name": artist_id})
        asyncio.run(fetch_all(artist, events, years=a.years))
        return

    # ── 모드 2: 수동 지정 ──
    if a.artist and a.events:
        artist_id = a.artist.lower().replace(" ", "-")
        artist = {"id": artist_id, "name": a.artist}
        events = [{"event_name": e, "date": "unknown"} for e in a.events]
        asyncio.run(fetch_all(artist, events, years=a.years))
        return

    # ── 모드 3: 전체 배치 ──
    if a.all:
        events_files = sorted(OUTPUT_DIR.glob("*_events.json"))
        if not events_files:
            print("[ERR] No *_events.json in output/")
            sys.exit(1)
        print(f"Found {len(events_files)} events files\n")
        for ef in events_files:
            artist_id = ef.stem.replace("_events", "")
            artist = next((x for x in artists if x["id"] == artist_id), {"id": artist_id, "name": artist_id})
            events = load_events(ef)
            asyncio.run(fetch_all(artist, events, years=a.years))
        return

    parser.print_help()


if __name__ == "__main__":
    main()
