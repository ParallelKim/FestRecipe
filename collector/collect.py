#!/usr/bin/env python3
"""
FestRecipe - Setlist Collector v6

Two-phase collection:
  Phase 1: --flat-playlist for fast listing, auto-query from titles
  Phase 2: Individual --dump-single-json for description recovery (async)

Features:
  - Incremental updates via --update flag (skips previously collected)
  - Cross-uploader dedup by normalized title
  - Playlist expansion
  - No regex timestamp patterns (removed for v6)

Usage:
  python3 collect.py --artist "nerd-connection"
  python3 collect.py --artist "nerd-connection" --update
  python3 collect.py --all --years 3
"""

import subprocess
import json
import re
import sys
import argparse
import asyncio
from datetime import datetime, timedelta
from pathlib import Path


SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
ARTISTS_JSON = PROJECT_ROOT / "public" / "data" / "artists.json"
OUTPUT_DIR = SCRIPT_DIR / "output"
CACHE_FILE = OUTPUT_DIR / "_collected_ids.json"

IGNORABLE = {
    "full", "live", "concert", "festival", "setlist", "official",
    "fullcam", "hd", "4k", "8k", "video", "music", "show",
    "performance", "stage", "tour", "fancam",
    "the", "a", "an", "and", "or", "of", "in", "at", "on",
    "to", "for", "with", "by", "from", "this", "that",
} | {str(y) for y in range(2015, 2030)}


def check_yt_dlp():
    try:
        r = subprocess.run(["yt-dlp", "--version"], capture_output=True, text=True, timeout=10)
        print(f"[yt-dlp] {r.stdout.strip()}")
        return True
    except FileNotFoundError:
        print("[ERROR] yt-dlp not found")
        return False


def run_yt_dlp(args, timeout=60):
    cmd = ["yt-dlp"] + args + ["--dump-single-json", "--no-warnings"]
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return json.loads(r.stdout) if r.returncode == 0 else None
    except (subprocess.TimeoutExpired, json.JSONDecodeError):
        return None


def valid_vid(vid):
    return bool(vid) and len(vid) == 11


def is_plist(e):
    return e.get("_type") == "playlist"


def search_flat(q, n=200, dateafter=None):
    a = [f"ytsearch{n}:{q}", "--flat-playlist"]
    if dateafter:
        a.append(f"--dateafter={dateafter}")
    d = run_yt_dlp(a, 120)
    return d.get("entries", []) if d else []


def fetch_plist(pid):
    d = run_yt_dlp([f"https://www.youtube.com/playlist?list={pid}", "--flat-playlist"], 120)
    return [e for e in (d.get("entries") or []) if valid_vid(e.get("id", ""))] if d else []


