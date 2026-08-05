#!/usr/bin/env python3
"""
Step 1→2: 페스티벌 JSON에서 아티스트를 추출·동기화한다.

- public/data/festivals/*.json 의 lineup/slots/allArtists를 읽음
- 각 페스티벌의 allArtists를 슬롯 기준으로 재구성
- --write-festivals 시 artistDisplays 누락분을 Artist.name으로 채움(기존 큐레이션 유지)
- public/data/artists.json 에 없는 ID는 경고(자동 생성은 placeholder만)
- collector/output/_artist_index.json 요약 저장

Usage:
  python3 sync_artists.py
  python3 sync_artists.py --write-festivals   # allArtists + artistDisplays 누락분
  python3 sync_artists.py --add-missing       # 미등록 artistId를 artists.json에 placeholder 추가
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path


SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
FESTIVALS_DIR = PROJECT_ROOT / "public" / "data" / "festivals"
ARTISTS_JSON = PROJECT_ROOT / "public" / "data" / "artists.json"
OUTPUT_DIR = SCRIPT_DIR / "output"
INDEX_PATH = OUTPUT_DIR / "_artist_index.json"


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def festival_files() -> list[Path]:
    return sorted(p for p in FESTIVALS_DIR.glob("*.json") if p.name != "index.json")


def extract_artist_ids(festival: dict) -> list[str]:
    """페스티벌 문서에서 등장 순서를 유지한 unique artistId 목록."""
    ordered: list[str] = []
    seen: set[str] = set()

    def add(aid: str | None):
        if not aid or aid in seen:
            return
        seen.add(aid)
        ordered.append(aid)

    for aid in festival.get("allArtists") or []:
        add(aid)

    for day in festival.get("lineup") or []:
        for aid in day.get("artists") or []:
            add(aid)
        for slot in day.get("slots") or []:
            add(slot.get("artistId"))

    return ordered


def sync(
    *,
    write_festivals: bool = False,
    add_missing: bool = False,
) -> dict:
    artists = load_json(ARTISTS_JSON)
    by_id = {a["id"]: a for a in artists}

    index = load_json(FESTIVALS_DIR / "index.json")
    index_ids = index.get("festivals") or []
    file_ids = [p.stem for p in festival_files()]

    festivals_summary = []
    all_used: list[str] = []
    seen_all: set[str] = set()
    missing: set[str] = set()

    for path in festival_files():
        festival = load_json(path)
        artist_ids = extract_artist_ids(festival)

        for aid in artist_ids:
            if aid not in by_id:
                missing.add(aid)
            if aid not in seen_all:
                seen_all.add(aid)
                all_used.append(aid)

        if write_festivals:
            changed = False
            if festival.get("allArtists") != artist_ids:
                festival["allArtists"] = artist_ids
                changed = True
            # stage1/2 convenience: fill day.artists from slots when empty
            for day in festival.get("lineup") or []:
                if (not day.get("artists")) and day.get("slots"):
                    day_artists = []
                    day_seen = set()
                    for slot in day["slots"]:
                        aid = slot.get("artistId")
                        if aid and aid not in day_seen:
                            day_seen.add(aid)
                            day_artists.append(aid)
                    day["artists"] = day_artists
                    changed = True

            # artistDisplays: 기존 큐레이션 유지, 누락 id만 Artist.name으로 채움
            displays = dict(festival.get("artistDisplays") or {})
            display_changed = False
            for aid in artist_ids:
                label = displays.get(aid)
                if isinstance(label, str) and label.strip():
                    continue
                artist = by_id.get(aid)
                fallback = (artist or {}).get("name") or aid
                displays[aid] = fallback
                display_changed = True
            # drop displays for ids no longer in lineup (optional cleanup)
            stale = [k for k in displays if k not in set(artist_ids)]
            for k in stale:
                del displays[k]
                display_changed = True
            if display_changed or festival.get("artistDisplays") != displays:
                festival["artistDisplays"] = displays
                changed = True

            if changed:
                # keep artistDisplays next to allArtists in file order
                ordered = {}
                for k, v in festival.items():
                    if k == "artistDisplays":
                        continue
                    ordered[k] = v
                    if k == "allArtists":
                        ordered["artistDisplays"] = displays
                if "artistDisplays" not in ordered:
                    ordered["artistDisplays"] = displays
                save_json(path, ordered)
                print(f"[write] {path.name}: allArtists={len(artist_ids)} displays={len(displays)}")

        festivals_summary.append({
            "id": festival.get("id", path.stem),
            "name": festival.get("name"),
            "artistCount": len(artist_ids),
            "artistIds": artist_ids,
            "inIndex": path.stem in index_ids,
        })

    added = []
    if add_missing and missing:
        for aid in sorted(missing):
            # name = 카탈로그 기본명 placeholder. 페스티벌 표기는 festivals.*.artistDisplays.
            # 검수: docs/ARTIST_DISPLAY_NAMES.md
            placeholder = {
                "id": aid,
                "name": aid,
                "englishName": aid.replace("-", " "),
            }
            artists.append(placeholder)
            by_id[aid] = placeholder
            added.append(aid)
        artists.sort(key=lambda a: a["id"])
        save_json(ARTISTS_JSON, artists)
        print(f"[write] artists.json: +{len(added)} placeholders")

    unused = sorted(set(by_id) - seen_all)
    index_missing_files = sorted(set(index_ids) - set(file_ids))
    files_missing_index = sorted(set(file_ids) - set(index_ids))

    summary = {
        "collectedAt": datetime.now(timezone.utc).isoformat(),
        "festivalCount": len(festivals_summary),
        "uniqueArtistCount": len(all_used),
        "artistsJsonCount": len(by_id),
        "missingInArtistsJson": sorted(missing),
        "addedPlaceholders": added,
        "unusedArtists": unused,
        "indexMissingFiles": index_missing_files,
        "filesMissingIndex": files_missing_index,
        "festivals": festivals_summary,
        "artistIds": all_used,
    }

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    save_json(INDEX_PATH, summary)

    print(f"[ok] festivals={len(festivals_summary)} artists={len(all_used)}")
    if missing:
        print(f"[warn] missing in artists.json ({len(missing)}): {', '.join(sorted(missing)[:10])}")
    if index_missing_files:
        print(f"[warn] index entries without file: {index_missing_files}")
    if files_missing_index:
        print(f"[warn] festival files not in index: {files_missing_index}")
    print(f"[save] {INDEX_PATH}")
    return summary


def main():
    parser = argparse.ArgumentParser(description="Sync artists from festival JSON files")
    parser.add_argument(
        "--write-festivals",
        action="store_true",
        help="Rewrite allArtists / empty day.artists; fill missing artistDisplays from Artist.name",
    )
    parser.add_argument(
        "--add-missing",
        action="store_true",
        help="Append missing artistIds to artists.json as placeholders",
    )
    args = parser.parse_args()
    sync(write_festivals=args.write_festivals, add_missing=args.add_missing)


if __name__ == "__main__":
    main()
