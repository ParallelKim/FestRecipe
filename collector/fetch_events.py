#!/usr/bin/env python3
"""
FestRecipe - Event Video Fetcher

LLM이 추출한 공연명 각각에 대해 병렬로 검색하고,
검색된 모든 영상의 description을 한꺼번에 비동기로 수집한다.

파이프라인:
  Step 1: 전체 공연명으로 동시에 ytsearch 날리기 (async subprocess)
  Step 2: 검색 결과 전체 영상 ID에서 중복 제거
  Step 3: 모든 영상의 description을 비동기로 수집 (asyncio, conc=30)

Usage:
  # Phase 2 결과 파일에서 읽어서 수집
  python3 fetch_events.py --from-events output/nflying_events.json --artist "엔플라잉"

  # 수동 지정
  python3 fetch_events.py --artist "터치트" --events "2025 Pentaport" "HIGHLIGHT 2022 Concert"

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
DETAIL_CONCURRENCY = 50  # description 동시 요청 수
DEFAULT_YEARS = 5


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


# ── Step 1: 병렬 검색 ────────────────────────────────────────────────
async def _search_one_event(sem, artist_name, event_name, date_after):
    """
    단일 공연명에 대해 ytsearch를 비동기 subprocess로 실행.
    반환: list[{"id": str, "title": str, "eventName": str}]
    """
    async with sem:
        query = f"{artist_name} {event_name}"
        args = [
            "yt-dlp",
            f"ytsearch{SEARCH_LIMIT}:{query}",
            "--flat-playlist",
            f"--dateafter={date_after}",
            "--dump-single-json",
            "--no-warnings",
        ]
        try:
            p = await asyncio.create_subprocess_exec(
                *args,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            o, _ = await asyncio.wait_for(p.communicate(), 60)
            if p.returncode != 0:
                return []
            data = json.loads(o)
            results = []
            for e in data.get("entries", []):
                vid = e.get("id", "")
                if valid_vid(vid):
                    results.append({
                        "id": vid,
                        "title": e.get("title", ""),
                        "eventName": event_name,
                    })
            return results
        except (asyncio.TimeoutError, json.JSONDecodeError):
            return []


async def parallel_search_all_events(artist_name, events, years=DEFAULT_YEARS):
    """
    전체 공연명에 대해 동시에 ytsearch를 날린다.

    동시 실행 수: len(events) 전부 — YouTube 측 속도 제한에 의해
    자체 throttling이 걸리므로 semaphore는 넉잡하게 (min(len(events), 10)).
    """
    date_after = (
        datetime.now() - timedelta(days=years * 365)
    ).strftime("%Y%m%d")

    # 동시 검색 수: 너무 많으면 YouTube가 블록하므로 최대 10
    max_conc = min(len(events), 10)
    sem = asyncio.Semaphore(max_conc)

    tasks = [
        _search_one_event(sem, artist_name, ev["event_name"], date_after)
        for ev in events
    ]

    print(f"  [search] {len(events)} events, concurrency={max_conc}")

    # 진행률 표시하며 수집
    all_results = []
    done, total = 0, len(tasks)
    for coro in asyncio.as_completed(tasks):
        results = await coro
        done += 1
        print(f"    [search] {done}/{total} (+{len(results)})", end="\r")
        all_results.extend(results)
    print()

    # 중복 제거 (같은 영상이 여러 공연 검색에 나올 수 있음)
    seen = set()
    deduped = []
    dup_count = 0
    for entry in all_results:
        if entry["id"] not in seen:
            seen.add(entry["id"])
            deduped.append(entry)
        else:
            dup_count += 1

    print(f"  [search] total: {len(all_results)} → deduped: {len(deduped)} (dups: {dup_count})")
    return deduped


# ── Step 2: description 병렬 수집 ────────────────────────────────────
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


async def parallel_fetch_all_details(entries, delay=1.5):
    """
    검색된 모든 영상의 description을 순차 + 딜레이로 수집.

    YouTube rate limit 대응:
    - 동시 요청 없이 순차 처리
    - 요청 간 delay (기본 1.5초)
    - 개별 타임아웃 20초

    TODO: delay를 환경변수로 뺄 수 있도록 개선
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
    print(f"  [detail] done: {len(results)}/{len(vids)} with metadata")
    return results
