#!/usr/bin/env python3
"""
아티스트 대표곡 플레이리스트 생성

인지도(recognition) 규칙:
  - 타임테이블이 있으면 슬롯이 늦을수록 인지도가 높다고 간주
  - 곡 수: 높음 5곡 / 중간 4곡 / 낮음·미배정 3곡
  - 타임테이블 없으면 기본 3곡

대표곡 선정:
  - YouTube Music 아티스트 Songs 플레이리스트 인기순
  - LIVE 앨범 트랙 제외

Output:
  collector/output/{artistId}/playlist.json
  public/data/playlists/{artistId}.json
  public/data/playlists/index.json

Usage:
  python3 build_playlists.py
  python3 build_playlists.py --artist-id hyukoh,khruangbin,silica-gel
  python3 build_playlists.py --festival incheon-pentaport-2026
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode

from ytmusicapi import YTMusic


SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
ARTISTS_JSON = PROJECT_ROOT / "public" / "data" / "artists.json"
FESTIVALS_DIR = PROJECT_ROOT / "public" / "data" / "festivals"
OUTPUT_DIR = SCRIPT_DIR / "output"
PUBLIC_PLAYLISTS = PROJECT_ROOT / "public" / "data" / "playlists"

LIVE_NOISE = re.compile(r"\b(live|라이브|공연|tour|투어)\b", re.I)

# 상대 순위(늦을수록 높음) 기준 곡 수
TIER_SONG_COUNTS = {
    "high": 5,    # 상위 25%
    "mid": 4,     # 25~60%
    "low": 3,     # 나머지 또는 타임테이블 없음
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def parse_hhmm(value: str | None) -> int | None:
    if not value:
        return None
    m = re.fullmatch(r"(\d{1,2}):(\d{2})", value.strip())
    if not m:
        return None
    return int(m.group(1)) * 60 + int(m.group(2))


def festival_files(festival_id: str | None = None) -> list[Path]:
    if festival_id:
        p = FESTIVALS_DIR / f"{festival_id}.json"
        return [p] if p.exists() else []
    return sorted(p for p in FESTIVALS_DIR.glob("*.json") if p.name != "index.json")


def latest_slot_minutes(festival: dict, artist_id: str) -> int | None:
    best = None
    for day in festival.get("lineup") or []:
        for slot in day.get("slots") or []:
            if slot.get("artistId") != artist_id:
                continue
            mins = parse_hhmm(slot.get("endTime")) or parse_hhmm(slot.get("startTime"))
            if mins is None:
                continue
            best = mins if best is None else max(best, mins)
    return best


def build_recognition_map(festivals: list[dict]) -> dict[str, dict]:
    """
    artistId -> {tier, songCount, latestSlotMinutes, festivalId, reason}
    여러 페스티벌이면 가장 늦은 슬롯 기준으로 티어 산정.
    """
    slot_best: dict[str, tuple[int, str]] = {}  # artistId -> (minutes, festivalId)

    for fest in festivals:
        fid = fest.get("id")
        for day in fest.get("lineup") or []:
            for slot in day.get("slots") or []:
                aid = slot.get("artistId")
                if not aid:
                    continue
                mins = parse_hhmm(slot.get("endTime")) or parse_hhmm(slot.get("startTime"))
                if mins is None:
                    continue
                prev = slot_best.get(aid)
                if not prev or mins > prev[0]:
                    slot_best[aid] = (mins, fid)

    if not slot_best:
        return {}

    ranked = sorted(slot_best.items(), key=lambda x: x[1][0])  # early -> late
    n = len(ranked)
    result = {}
    for idx, (aid, (mins, fid)) in enumerate(ranked):
        # 0 = earliest, 1 = latest
        rank = idx / (n - 1) if n > 1 else 1.0
        if rank >= 0.75:
            tier = "high"
        elif rank >= 0.40:
            tier = "mid"
        else:
            tier = "low"
        result[aid] = {
            "tier": tier,
            "songCount": TIER_SONG_COUNTS[tier],
            "latestSlotMinutes": mins,
            "latestSlotLabel": f"{mins // 60:02d}:{mins % 60:02d}",
            "festivalId": fid,
            "rank": round(rank, 3),
            "reason": "timetable_lateness",
        }
    return result


def default_recognition() -> dict:
    return {
        "tier": "low",
        "songCount": TIER_SONG_COUNTS["low"],
        "latestSlotMinutes": None,
        "latestSlotLabel": None,
        "festivalId": None,
        "rank": None,
        "reason": "no_timetable_default",
    }


def popular_tracks_from_ytm(yt: YTMusic, browse_id: str, limit: int = 30) -> list[dict]:
    try:
        info = yt.get_artist(browse_id) or {}
    except Exception as e:
        print(f"    [warn] get_artist({browse_id}): {e}")
        return []
    songs = info.get("songs") or {}
    browse = songs.get("browseId")
    raw = []
    if browse:
        try:
            pl = yt.get_playlist(browse, limit=limit)
            raw = pl.get("tracks") or []
        except Exception as e:
            print(f"    [warn] songs playlist: {e}")
            raw = songs.get("results") or []
    else:
        raw = songs.get("results") or []

    tracks = []
    seen = set()
    for t in raw:
        vid = t.get("videoId")
        if not vid or vid in seen:
            continue
        album = t.get("album") or {}
        album_title = album.get("name") or ""
        title = t.get("title") or ""
        if LIVE_NOISE.search(album_title) or LIVE_NOISE.search(title):
            continue
        seen.add(vid)
        tracks.append({
            "videoId": vid,
            "songTitle": title,
            "title": title,
            "artists": [a.get("name") for a in (t.get("artists") or []) if a.get("name")],
            "albumTitle": album_title or None,
            "albumBrowseId": album.get("id"),
            "duration": t.get("duration"),
            "durationSeconds": t.get("duration_seconds"),
            "thumbnailUrl": ((t.get("thumbnails") or [{}])[-1] or {}).get("url"),
            "youtubeUrl": f"https://www.youtube.com/watch?v={vid}",
            "youtubeMusicUrl": f"https://music.youtube.com/watch?v={vid}",
            "source": "ytm_songs_popular",
        })
    return tracks


def enrich_from_releases(tracks: list[dict], releases_path: Path) -> list[dict]:
    if not releases_path.exists():
        return tracks
    releases = {r["videoId"]: r for r in load_json(releases_path).get("releases") or [] if r.get("videoId")}
    for t in tracks:
        r = releases.get(t["videoId"])
        if not r:
            continue
        for key in ("albumTitle", "albumBrowseId", "year", "releaseType", "duration", "durationSeconds", "thumbnailUrl"):
            if not t.get(key) and r.get(key):
                t[key] = r[key]
    return tracks


def build_playlist_for_artist(
    yt: YTMusic,
    artist: dict,
    recognition: dict,
    *,
    festival_name: str | None = None,
) -> dict | None:
    releases_path = OUTPUT_DIR / artist["id"] / "releases.json"
    if not releases_path.exists():
        print(f"  [skip] no releases.json for {artist['id']}")
        return None

    releases_doc = load_json(releases_path)
    ytm = releases_doc.get("ytmArtist") or {}
    browse_id = ytm.get("browseId")
    if not browse_id:
        print(f"  [skip] no ytm browseId for {artist['id']}")
        return None

    song_count = recognition["songCount"]
    popular = popular_tracks_from_ytm(yt, browse_id, limit=40)
    popular = enrich_from_releases(popular, releases_path)
    selected = popular[:song_count]

    if len(selected) < song_count:
        # fallback: releases.json order preferring songs_playlist then year
        have = {t["videoId"] for t in selected}
        have_titles = {(t.get("songTitle") or t.get("title") or "").strip().lower() for t in selected}
        # songs_playlist / songs_search first (인기순에 가까움), 그다음 나머지
        releases = list(releases_doc.get("releases") or [])
        releases.sort(key=lambda r: 0 if r.get("source") in {"songs_playlist", "songs_search", "songs_top"} else 1)
        fallback = [
            r for r in releases
            if r.get("videoId") and r["videoId"] not in have and not r.get("isLiveRelease")
        ]
        for r in fallback:
            title = (r.get("songTitle") or r.get("title") or "").strip()
            if title.lower() in have_titles:
                continue
            selected.append({
                "videoId": r["videoId"],
                "songTitle": title,
                "title": r.get("title") or title,
                "artists": r.get("artists"),
                "albumTitle": r.get("albumTitle"),
                "albumBrowseId": r.get("albumBrowseId"),
                "year": r.get("year"),
                "releaseType": r.get("releaseType"),
                "duration": r.get("duration"),
                "durationSeconds": r.get("durationSeconds"),
                "thumbnailUrl": r.get("thumbnailUrl"),
                "youtubeUrl": r.get("youtubeUrl") or f"https://www.youtube.com/watch?v={r['videoId']}",
                "youtubeMusicUrl": r.get("youtubeMusicUrl") or f"https://music.youtube.com/watch?v={r['videoId']}",
                "source": "releases_fallback",
            })
            have.add(r["videoId"])
            have_titles.add(title.lower())
            if len(selected) >= song_count:
                break

    video_ids = [t["videoId"] for t in selected]
    # watch_videos title: "{페스티벌명} {아티스트명} 플레이리스트"
    artist_name = (artist.get("name") or artist.get("englishName") or artist["id"]).strip()
    fest_name = (festival_name or "").strip()
    if fest_name and artist_name:
        playlist_title = f"{fest_name} {artist_name} 플레이리스트"
    elif artist_name:
        playlist_title = f"{artist_name} 플레이리스트"
    else:
        playlist_title = "아티스트 플레이리스트"
    youtube_playlist_url = None
    if video_ids:
        youtube_playlist_url = "https://www.youtube.com/watch_videos?" + urlencode(
            {"video_ids": ",".join(video_ids), "title": playlist_title}
        )

    payload = {
        "artistId": artist["id"],
        "artistName": artist.get("name"),
        "englishName": artist.get("englishName"),
        "collectedAt": datetime.now(timezone.utc).isoformat(),
        "source": "youtube_music",
        "selection": "ytm_songs_popularity",
        "recognition": recognition,
        "songCount": len(selected),
        "targetSongCount": song_count,
        "ytmArtist": ytm,
        "tracks": selected,
        "playlistTitle": playlist_title,
        "youtubePlaylistUrl": youtube_playlist_url,
        "youtubeMusicPlaylistUrl": (
            f"https://music.youtube.com/watch?v={video_ids[0]}&list=RDAMVM{video_ids[0]}"
            if video_ids else None
        ),
    }
    # youtubeMusic radio-style link is weak; keep watch_videos as primary play CTA
    return payload


def main():
    parser = argparse.ArgumentParser(description="Build recognition-tiered highlight playlists")
    parser.add_argument("--artist-id", type=str, help="Comma-separated artist ids (default: all with releases.json)")
    parser.add_argument("--festival", type=str, help="Festival id used for timetable recognition")
    args = parser.parse_args()

    artists = load_json(ARTISTS_JSON)
    by_id = {a["id"]: a for a in artists}
    festivals = [load_json(p) for p in festival_files(args.festival)]
    recognition_map = build_recognition_map(festivals)
    festival_names = {f.get("id"): f.get("name") for f in festivals if f.get("id")}
    print(f"[recognition] timetable artists={len(recognition_map)} festivals={len(festivals)}")

    if args.artist_id:
        target_ids = [x.strip() for x in args.artist_id.split(",") if x.strip()]
    else:
        target_ids = sorted(
            p.parent.name
            for p in OUTPUT_DIR.glob("*/releases.json")
        )

    yt = YTMusic()
    built = []
    failed = []

    for aid in target_ids:
        artist = by_id.get(aid) or {"id": aid, "name": aid}
        recognition = recognition_map.get(aid) or default_recognition()
        fest_name = festival_names.get(recognition.get("festivalId")) or (
            next(iter(festival_names.values()), None) if len(festival_names) == 1 else None
        )
        # if festival filter and artist not on that fest timetable, still allow default
        print(f"\n=== {artist.get('name')} ({aid}) tier={recognition['tier']} songs={recognition['songCount']} ({recognition['reason']}) ===")
        try:
            payload = build_playlist_for_artist(
                yt, artist, recognition, festival_name=fest_name,
            )
            if not payload:
                failed.append({"artistId": aid, "error": "no_payload"})
                continue
            save_json(OUTPUT_DIR / aid / "playlist.json", payload)
            save_json(PUBLIC_PLAYLISTS / f"{aid}.json", payload)
            built.append({
                "artistId": aid,
                "tier": recognition["tier"],
                "songCount": payload["songCount"],
                "tracks": [t["songTitle"] for t in payload["tracks"]],
            })
            print(f"  [ok] {payload['songCount']} tracks: {', '.join(t['songTitle'] for t in payload['tracks'])}")
        except Exception as e:
            print(f"  [ERR] {e}")
            failed.append({"artistId": aid, "error": str(e)})

    # --artist-id 부분 실행이어도 public playlists 전체를 기준으로 index 유지
    all_ids = sorted(
        p.stem for p in PUBLIC_PLAYLISTS.glob("*.json") if p.name != "index.json"
    )
    index = {
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "count": len(all_ids),
        "artists": all_ids,
        "tierSongCounts": TIER_SONG_COUNTS,
        "recognitionRule": {
            "withTimetable": "later slot => higher tier (high=5, mid=4, low=3)",
            "withoutTimetable": "default low=3",
        },
    }
    save_json(PUBLIC_PLAYLISTS / "index.json", index)
    save_json(OUTPUT_DIR / "_playlists_summary.json", {
        "collectedAt": index["updatedAt"],
        "ok": built,
        "failed": failed,
    })

    print(f"\n[done] playlists={len(built)} failed={len(failed)} → {PUBLIC_PLAYLISTS}")
    if failed:
        sys.exit(2)


if __name__ == "__main__":
    main()
