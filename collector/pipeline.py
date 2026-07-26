#!/usr/bin/env python3
"""
FestRecipe MVP 수집 파이프라인

  1) 페스티벌 정보 (public/data/festivals/*.json — 현재는 큐레이션 입력)
  2) 아티스트 리스트업 (sync_artists.py)
  3) YouTube Music 기반 발매곡 수집 (fetch_releases.py + ytmusicapi)
  4) 인지도(타임테이블 니중도) 기반 대표곡 플레이리스트 (build_playlists.py)

Usage:
  python3 pipeline.py                 # sync only
  python3 pipeline.py --releases      # sync + fetch releases for festival artists
  python3 pipeline.py --releases --playlists --artist-id hyukoh,khruangbin,silica-gel
  python3 pipeline.py --playlists
  python3 pipeline.py --write-festivals --releases
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


SCRIPT_DIR = Path(__file__).parent


def run(cmd: list[str]) -> None:
    print(f"\n$ {' '.join(cmd)}")
    r = subprocess.run(cmd, cwd=SCRIPT_DIR)
    if r.returncode != 0:
        raise SystemExit(r.returncode)


def main():
    parser = argparse.ArgumentParser(description="FestRecipe MVP data pipeline")
    parser.add_argument("--write-festivals", action="store_true", help="Rewrite festival allArtists from slots")
    parser.add_argument("--add-missing", action="store_true", help="Add missing artist placeholders")
    parser.add_argument("--releases", action="store_true", help="Fetch YouTube Music releases after sync")
    parser.add_argument("--playlists", action="store_true", help="Build highlight playlists after releases")
    parser.add_argument("--limit", type=int, default=0, help="Limit artists for release fetch")
    parser.add_argument("--max-results", type=int, default=0, help="Max releases per artist (0=all)")
    parser.add_argument("--artist", type=str, help="Fetch releases for one artist only (skips --from-index)")
    parser.add_argument("--artist-id", type=str, help="Fetch releases for one artist id")
    parser.add_argument("--festival", type=str, help="Festival id for playlist recognition tiers")
    args = parser.parse_args()

    sync_cmd = [sys.executable, "sync_artists.py"]
    if args.write_festivals:
        sync_cmd.append("--write-festivals")
    if args.add_missing:
        sync_cmd.append("--add-missing")
    run(sync_cmd)

    ran_releases = False
    if args.releases or args.artist or args.artist_id:
        release_cmd = [sys.executable, "fetch_releases.py"]
        if args.max_results:
            release_cmd += ["--max-results", str(args.max_results)]
        if args.artist_id:
            release_cmd += ["--artist-id", args.artist_id]
        elif args.artist:
            release_cmd += ["--artist", args.artist]
        else:
            release_cmd.append("--from-index")
            if args.limit:
                release_cmd += ["--limit", str(args.limit)]
        run(release_cmd)
        ran_releases = True

    if args.playlists:
        playlist_cmd = [sys.executable, "build_playlists.py"]
        if args.artist_id:
            playlist_cmd += ["--artist-id", args.artist_id]
        if args.festival:
            playlist_cmd += ["--festival", args.festival]
        run(playlist_cmd)

    if not ran_releases and not args.playlists:
        print("\n[done] sync only. Add --releases / --playlists to continue.")
        return

    print("\n[done] pipeline complete")


if __name__ == "__main__":
    main()