# ── 저장 ──────────────────────────────────────────────────────────────
def save_results(artist, events, entries, details):
    """공연별로 결과 분리하여 저장."""
    artist_id = artist["id"]
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # entry를 eventName별로 그룹
    event_groups = {}
    for entry in entries:
        ev_name = entry["eventName"]
        event_groups.setdefault(ev_name, []).append(entry)

    saved = []
    for ev in events:
        ev_name = ev.get("event_name", "")
        group_entries = event_groups.get(ev_name, [])
        if not group_entries:
            continue

        videos = []
        for entry in group_entries:
            vid = entry["id"]
            title = entry["title"]
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

            videos.append({
                "videoId": vid,
                "title": title,
                "description": desc,
                "url": f"https://www.youtube.com/watch?v={vid}",
                "uploader": uploader,
                "uploadDate": upload_date,
                "duration": duration,
                "viewCount": view_count,
            })

        with_desc = sum(1 for v in videos if v["description"])
        slug = slugify(ev_name)
        out_path = OUTPUT_DIR / f"{artist_id}_{slug}.json"

        output = {
            "artistId": artist_id,
            "artistName": artist["name"],
            "eventName": ev_name,
            "eventDate": ev.get("date", "unknown"),
            "fetchedAt": datetime.now().isoformat(),
            "videoCount": len(videos),
            "videosWithDescription": with_desc,
            "videos": videos,
        }

        out_path.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"  [save] {ev_name[:40]:40s} → {out_path.name} ({len(videos)}v, {with_desc} desc)")
        saved.append({"eventName": ev_name, "videoCount": len(videos), "withDescription": with_desc})

    # 전체 요약
    total_v = sum(s["videoCount"] for s in saved)
    total_d = sum(s["withDescription"] for s in saved)
    print(f"\n[summary] {len(saved)} events, {total_v} videos ({total_d} with desc)")
    return saved


# ── Phase 2 결과 파일 로드 ────────────────────────────────────────────
def load_events(events_path):
    """
    Phase 2 결과 로드.
    기대 형식: list[{"event_name": str, "date": str, "video_ids": [str]}]
    """
    return json.loads(Path(events_path).read_text())


def find_artist_name(artist_id, artists):
    """artists.json에서 아티스트 이름 찾기."""
    for a in artists:
        if a["id"] == artist_id:
            return a["name"]
    return artist_id


# ── 메인 오케스트레이터 ───────────────────────────────────────────────
async def fetch_all(artist, events, years=DEFAULT_YEARS):
    """
    전체 파이프라인 실행:
      1. 전체 공연명으로 병렬 검색
      2. 검색 결과 description 병렬 수집
      3. 공연별 결과 저장
    """
    artist_name = artist["name"]
    print(f"\n{'#'*60}\n# {artist_name} ({artist['id']})\n# events: {len(events)}\n{'#'*60}")

    # Step 1: 병렬 검색
    print(f"\n[Step 1] 병렬 검색 시작")
    entries = await parallel_search_all_events(artist_name, events, years=years)

    if not entries:
        print("  no results, skipping")
        return []

    # Step 2: 병렬 description 수집
    print(f"\n[Step 2] 병렬 description 수집 시작")
    details = await parallel_fetch_all_details(entries)

    # Step 3: 저장
    print(f"\n[Step 3] 저장")
    saved = save_results(artist, events, entries, details)

    return saved


# ── CLI ───────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="FestRecipe Event Video Fetcher — 병렬 검색 + description 수집")
    parser.add_argument("--from-events", type=str, help="Phase 2 events.json 파일 경로")
    parser.add_argument("--artist", type=str, help="아티스트명")
    parser.add_argument("--events", nargs="+", type=str, help="수동 지정 공연명 목록")
    parser.add_argument("--all", action="store_true", help="output/의 모든 events.json 배치 처리")
    parser.add_argument("--years", type=int, default=DEFAULT_YEARS, help=f"수집 기간 (기본: {DEFAULT_YEARS}년)")
    parser.add_argument("--dry-run", action="store_true", help="검색만 하고 description은 수집하지 않음")
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
        results = asyncio.run(fetch_all(artist, events, years=a.years))
        return

    # ── 모드 2: 수동 지정 ──
    if a.artist and a.events:
        artist_id = a.artist.lower().replace(" ", "-")
        artist = {"id": artist_id, "name": a.artist}
        events = [{"event_name": e, "date": "unknown"} for e in a.events]
        results = asyncio.run(fetch_all(artist, events, years=a.years))
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
            artist_name = find_artist_name(artist_id, artists)
            artist = {"id": artist_id, "name": artist_name}
            events = load_events(ef)
            asyncio.run(fetch_all(artist, events, years=a.years))
        return

    parser.print_help()


if __name__ == "__main__":
    main()
