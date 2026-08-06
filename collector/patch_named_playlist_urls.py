#!/usr/bin/env python3
"""기존 public/data/playlists/*.json 의 youtubePlaylistUrl 을
YTM Songs 기명 재생목록 링크로 교체한다. tracks/티어는 건드리지 않는다.

Usage:
  python3 patch_named_playlist_urls.py
  python3 patch_named_playlist_urls.py --artist-id hyukoh,yb
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

from ytmusicapi import YTMusic

SCRIPT_DIR = Path(__file__).parent
PUBLIC_PLAYLISTS = SCRIPT_DIR.parent / "public" / "data" / "playlists"

# reuse helpers from build_playlists
sys.path.insert(0, str(SCRIPT_DIR))
from build_playlists import named_songs_playlist_urls  # noqa: E402


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, data) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def songs_list_id_for_artist(yt: YTMusic, browse_id: str) -> str | None:
    try:
        info = yt.get_artist(browse_id) or {}
    except Exception as e:
        print(f"  [warn] get_artist({browse_id}): {e}")
        return None
    songs = info.get("songs") or {}
    browse = songs.get("browseId")
    if not isinstance(browse, str) or not browse.strip():
        return None
    list_id = browse[2:] if browse.startswith("VL") else browse
    try:
        pl = yt.get_playlist(browse, limit=1)
        pl_id = pl.get("id")
        if isinstance(pl_id, str) and pl_id.strip():
            list_id = pl_id.strip()
    except Exception:
        pass
    return list_id


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--artist-id", type=str, help="Comma-separated ids (default: all)")
    args = parser.parse_args()

    only = None
    if args.artist_id:
        only = {x.strip() for x in args.artist_id.split(",") if x.strip()}

    yt = YTMusic()
    cache: dict[str, str | None] = {}
    updated = 0
    skipped = 0
    failed = 0

    paths = sorted(PUBLIC_PLAYLISTS.glob("*.json"))
    for path in paths:
        if path.name == "index.json":
            continue
        aid = path.stem
        if only and aid not in only:
            continue
        doc = load_json(path)
        if doc.get("composedOf") or str(doc.get("selection") or "").startswith("composedOf"):
            print(f"[skip] {aid}: collab — keep watch_videos/merge")
            skipped += 1
            continue
        ytm = doc.get("ytmArtist") or {}
        browse = ytm.get("browseId")
        if not browse:
            print(f"[skip] {aid}: no ytmArtist.browseId")
            skipped += 1
            continue

        if browse not in cache:
            cache[browse] = songs_list_id_for_artist(yt, browse)
            time.sleep(0.15)
        list_id = cache[browse]
        if not list_id:
            print(f"[fail] {aid}: no Songs playlist")
            failed += 1
            continue

        yt_url, ytm_url = named_songs_playlist_urls(list_id)
        name = (doc.get("artistName") or aid).strip()
        doc["ytmSongsPlaylistId"] = list_id
        doc["youtubePlaylistUrl"] = yt_url
        doc["youtubeMusicPlaylistUrl"] = ytm_url
        doc["playlistTitle"] = f"{name} Top songs" if name else "Top songs"
        save_json(path, doc)
        updated += 1
        print(f"[ok] {aid} → {list_id}")

    print(f"\ndone updated={updated} skipped={skipped} failed={failed} cached={len(cache)}")


if __name__ == "__main__":
    main()
