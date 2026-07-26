#!/usr/bin/env python3
"""
Step 3: 아티스트 발매곡 수집 (YouTube Music 기반)

YouTube Data API v3 search.list 를 사용해:
  1) "{아티스트} - Topic" 채널(YouTube Music 자동 채널) 탐색
  2) Topic 채널 업로드 + Music 카테고리 검색으로 발매곡 후보 수집
  3) videos.list 로 duration 등 메타 보강 후 라이브/팬캠 필터링

Output:
  collector/output/{artistId}/releases.json

Usage:
  export YT_API_KEY=...
  python3 fetch_releases.py --artist "혁오"
  python3 fetch_releases.py --artist-id hyukoh
  python3 fetch_releases.py --all --limit 5
  python3 fetch_releases.py --from-index   # sync_artists.py 결과의 artistIds 사용
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import yt_api


SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
ARTISTS_JSON = PROJECT_ROOT / "public" / "data" / "artists.json"
OUTPUT_DIR = SCRIPT_DIR / "output"
INDEX_PATH = OUTPUT_DIR / "_artist_index.json"

# 라이브/공연 클립으로 보이는 제목 키워드 (발매곡 MVP에서는 제외)
LIVE_NOISE = re.compile(
    r"("
    r"live|풀캠|fancam|직캠|셋리스트|setlist|"
    r"concert|콘서트|festival|페스티벌|페스타|"
    r"tour|투어|공연|무대|stage\s*cam|"
    r"반응|reaction|cover\s*by|karaoke|노래방|"
    r"behind|비하인드|making|리허설|rehearsal"
    r")",
    re.I,
)

OFFICIAL_HINT = re.compile(
    r"(official\s*(audio|mv|music\s*video|lyric)|공식\s*(오디오|뮤직비디오|MV)|topic)",
    re.I,
)


def load_artists() -> list[dict]:
    return json.loads(ARTISTS_JSON.read_text(encoding="utf-8"))


def find_artist(artists: list[dict], *, artist: str | None = None, artist_id: str | None = None) -> dict:
    if artist_id:
        for a in artists:
            if a["id"] == artist_id:
                return a
        raise SystemExit(f"[ERR] artist id not found: {artist_id}")

    assert artist
    needle = artist.lower()
    matches = [
        a for a in artists
        if needle in a.get("name", "").lower()
        or needle in (a.get("englishName") or "").lower()
        or needle == a["id"].lower()
        or needle in a["id"].lower()
    ]
    if not matches:
        raise SystemExit(f"[ERR] artist not found: {artist}")
    if len(matches) > 1:
        # prefer exact id / exact name
        exact = [a for a in matches if a["id"] == needle or a.get("name", "").lower() == needle]
        if len(exact) == 1:
            return exact[0]
        ids = ", ".join(a["id"] for a in matches[:8])
        raise SystemExit(f"[ERR] ambiguous artist '{artist}': {ids}")
    return matches[0]


def artist_query_names(artist: dict) -> list[str]:
    names = []
    for key in ("name", "englishName"):
        val = (artist.get(key) or "").strip()
        if val and val not in names:
            names.append(val)
    return names or [artist["id"]]


def normalize_song_title(title: str, artist_names: list[str]) -> str:
    t = title.strip()
    # common "Artist - Song (Official Audio)" patterns
    t = re.sub(r"\s*[\(\[\{][^\)\]\}]*[\)\]\}]\s*", " ", t)
    for name in artist_names:
        t = re.sub(re.escape(name), "", t, flags=re.I)
    t = re.sub(r"^\s*[-–—|:]\s*", "", t)
    t = re.sub(r"\s*[-–—|:]\s*$", "", t)
    t = re.sub(r"\s+", " ", t).strip(" -–—|:")
    return t or title.strip()


def is_topic_channel(title: str) -> bool:
    return bool(re.search(r"\s-\s*Topic\s*$", title or "", re.I))


def parse_iso8601_duration(duration: str) -> int | None:
    """Return seconds from ISO-8601 duration (PT#H#M#S)."""
    if not duration:
        return None
    m = re.fullmatch(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", duration)
    if not m:
        return None
    h, mi, s = (int(x) if x else 0 for x in m.groups())
    return h * 3600 + mi * 60 + s


def resolve_topic_channel(artist_names: list[str]) -> dict | None:
    """Search for YouTube Music Topic channel."""
    candidates: list[dict] = []
    for name in artist_names:
        for q in (f"{name} Topic", name):
            items = yt_api.search_all(q=q, type_="channel", max_total=10)
            for item in items:
                ch_id = (item.get("id") or {}).get("channelId")
                sn = item.get("snippet") or {}
                title = sn.get("title") or sn.get("channelTitle") or ""
                if not ch_id:
                    continue
                score = 0
                if is_topic_channel(title):
                    score += 100
                if any(n.lower() in title.lower() for n in artist_names):
                    score += 20
                if "topic" in title.lower():
                    score += 10
                candidates.append({
                    "id": ch_id,
                    "title": title,
                    "description": sn.get("description") or "",
                    "score": score,
                    "query": q,
                })

    if not candidates:
        return None

    # de-dupe by channel id, keep best score
    best: dict[str, dict] = {}
    for c in candidates:
        prev = best.get(c["id"])
        if not prev or c["score"] > prev["score"]:
            best[c["id"]] = c

    ranked = sorted(best.values(), key=lambda x: x["score"], reverse=True)
    top = ranked[0]
    if top["score"] < 20:
        return None
    return {"id": top["id"], "title": top["title"], "score": top["score"]}


def collect_search_candidates(artist_names: list[str], *, max_per_query: int = 25) -> list[dict]:
    queries = []
    for name in artist_names:
        queries.extend([
            f"{name} official audio",
            f"{name} official MV",
            f"{name}",
        ])

    seen = set()
    results = []
    for q in queries:
        items = yt_api.search_all(
            q=q,
            type_="video",
            max_total=max_per_query,
            video_category_id=yt_api.MUSIC_CATEGORY_ID,
            order="relevance",
        )
        for item in items:
            vid = (item.get("id") or {}).get("videoId")
            if not vid or vid in seen:
                continue
            seen.add(vid)
            sn = item.get("snippet") or {}
            results.append({
                "videoId": vid,
                "title": sn.get("title") or "",
                "channelId": sn.get("channelId") or "",
                "channelTitle": sn.get("channelTitle") or "",
                "publishedAt": sn.get("publishedAt") or "",
                "thumbnailUrl": ((sn.get("thumbnails") or {}).get("high") or {}).get("url")
                or ((sn.get("thumbnails") or {}).get("default") or {}).get("url"),
                "source": "search",
                "query": q,
            })
    return results


def collect_topic_uploads(channel_id: str, *, max_total: int = 50) -> list[dict]:
    items = yt_api.search_all(
        q="",
        type_="video",
        max_total=max_total,
        channel_id=channel_id,
        order="date",
    )
    results = []
    for item in items:
        vid = (item.get("id") or {}).get("videoId")
        if not vid:
            continue
        sn = item.get("snippet") or {}
        results.append({
            "videoId": vid,
            "title": sn.get("title") or "",
            "channelId": sn.get("channelId") or channel_id,
            "channelTitle": sn.get("channelTitle") or "",
            "publishedAt": sn.get("publishedAt") or "",
            "thumbnailUrl": ((sn.get("thumbnails") or {}).get("high") or {}).get("url")
            or ((sn.get("thumbnails") or {}).get("default") or {}).get("url"),
            "source": "topic_channel",
            "query": f"channel:{channel_id}",
        })
    return results


def should_keep(title: str, *, from_topic: bool) -> bool:
    if from_topic:
        # Topic 채널은 YouTube Music 카탈로그이므로 기본적으로 유지
        # 단, 명확한 라이브 표기는 제외
        if re.search(r"\blive\b|풀캠|직캠|fancam|setlist|셋리스트", title, re.I):
            return False
        return True
    if LIVE_NOISE.search(title) and not OFFICIAL_HINT.search(title):
        return False
    return True


def enrich_and_filter(candidates: list[dict], artist_names: list[str], topic_channel_id: str | None) -> list[dict]:
    details = yt_api.videos_list([c["videoId"] for c in candidates])
    releases = []
    seen_titles: set[str] = set()

    for c in candidates:
        item = details.get(c["videoId"])
        title = c["title"]
        channel_id = c["channelId"]
        from_topic = bool(topic_channel_id and channel_id == topic_channel_id) or c["source"] == "topic_channel"

        if item:
            sn = item.get("snippet") or {}
            title = sn.get("title") or title
            channel_id = sn.get("channelId") or channel_id
            c["channelTitle"] = sn.get("channelTitle") or c["channelTitle"]
            c["publishedAt"] = sn.get("publishedAt") or c["publishedAt"]
            c["thumbnailUrl"] = (
                ((sn.get("thumbnails") or {}).get("high") or {}).get("url")
                or c.get("thumbnailUrl")
            )
            duration = (item.get("contentDetails") or {}).get("duration") or ""
            seconds = parse_iso8601_duration(duration)
            view_count = int((item.get("statistics") or {}).get("viewCount") or 0)
            category_id = sn.get("categoryId")
        else:
            duration = ""
            seconds = None
            view_count = 0
            category_id = None

        if category_id and category_id != yt_api.MUSIC_CATEGORY_ID and not from_topic:
            continue
        if seconds is not None and (seconds < 45 or seconds > 15 * 60) and not from_topic:
            # 너무 짧거나 긴 non-topic 영상은 제외 (라이브/클립 가능성)
            continue
        if not should_keep(title, from_topic=from_topic):
            continue

        song_title = normalize_song_title(title, artist_names)
        dedupe_key = re.sub(r"\W+", "", song_title.lower())
        if dedupe_key in seen_titles:
            continue
        seen_titles.add(dedupe_key)

        releases.append({
            "videoId": c["videoId"],
            "title": title,
            "songTitle": song_title,
            "channelId": channel_id,
            "channelTitle": c.get("channelTitle") or "",
            "publishedAt": c.get("publishedAt") or "",
            "duration": duration,
            "durationSeconds": seconds,
            "viewCount": view_count,
            "youtubeUrl": f"https://www.youtube.com/watch?v={c['videoId']}",
            "youtubeMusicUrl": f"https://music.youtube.com/watch?v={c['videoId']}",
            "thumbnailUrl": c.get("thumbnailUrl"),
            "source": "topic_channel" if from_topic else "search",
        })

    # Topic 우선, 그다음 조회수
    releases.sort(key=lambda r: (0 if r["source"] == "topic_channel" else 1, -(r.get("viewCount") or 0)))
    return releases


def fetch_releases_for_artist(artist: dict, *, max_results: int = 50) -> dict:
    names = artist_query_names(artist)
    print(f"\n=== {artist.get('name')} ({artist['id']}) ===")
    print(f"  names: {names}")

    topic = resolve_topic_channel(names)
    if topic:
        print(f"  topic channel: {topic['title']} ({topic['id']})")
    else:
        print("  topic channel: (not found)")

    candidates: list[dict] = []
    seen = set()

    if topic:
        for c in collect_topic_uploads(topic["id"], max_total=max_results):
            if c["videoId"] not in seen:
                seen.add(c["videoId"])
                candidates.append(c)

    for c in collect_search_candidates(names, max_per_query=min(25, max_results)):
        if c["videoId"] not in seen:
            seen.add(c["videoId"])
            candidates.append(c)

    print(f"  candidates: {len(candidates)}")
    releases = enrich_and_filter(candidates, names, topic["id"] if topic else None)
    print(f"  releases kept: {len(releases)}")

    payload = {
        "artistId": artist["id"],
        "artistName": artist.get("name"),
        "englishName": artist.get("englishName"),
        "source": "youtube_music",
        "provider": "youtube_data_api_v3",
        "collectedAt": datetime.now(timezone.utc).isoformat(),
        "topicChannel": topic,
        "releaseCount": len(releases),
        "releases": releases[:max_results],
    }

    out_dir = OUTPUT_DIR / artist["id"]
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "releases.json"
    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"  [save] {out_path}")
    return payload


def iter_target_artists(args, artists: list[dict]) -> list[dict]:
    if args.from_index:
        if not INDEX_PATH.exists():
            raise SystemExit("[ERR] _artist_index.json 없음. 먼저 sync_artists.py 를 실행하세요.")
        index = json.loads(INDEX_PATH.read_text(encoding="utf-8"))
        ids = index.get("artistIds") or []
        by_id = {a["id"]: a for a in artists}
        selected = [by_id[i] for i in ids if i in by_id]
        if args.limit:
            selected = selected[: args.limit]
        return selected

    if args.all:
        selected = list(artists)
        if args.limit:
            selected = selected[: args.limit]
        return selected

    if args.artist_id or args.artist:
        return [find_artist(artists, artist=args.artist, artist_id=args.artist_id)]

    raise SystemExit("Specify --artist / --artist-id / --all / --from-index")


def main():
    parser = argparse.ArgumentParser(description="Fetch artist releases via YouTube Music (Search API)")
    parser.add_argument("--artist", type=str, help="Artist name or id substring")
    parser.add_argument("--artist-id", type=str, help="Exact artist id")
    parser.add_argument("--all", action="store_true", help="All artists in artists.json")
    parser.add_argument("--from-index", action="store_true", help="Use artistIds from sync_artists output")
    parser.add_argument("--limit", type=int, default=0, help="Limit number of artists (with --all/--from-index)")
    parser.add_argument("--max-results", type=int, default=50, help="Max releases per artist")
    args = parser.parse_args()

    try:
        yt_api.get_api_key()
    except yt_api.YouTubeApiError as e:
        print(f"[ERR] {e}", file=sys.stderr)
        sys.exit(1)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    artists = load_artists()
    targets = iter_target_artists(args, artists)
    print(f"[start] artists={len(targets)} max_results={args.max_results}")

    ok = 0
    failed = []
    for artist in targets:
        try:
            fetch_releases_for_artist(artist, max_results=args.max_results)
            ok += 1
        except yt_api.YouTubeApiError as e:
            print(f"[ERR] {artist['id']}: {e}")
            failed.append({"artistId": artist["id"], "error": str(e)})
        except Exception as e:
            print(f"[ERR] {artist['id']}: {e}")
            failed.append({"artistId": artist["id"], "error": str(e)})

    summary = {
        "collectedAt": datetime.now(timezone.utc).isoformat(),
        "requested": len(targets),
        "ok": ok,
        "failed": failed,
    }
    (OUTPUT_DIR / "_releases_summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"\n[done] ok={ok}/{len(targets)} failed={len(failed)}")
    if failed:
        sys.exit(2)


if __name__ == "__main__":
    main()
