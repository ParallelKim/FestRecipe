#!/usr/bin/env python3
"""
Step 3: 아티스트 발매곡 수집 (YouTube Music 기반)

ytmusicapi 로 YouTube Music 카탈로그를 조회한다.
  1) 아티스트 검색 → browseId 확정
  2) albums / singles 목록 확장
  3) 각 앨범·싱글 트랙 + songs 플레이리스트 수집
  4) videoId 기준 중복 제거 후 releases.json 저장

Optional: YT_API_KEY 가 있으면 videos.list 로 duration 보강.

Output:
  collector/output/{artistId}/releases.json

Usage:
  python3 fetch_releases.py --artist "혁오"
  python3 fetch_releases.py --artist-id hyukoh
  python3 fetch_releases.py --artist-id hyukoh,khruangbin,silica-gel
  python3 fetch_releases.py --from-index --limit 3
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

from ytmusicapi import YTMusic

try:
    import yt_api
except ImportError:  # pragma: no cover
    yt_api = None


SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
ARTISTS_JSON = PROJECT_ROOT / "public" / "data" / "artists.json"
OUTPUT_DIR = SCRIPT_DIR / "output"
INDEX_PATH = OUTPUT_DIR / "_artist_index.json"

LIVE_RELEASE = re.compile(r"\b(live|라이브|공연|tour|투어)\b", re.I)


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
        exact = [a for a in matches if a["id"] == needle or a.get("name", "").lower() == needle
                 or (a.get("englishName") or "").lower() == needle]
        if len(exact) == 1:
            return exact[0]
        ids = ", ".join(a["id"] for a in matches[:8])
        raise SystemExit(f"[ERR] ambiguous artist '{artist}': {ids}")
    return matches[0]


def artist_query_names(artist: dict) -> list[str]:
    names = []
    for key in ("englishName", "name"):
        val = (artist.get(key) or "").strip()
        if val and val not in names:
            names.append(val)
    for alias in artist.get("aliases") or []:
        val = (alias or "").strip()
        if val and val not in names:
            names.append(val)
    # kebab-id → spaced token (peach-truck-hijackers → peach truck hijackers)
    id_as_name = artist["id"].replace("-", " ").strip()
    if id_as_name and id_as_name not in names:
        names.append(id_as_name)
    return names or [artist["id"]]


def _parse_subscribers(text: str | None) -> int:
    if not text:
        return 0
    t = text.strip().upper().replace(",", "")
    m = re.fullmatch(r"([\d.]+)\s*([KMB])?", t.replace(" SUBSCRIBERS", "").strip())
    if not m:
        digits = re.sub(r"\D", "", t)
        return int(digits) if digits else 0
    num = float(m.group(1))
    unit = m.group(2)
    mult = {None: 1, "K": 1_000, "M": 1_000_000, "B": 1_000_000_000}[unit]
    return int(num * mult)


def resolve_ytm_artist(yt: YTMusic, artist: dict) -> dict | None:
    """YouTube Music 아티스트 browseId 확정."""
    # 수동 큐레이션 override (한글명 ≠ YTM 표기인 경우)
    override = (artist.get("ytmBrowseId") or "").strip()
    if override:
        return {
            "browseId": override,
            "name": artist.get("englishName") or artist.get("name") or artist["id"],
            "subscribers": None,
            "thumbnails": [],
            "score": 1000,
            "query": "ytmBrowseId",
        }

    names = artist_query_names(artist)
    candidates: list[dict] = []

    for q in names:
        try:
            results = yt.search(q, filter="artists", limit=8) or []
        except Exception as e:
            print(f"    [warn] artist search '{q}': {e}")
            continue
        for rank, item in enumerate(results):
            name = item.get("artist") or item.get("name") or ""
            browse_id = item.get("browseId")
            if not browse_id:
                continue
            score = 0
            for n in names:
                if name.lower() == n.lower():
                    score += 100
                elif n.lower() in name.lower() or name.lower() in n.lower():
                    score += 40
            # 한글 쿼리로 검색했는데 영문 채널명만 나오는 경우(피치트럭→Peach Truck 등)
            # 상위 결과는 신뢰하고 통과시킨다.
            if score == 0 and rank == 0:
                score += 50
            elif score == 0 and rank == 1:
                score += 30
            score += min(_parse_subscribers(item.get("subscribers")), 1_000_000) // 10_000
            candidates.append({
                "browseId": browse_id,
                "name": name,
                "subscribers": item.get("subscribers"),
                "thumbnails": item.get("thumbnails"),
                "score": score,
                "query": q,
            })

    if not candidates:
        return None

    best: dict[str, dict] = {}
    for c in candidates:
        prev = best.get(c["browseId"])
        if not prev or c["score"] > prev["score"]:
            best[c["browseId"]] = c
    ranked = sorted(best.values(), key=lambda x: x["score"], reverse=True)
    top = ranked[0]
    if top["score"] < 40:
        return None
    return top


def tracks_from_song_search(yt: YTMusic, artist: dict, browse_id: str, *, limit: int = 40) -> list[dict]:
    """get_artist 실패 시 검색으로 Songs 플레이리스트 대체 수집."""
    tracks: list[dict] = []
    seen: set[str] = set()
    for q in artist_query_names(artist):
        try:
            results = yt.search(q, filter="songs", limit=limit) or []
        except Exception as e:
            print(f"    [warn] song search '{q}': {e}")
            continue
        for t in results:
            artists = t.get("artists") or []
            ids = {a.get("id") for a in artists if a.get("id")}
            names = {(a.get("name") or "").lower() for a in artists}
            if browse_id not in ids and not any(
                n and (n in names or any(n in x for x in names))
                for n in (x.lower() for x in artist_query_names(artist))
            ):
                continue
            vid = t.get("videoId")
            if not vid or vid in seen:
                continue
            seen.add(vid)
            album = t.get("album") or {}
            tracks.append({
                "videoId": vid,
                "songTitle": t.get("title") or "",
                "title": t.get("title") or "",
                "artists": [a.get("name") for a in artists if a.get("name")],
                "albumTitle": album.get("name"),
                "albumBrowseId": album.get("id"),
                "releaseType": "song",
                "year": None,
                "duration": t.get("duration"),
                "durationSeconds": t.get("duration_seconds"),
                "isExplicit": t.get("isExplicit"),
                "trackNumber": None,
                "thumbnailUrl": ((t.get("thumbnails") or [{}])[-1] or {}).get("url"),
                "source": "songs_search",
                "isLiveRelease": False,
            })
        if tracks:
            break
    return tracks


def _release_type(meta: dict) -> str:
    t = (meta.get("type") or "").lower()
    if t in {"single", "ep", "album"}:
        return t
    title = meta.get("title") or ""
    if re.search(r"\bEP\b", title):
        return "ep"
    if re.search(r"\b(single|싱글)\b", title, re.I):
        return "single"
    return "album"


def collect_release_groups(yt: YTMusic, artist_info: dict) -> list[dict]:
    """앨범/싱글 목록을 가능한 한 전부 모은다."""
    groups: list[dict] = []
    seen = set()

    def add_group(item: dict, fallback_type: str):
        browse_id = item.get("browseId")
        if not browse_id or browse_id in seen:
            return
        seen.add(browse_id)
        groups.append({
            "browseId": browse_id,
            "title": item.get("title") or "",
            "year": item.get("year"),
            "releaseType": _release_type({**item, "type": item.get("type") or fallback_type}),
            "thumbnails": item.get("thumbnails"),
        })

    for section, fallback in (("albums", "album"), ("singles", "single")):
        block = artist_info.get(section) or {}
        for item in block.get("results") or []:
            add_group(item, fallback)
        browse_id = block.get("browseId")
        params = block.get("params")
        if browse_id and params:
            try:
                more = yt.get_artist_albums(browse_id, params) or []
                for item in more:
                    add_group(item, fallback)
            except Exception as e:
                print(f"    [warn] get_artist_albums({section}): {e}")

    return groups


def tracks_from_album(yt: YTMusic, group: dict) -> list[dict]:
    try:
        album = yt.get_album(group["browseId"])
    except Exception as e:
        print(f"    [warn] get_album {group.get('title')}: {e}")
        return []

    tracks = []
    album_title = album.get("title") or group["title"]
    year = album.get("year") or group.get("year")
    release_type = group["releaseType"]
    for t in album.get("tracks") or []:
        vid = t.get("videoId")
        if not vid:
            continue
        artists = [a.get("name") for a in (t.get("artists") or []) if a.get("name")]
        tracks.append({
            "videoId": vid,
            "songTitle": t.get("title") or "",
            "title": t.get("title") or "",
            "artists": artists,
            "albumTitle": album_title,
            "albumBrowseId": group["browseId"],
            "releaseType": release_type,
            "year": year,
            "duration": t.get("duration"),
            "durationSeconds": t.get("duration_seconds"),
            "isExplicit": t.get("isExplicit"),
            "trackNumber": t.get("trackNumber"),
            "thumbnailUrl": ((album.get("thumbnails") or [{}])[-1] or {}).get("url"),
            "source": "album",
            "isLiveRelease": bool(LIVE_RELEASE.search(album_title)),
        })
    return tracks


def tracks_from_songs_playlist(yt: YTMusic, artist_info: dict) -> list[dict]:
    block = artist_info.get("songs") or {}
    browse_id = block.get("browseId")
    if not browse_id:
        # fallback: top results only
        tracks = []
        for t in block.get("results") or []:
            vid = t.get("videoId")
            if not vid:
                continue
            album = t.get("album") or {}
            tracks.append({
                "videoId": vid,
                "songTitle": t.get("title") or "",
                "title": t.get("title") or "",
                "artists": [a.get("name") for a in (t.get("artists") or []) if a.get("name")],
                "albumTitle": album.get("name"),
                "albumBrowseId": album.get("id"),
                "releaseType": "song",
                "year": None,
                "duration": t.get("duration"),
                "durationSeconds": t.get("duration_seconds"),
                "isExplicit": t.get("isExplicit"),
                "trackNumber": None,
                "thumbnailUrl": ((t.get("thumbnails") or [{}])[-1] or {}).get("url"),
                "source": "songs_top",
                "isLiveRelease": False,
            })
        return tracks

    try:
        playlist = yt.get_playlist(browse_id, limit=300)
    except Exception as e:
        print(f"    [warn] get_playlist songs: {e}")
        return []

    tracks = []
    for t in playlist.get("tracks") or []:
        vid = t.get("videoId")
        if not vid:
            continue
        album = t.get("album") or {}
        album_title = album.get("name")
        tracks.append({
            "videoId": vid,
            "songTitle": t.get("title") or "",
            "title": t.get("title") or "",
            "artists": [a.get("name") for a in (t.get("artists") or []) if a.get("name")],
            "albumTitle": album_title,
            "albumBrowseId": album.get("id"),
            "releaseType": "song",
            "year": None,
            "duration": t.get("duration"),
            "durationSeconds": t.get("duration_seconds"),
            "isExplicit": t.get("isExplicit"),
            "trackNumber": None,
            "thumbnailUrl": ((t.get("thumbnails") or [{}])[-1] or {}).get("url"),
            "source": "songs_playlist",
            "isLiveRelease": bool(album_title and LIVE_RELEASE.search(album_title)),
        })
    return tracks


def merge_tracks(album_tracks: list[dict], playlist_tracks: list[dict]) -> list[dict]:
    by_id: dict[str, dict] = {}
    # album tracks first (richer metadata)
    for t in album_tracks + playlist_tracks:
        vid = t["videoId"]
        if vid not in by_id:
            by_id[vid] = t
            continue
        cur = by_id[vid]
        # fill missing fields from playlist entry
        for key in ("albumTitle", "albumBrowseId", "year", "duration", "durationSeconds", "thumbnailUrl"):
            if not cur.get(key) and t.get(key):
                cur[key] = t[key]
        if cur.get("releaseType") == "song" and t.get("releaseType") in {"album", "single", "ep"}:
            cur["releaseType"] = t["releaseType"]
            cur["source"] = t["source"]
    releases = list(by_id.values())
    releases.sort(key=lambda r: (
        0 if r.get("source") == "album" else 1,
        -(int(r["year"]) if str(r.get("year") or "").isdigit() else 0),
        r.get("albumTitle") or "",
        r.get("trackNumber") or 999,
        r.get("songTitle") or "",
    ))
    return releases


def enrich_with_youtube_api(releases: list[dict]) -> None:
    if not yt_api:
        return
    try:
        yt_api.get_api_key()
    except Exception:
        return
    try:
        details = yt_api.videos_list([r["videoId"] for r in releases])
    except Exception as e:
        print(f"    [warn] videos.list enrich skipped: {e}")
        return
    for r in releases:
        item = details.get(r["videoId"])
        if not item:
            continue
        sn = item.get("snippet") or {}
        cd = item.get("contentDetails") or {}
        st = item.get("statistics") or {}
        r["youtubeTitle"] = sn.get("title")
        r["publishedAt"] = sn.get("publishedAt")
        r["viewCount"] = int(st.get("viewCount") or 0)
        if not r.get("duration") and cd.get("duration"):
            r["durationIso"] = cd["duration"]


def fetch_releases_for_artist(yt: YTMusic, artist: dict, *, max_results: int = 0, include_live: bool = False) -> dict:
    names = artist_query_names(artist)
    print(f"\n=== {artist.get('name')} ({artist['id']}) ===")
    print(f"  queries: {names}")

    ytm = resolve_ytm_artist(yt, artist)
    if not ytm:
        raise RuntimeError("YouTube Music artist not found")
    print(f"  ytm artist: {ytm['name']} ({ytm['browseId']}) score={ytm['score']}")

    info: dict = {}
    try:
        info = yt.get_artist(ytm["browseId"]) or {}
    except Exception as e:
        print(f"  [warn] get_artist failed, falling back to song search: {e}")
        info = {"name": ytm["name"], "thumbnails": ytm.get("thumbnails") or []}

    groups = collect_release_groups(yt, info) if info.get("albums") or info.get("singles") else []
    print(f"  release groups: {len(groups)}")

    album_tracks: list[dict] = []
    for i, group in enumerate(groups, 1):
        print(f"  [{i}/{len(groups)}] {group['releaseType']}: {group['title']} ({group.get('year') or '?'})")
        album_tracks.extend(tracks_from_album(yt, group))

    playlist_tracks = tracks_from_songs_playlist(yt, info) if info.get("songs") else []
    if not playlist_tracks and not album_tracks:
        playlist_tracks = tracks_from_song_search(yt, artist, ytm["browseId"])
        print(f"  song-search fallback tracks: {len(playlist_tracks)}")
    print(f"  album tracks: {len(album_tracks)}, playlist tracks: {len(playlist_tracks)}")

    releases = merge_tracks(album_tracks, playlist_tracks)
    if not include_live:
        before = len(releases)
        releases = [r for r in releases if not r.get("isLiveRelease")]
        if before != len(releases):
            print(f"  filtered live releases: {before - len(releases)}")

    enrich_with_youtube_api(releases)

    for r in releases:
        r["youtubeUrl"] = f"https://www.youtube.com/watch?v={r['videoId']}"
        r["youtubeMusicUrl"] = f"https://music.youtube.com/watch?v={r['videoId']}"

    if max_results and max_results > 0:
        releases = releases[:max_results]

    thumb = None
    thumbs = info.get("thumbnails") or ytm.get("thumbnails") or []
    if thumbs:
        thumb = thumbs[-1].get("url")

    payload = {
        "artistId": artist["id"],
        "artistName": artist.get("name"),
        "englishName": artist.get("englishName"),
        "source": "youtube_music",
        "provider": "ytmusicapi",
        "collectedAt": datetime.now(timezone.utc).isoformat(),
        "ytmArtist": {
            "browseId": ytm["browseId"],
            "name": info.get("name") or ytm["name"],
            "subscribers": info.get("subscribers") or ytm.get("subscribers"),
            "channelId": info.get("channelId"),
            "thumbnailUrl": thumb,
            "url": f"https://music.youtube.com/channel/{ytm['browseId']}",
        },
        "releaseGroupCount": len(groups),
        "releaseGroups": [
            {
                "browseId": g["browseId"],
                "title": g["title"],
                "year": g.get("year"),
                "releaseType": g["releaseType"],
                "url": f"https://music.youtube.com/browse/{g['browseId']}",
            }
            for g in groups
        ],
        "releaseCount": len(releases),
        "releases": releases,
    }

    out_dir = OUTPUT_DIR / artist["id"]
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "releases.json"
    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"  [save] {out_path} ({len(releases)} tracks)")
    return payload


def parse_artist_ids(raw: str | None) -> list[str]:
    if not raw:
        return []
    return [x.strip() for x in raw.split(",") if x.strip()]


def iter_target_artists(args, artists: list[dict]) -> list[dict]:
    ids = parse_artist_ids(args.artist_id)
    if ids:
        return [find_artist(artists, artist_id=i) for i in ids]

    if args.from_index:
        if not INDEX_PATH.exists():
            raise SystemExit("[ERR] _artist_index.json 없음. 먼저 sync_artists.py 를 실행하세요.")
        index = json.loads(INDEX_PATH.read_text(encoding="utf-8"))
        id_list = index.get("artistIds") or []
        by_id = {a["id"]: a for a in artists}
        selected = [by_id[i] for i in id_list if i in by_id]
        if args.limit:
            selected = selected[: args.limit]
        return selected

    if args.all:
        selected = list(artists)
        if args.limit:
            selected = selected[: args.limit]
        return selected

    if args.artist:
        return [find_artist(artists, artist=args.artist)]

    raise SystemExit("Specify --artist / --artist-id / --all / --from-index")


def main():
    parser = argparse.ArgumentParser(description="Fetch artist releases from YouTube Music (ytmusicapi)")
    parser.add_argument("--artist", type=str, help="Artist name or id substring")
    parser.add_argument("--artist-id", type=str, help="Exact artist id (comma-separated for multiple)")
    parser.add_argument("--all", action="store_true", help="All artists in artists.json")
    parser.add_argument("--from-index", action="store_true", help="Use artistIds from sync_artists output")
    parser.add_argument("--limit", type=int, default=0, help="Limit number of artists")
    parser.add_argument("--max-results", type=int, default=0, help="Max tracks per artist (0=all)")
    parser.add_argument("--include-live", action="store_true", help="Keep LIVE album tracks")
    args = parser.parse_args()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    artists = load_artists()
    targets = iter_target_artists(args, artists)
    print(f"[start] artists={len(targets)} provider=ytmusicapi")

    yt = YTMusic()
    ok = 0
    failed = []
    summaries = []
    for artist in targets:
        try:
            payload = fetch_releases_for_artist(
                yt,
                artist,
                max_results=args.max_results,
                include_live=args.include_live,
            )
            ok += 1
            summaries.append({
                "artistId": artist["id"],
                "ytmName": (payload.get("ytmArtist") or {}).get("name"),
                "releaseGroups": payload.get("releaseGroupCount"),
                "releases": payload.get("releaseCount"),
            })
        except Exception as e:
            print(f"[ERR] {artist['id']}: {e}")
            failed.append({"artistId": artist["id"], "error": str(e)})

    summary = {
        "collectedAt": datetime.now(timezone.utc).isoformat(),
        "provider": "ytmusicapi",
        "requested": len(targets),
        "ok": ok,
        "failed": failed,
        "artists": summaries,
    }
    (OUTPUT_DIR / "_releases_summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"\n[done] ok={ok}/{len(targets)} failed={len(failed)}")
    for s in summaries:
        print(f"  - {s['artistId']}: groups={s['releaseGroups']} tracks={s['releases']}")
    if failed:
        sys.exit(2)


if __name__ == "__main__":
    main()