async def fetch_one(vid, sem):
    async with sem:
        try:
            p = await asyncio.create_subprocess_exec(
                "yt-dlp", f"https://www.youtube.com/watch?v={vid}",
                "--dump-single-json", "--no-playlist", "--no-warnings",
                stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
            o, _ = await asyncio.wait_for(p.communicate(), 25)
            return json.loads(o) if p.returncode == 0 else None
        except (asyncio.TimeoutError, json.JSONDecodeError):
            return None


async def fetch_all(vids, conc=20):
    sem = asyncio.Semaphore(conc)
    tasks = [fetch_one(v, sem) for v in vids]
    res, done, total = {}, 0, len(tasks)
    for c in asyncio.as_completed(tasks):
        d = await c
        done += 1
        if done % 10 == 0 or done == total:
            print(f"    [detail] {done}/{total}", end="\r")
        if d:
            i = d.get("id", "")
            if i:
                res[i] = d
    print()
    return res


def norm_title(t):
    t = re.sub(r"[^\w\s\uAC00-\uD7AF]", " ", t.lower())
    return re.sub(r"\s+", " ", t).strip()


def extract_events(titles, existing_qs=None):
    pats = [
        r"\u3010([^\u3011]+)\u3011",
        r'"([^"]+(?:festival|concert|tour|live|show|gmf|bml|dmf|penta|jisan|valley)[^"]*)"',
        r"\(([^)]+(?:festival|concert|tour|gmf|bml|dmf|penta|jisan|valley|ucc|hello)[^)]*)\)",
    ]
    ex = set(q.lower() for q in (existing_qs or []))
    ev = set()
    for t in titles:
        for p in pats:
            for m in re.findall(p, t, re.IGNORECASE):
                m = m.strip()
                if 3 <= len(m) <= 80:
                    ev.add(m)
        for y in range(2020, 2028):
            if str(y) in t:
                idx = t.index(str(y))
                snip = re.sub(r"[^\w\s\uAC00-\uD7AF]", " ", t[idx:idx + 40])
                parts = [p for p in snip.split() if p.lower() not in IGNORABLE]
                if parts:
                    cand = " ".join(parts[:4]).strip()
                    if len(cand) >= 3:
                        ev.add(cand)
    out = []
    for e in sorted(ev, key=len, reverse=True):
        el = e.lower()
        if not any(el in x or x in el for x in ex):
            out.append(e)
    return out[:10]


def extract_playlist_urls(text):
    """Extract YouTube playlist URLs from text."""
    urls = set()
    # Pattern: youtube.com/playlist?list=PL...
    plist_matches = re.findall(
        r'https?://(?:www\.)?youtube\.com/playlist\?list=([A-Za-z0-9_-]+)',
        text
    )
    for pid in plist_matches:
        urls.add(f"https://www.youtube.com/playlist?list={pid}")
    # Pattern: list=PL... (without full url)
    list_matches = re.findall(r'list=([A-Za-z0-9_-]{10,})', text)
    for pid in list_matches:
        if pid not in ['LL', 'WL', 'FL']:
            urls.add(f"https://www.youtube.com/playlist?list={pid}")
    return list(urls)


def load_cache():
    return set(json.loads(CACHE_FILE.read_text()).get("ids", [])) if CACHE_FILE.exists() else set()


def save_cache(ids):
    CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    CACHE_FILE.write_text(json.dumps({"updatedAt": datetime.now().isoformat(), "ids": list(ids)}))


def base_queries(name):
    return [f"{name} {s}" for s in
            ["fullcam", "setlist", "festival", "concert", "live", "tour", "fancam"]]


def collect(artist, years=3, maxv=500, conc=20, update=False, prev_ids=None):
    aid = artist["id"]
    aname = artist["name"]
    ename = artist.get("englishName", "")
    names = [aname]
    if ename and ename.lower() != aname.lower():
        names.append(ename)
    da = (datetime.now() - timedelta(days=years * 365)).strftime("%Y%m%d")

    print(f"\n{'='*60}\n[collect] {aname} (ID: {aid})")
    print(f"  period: {da}~, max {maxv}, conc {conc}, mode: {'update' if update else 'full'}")
    if prev_ids:
        print(f"  skip {len(prev_ids)} cached")
    print("=" * 60)

    bqs = []
    for n in names:
        bqs.extend(base_queries(n))

    print("\n[Phase 1] listing")
    seen, entries, pids, titles = set(), [], [], []

    def ingest(es):
        nv, np = 0, 0
        for e in es:
            i = e.get("id", "")
            if i in seen or (prev_ids and i in prev_ids):
                continue
            if is_plist(e):
                pids.append(i)
                seen.add(i)
                np += 1
            elif valid_vid(i):
                entries.append(e)
                seen.add(i)
                nv += 1
                titles.append(e.get("title", ""))
        return nv, np

    for q in bqs:
        nv, np = ingest(search_flat(q, 200, da))
        if nv or np:
            print(f"  {q[:50]:50s} +{nv:3d}v +{np}pl")

    # auto-query
    auto = extract_events(titles[:200], bqs)
    if auto:
        print(f"\n[auto-q] {len(auto)}: {auto[:5]}")
        for ev in auto:
            for n in names:
                nv, _ = ingest(search_flat(f"{n} {ev}", 50, da))
                if nv:
                    print(f"  {n} {ev[:45]:45s} +{nv:3d}v")

    for pid in pids:
        added = 0
        for pv in fetch_plist(pid):
            v = pv.get("id", "")
            if valid_vid(v) and v not in seen:
                if prev_ids and v in prev_ids:
                    continue
                seen.add(v)
                entries.append(pv)
                titles.append(pv.get("title", ""))
                added += 1
        if added:
            print(f"  [plist] {pid} +{added}v")

    print(f"\n[Phase 1 done] {len(entries)}v, {len(pids)} plists")

    # dedup
    deduped, seen_norm, dups = [], {}, []
    for e in entries:
        n = norm_title(e.get("title", ""))
        if n in seen_norm:
            dups.append((seen_norm[n], e["id"]))
            continue
        seen_norm[n] = e["id"]
        deduped.append(e)
    if dups:
        print(f"  [dedup] {len(dups)} removed")

    target = deduped[:maxv]
    print(f"  detail target: {len(target)}")

    # Phase 2
    print(f"\n[Phase 2] detail ({len(target)}v)")
    tids = [e["id"] for e in target]
    dets = asyncio.run(fetch_all(tids, conc))

    videos = []
    for e in target:
        v = e["id"]
        t, d, u, dur, vc, ud = (
            e.get("title", ""), e.get("description", "") or "",
            e.get("uploader", ""), e.get("duration"), e.get("view_count"), e.get("upload_date"))
        if v in dets:
            dd = dets[v]
            t = dd.get("title", t)
            d = dd.get("description", d) or ""
            u, dur, vc, ud = dd.get("uploader", u), dd.get("duration", dur), dd.get("view_count", vc), dd.get("upload_date", ud)
        videos.append({"videoId": v, "title": t, "description": d, "url": f"https://www.youtube.com/watch?v={v}",
                        "uploader": u, "duration": dur, "viewCount": vc, "uploadDate": ud})

    hd = sum(1 for v in videos if v["description"])
    print(f"\n[stats] {hd}/{len(videos)} have desc")
    return {"artistId": aid, "artistName": aname, "englishName": ename,
            "collectedAt": datetime.now().isoformat(),
            "stats": {"years": years, "newCandidates": len(entries) + len(pids),
                      "playlistsExpanded": len(pids), "titleDeduped": len(dups),
                      "totalCollected": len(videos), "hasDescription": hd,
                      "autoQueries": len(auto), "update": update}, "videos": videos}


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--artist", type=str)
    p.add_argument("--all", action="store_true")
    p.add_argument("--years", type=int, default=3)
    p.add_argument("--max-videos", type=int, default=500)
    p.add_argument("--concurrency", type=int, default=20)
    p.add_argument("--update", action="store_true")
    p.add_argument("--output", type=str, default=None)
    a = p.parse_args()

    if not check_yt_dlp():
        sys.exit(1)

    od = Path(a.output) if a.output else OUTPUT_DIR
    od.mkdir(parents=True, exist_ok=True)
    aa = json.loads(ARTISTS_JSON.read_text())

    if a.artist:
        arts = [x for x in aa if a.artist.lower() in (x.get("name", "").lower(), x.get("englishName", "").lower())]
        if not arts:
            print(f"[ERR] '{a.artist}' not found"); sys.exit(1)
    elif a.all:
        arts = aa
    else:
        p.print_help(); sys.exit(1)

    pids = load_cache() if a.update else set()
    print(f"\n{'#'*60}\n# FestRecipe Collector v6\n# {len(arts)} artists, {a.years}y, max {a.max_videos}\n# {'update' if a.update else 'full'}, cached: {len(pids)}\n{'#'*60}")

    all_ids = set(pids)
    res = []
    for art in arts:
        r = collect(art, a.years, a.max_videos, a.concurrency, a.update, pids)
        res.append(r)
        for v in r["videos"]:
            all_ids.add(v["videoId"])
        (od / f'{art["id"]}.json').write_text(json.dumps(r, ensure_ascii=False, indent=2), encoding="utf-8")

    save_cache(all_ids)
    (od / "_summary.json").write_text(json.dumps(res, ensure_ascii=False, indent=2), encoding="utf-8")
    tot = sum(x["stats"]["totalCollected"] for x in res)
    td = sum(x["stats"]["hasDescription"] for x in res)
    print(f"\n{'='*60}\n[done] {len(res)} artists, {tot}v (desc: {td}), cached: {len(all_ids)}\n{'='*60}")


if __name__ == "__main__":
    main()
