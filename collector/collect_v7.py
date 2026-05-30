#!/usr/bin/env python3
"""
FestRecipe Collector v7 - Recursive event-focused collection.
Uses LLM (via agent) to extract event names from titles.
"""

import subprocess, json, re, sys, os
import asyncio
from datetime import datetime, timedelta
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
OUTPUT_DIR = SCRIPT_DIR / "output"
ARTISTS_JSON = SCRIPT_DIR.parent / "public" / "data" / "artists.json"

# yt-dlp
def run_yt(args, timeout=60):
    cmd = ["yt-dlp"] + args + ["--dump-single-json", "--no-warnings"]
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return json.loads(r.stdout) if r.returncode == 0 else None
    except:
        return None

def valid_vid(vid):
    return bool(vid) and len(vid) == 11

def search_flat(q, n=200, dateafter=None):
    a = [f"ytsearch{n}:{q}", "--flat-playlist"]
    if dateafter: a.append(f"--dateafter={dateafter}")
    d = run_yt(a, 120)
    return d.get("entries", []) if d else []

def fetch_plist(pid):
    d = run_yt([f"https://www.youtube.com/playlist?list={pid}", "--flat-playlist"], 120)
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
        except:
            return None

async def fetch_all(vids, conc=10):
    sem = asyncio.Semaphore(conc)
    tasks = [fetch_one(v, sem) for v in vids]
    res, done, total = {}, 0, len(tasks)
    for c in asyncio.as_completed(tasks):
        d = await c; done += 1
        if done % 10 == 0 or done == total:
            print(f"    [detail] {done}/{total}", end="\r")
        if d:
            i = d.get("id", "")
            if i: res[i] = d
    print()
    return res

TV_KW = ['인기가요','뮤직뱅크','음악중심','쇼챔피언','더쇼','엠카운트다운',
         'inkigayo','musicbank','mcountdown','showchampion','theshow',
         'sbs','mbc','kbs','mnet','jtbc','tvn']

def is_tv(title, desc):
    return any(k in f"{title} {desc}".lower() for k in TV_KW)

def has_ts(desc):
    return len(re.findall(r'\d{1,2}:\d{2}(?::\d{2})?\s+\S+', desc or "")) >= 2

def base_queries(name):
    return [f"{name} {s}" for s in
            ["셋리스트","setlist","풀캠 페스티벌","풀캠 콘서트","full set",
             "festival set","concert footage","live set"]]


def round1_search(name, en_name):
    """Phase 1: Broad search, return titles."""
    print(f"\n[Round 1] 검색: {name}")
    titles = []
    seen = set()
    for n in [name, en_name]:
        if not n: continue
        for q in base_queries(n):
            entries = search_flat(q, 200, "20230531")
            for e in entries:
                eid = e.get("id","")
                if eid not in seen and valid_vid(eid):
                    seen.add(eid)
                    titles.append({"id": eid, "title": e.get("title","")})
    print(f"  → {len(titles)}개 영상")
    return titles


def round2_llm_extract_events(titles_with_ids):
    """Phase 2: Use agent (LLM) to extract event names from titles."""
    print(f"\n[Round 2] 공연명 추출 (LLM)")
        
    # Prepare title list for LLM
    titles = [t["title"] for t in t_with_ids]
    
    # Filter out TV broadcasts first
    concert_titles = []
    for t in titles:
        if any(k in t.lower() for k in TV_KW):
            continue
        concert_titles.append(t)
    
    print(f"  TV 방송 제외 후: {len(concert_titles)}개")
    
    # Save titles for agent to read
    tmp_file = OUTPUT_DIR / "_titles_for_llm.json"
    tmp_file.parent.mkdir(exist_ok=True)
    tmp_file.write_text(json.dumps(concert_titles[:500], ensure_ascii=False, indent=2), encoding="utf-8")
    
    print(f"  제목 목록 저장: {tmp_file}")
    print(f"  에이전트가 공연명을 추출합니다...")
    
    return concert_titles  # Agent will process this


def round3_event_search(name, en_name, events):
    """Phase 3: Search with artist + event name."""
    print(f"\n[Round 3] 공연별 재검색: {len(events)}개 공연")
    all_entries = []
    seen = set()
    
    for event in events[:20]:  # Top 20 events
        for n in [name, en_name]:
            if not n: continue
            q = f"{n} {event}"
            entries = search_flat(q, 100, "20230531")
            for e in entries:
                eid = e.get("id","")
                if eid not in seen and valid_vid(eid):
                    seen.add(eid)
                    all_entries.append(e)
    
    print(f"  → {len(all_entries)}개 영상")
    return all_entries


if __name__ == "__main__":
    artists = json.loads(ARTISTS_JSON.read_text())
    
    # Only process specified artists
    targets = [a for a in artists if a["id"] in ["nflying"]]
    
    OUTPUT_DIR.mkdir(exist_ok=True)
    
    for artist in targets:
        name = artist["name"]
        en_name = artist.get("englishName", "")
        aid = artist["id"]
        
        print(f"\n{'='*60}")
        print(f"# {name} ({aid})")
        print(f"{'='*60}")
        
        # Round 1
        titles = round1_search(name, en_name)
        
        # Round 2 - save titles for agent
        OUTPUT_DIR.mkdir(exist_ok=True)
        title_file = OUTPUT_DIR / f"{aid}_titles.json"
        title_file.write_text(json.dumps(titles, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"\n제목 목록 저장: {title_file} ({len(titles)}개)")
        print("→ 에이전트가 공연명 추출 후 재검색합니다")
