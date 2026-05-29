#!/usr/bin/env python3
"""
Namu Wiki Crawler v2 - Extracts artist events/festivals from namu.wiki.
Handles namu.wiki's client-side rendered structure.
"""

import urllib.request, re, sys, json, urllib.parse
from pathlib import Path

FESTIVAL_KEYWORDS = ["페스티벌", "페스티발", "락페스티벌", "록페스티벌",
                     "festival", "공연", "콘서트", "투어", "tour", "단독공연", "전국투어"]
KNOWN_FESTIVALS = [
    "그랜드민트페스티벌", "GMF", "펜타포트", "펜타포트 락페스티벌",
    "뷰티풀 민트 라이프", "BML", "잔다리페스타", "슈퍼소닉",
    "지산", "그린플러그드", "렛츠락", "자라섬",
    "사운드베리", "매드포갈릭", "DMZ", "피스트레인",
]


def fetch_page(title):
    encoded = urllib.parse.quote(title.encode("utf-8"))
    url = f"https://namu.wiki/w/{encoded}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.read().decode("utf-8", errors="replace")
    except Exception as e:
        print(f"  [warn] fetch failed: {e}")
        return ""


def get_toc(html):
    """Extract table of contents: list of (section_id, number, name)."""
    toc = re.findall(
        r"<a href='#s-(\d+(?:\.\d+)*)'[^>]*>(\d+(?:\.\d+)*)</a>\.\s*([^<]+)",
        html
    )
    return [(sid, num, name.strip()) for sid, num, name in toc]


def get_section_by_id(html, section_id):
    """Extract HTML content of a section by its anchor ID."""
    pat = rf'<[a-z][^>]*id="?{section_id}"[^>]*>'
    start = re.search(pat, html)
    if not start:
        return ""
    next_sec = re.search(r'<[a-z][^>]*id="s-', html[start.end():])
    if next_sec:
        return html[start.start():start.end() + next_sec.start()]
    return html[start.start():start.start() + 8000]


def strip_html(html):
    text = re.sub(r'<[^>]+>', '\n', html)
    text = re.sub(r'&[a-z]+;', ' ', text)
    text = re.sub(r'&#\d+;', ' ', text)
    return re.sub(r'\n{3,}', '\n\n', text).strip()


def extract_events(text):
    events = set()
    for line in text.split('\n'):
        line = line.strip()
        if not line or len(line) < 4:
            continue
        # Date-event pattern: (YY.MMDD) Event
        m = re.match(r'\((\d{2,4}[.\-/]\d{2,4}[.\-/]\d{2,4})\)\s*(.+)', line)
        if m:
            events.add(m.group(2).strip())
            continue
        # Bullet with keyword
        bm = re.match(r'^[•\-*]\s*(.+)', line)
        if bm:
            content = bm.group(1).strip()
            if any(kw in content for kw in FESTIVAL_KEYWORDS):
                events.add(content)
            continue
        # Known festival anywhere in line
        for fest in KNOWN_FESTIVALS:
            if fest.lower() in line.lower():
                idx = line.lower().find(fest.lower())
                ctx = line[max(0, idx - 10):idx + len(fest) + 25].strip()
                if ctx:
                    events.add(ctx)
                break
    return events


def crawl(artist_name):
    print(f"\n[namu] Crawling: {artist_name}")
    html = fetch_page(artist_name)
    if not html:
        return []

    toc = get_toc(html)
    print(f"  TOC: {len(toc)} sections")
    for sid, num, name in toc:
        if any(kw in name for kw in ['활동', '공연', '페스티벌', '콘서트', '투어']):
            print(f"    → {num}. {name} (#s-{sid})")

    # Extract from target sections
    targets = ['활동', '공연', '페스티벌', '콘서트']
    all_events = {}
    for sid, num, name in toc:
        if any(t in name for t in targets):
            sec_html = get_section_by_id(html, f"s-{sid}")
            if sec_html:
                text = strip_html(sec_html)
                evts = extract_events(text)
                if evts:
                    all_events[f"{num}. {name}"] = list(evts)
                    print(f"  [{num}. {name}] {len(evts)} events")

    # Also from full page
    full_text = strip_html(html)
    full_evts = set()
    for line in full_text.split('\n'):
        line = line.strip()
        for fest in KNOWN_FESTIVALS:
            if fest.lower() in line.lower() and len(line) < 100:
                full_evts.add(line)
                break
    if full_evts:
        all_events['page_text'] = list(full_evts)

    result = []
    seen = set()
    for src, evts in all_events.items():
        for e in evts:
            norm = re.sub(r'\s+', ' ', e.lower().strip())
            if norm not in seen and len(e.strip()) >= 3:
                seen.add(norm)
                result.append({"text": e.strip(), "source": src})

    print(f"\n[namu] Total: {len(result)} unique events")
    return result


if __name__ == "__main__":
    artist = sys.argv[1] if len(sys.argv) > 1 else "잔나비"
    events = crawl(artist)
    output = {"artist": artist, "events": events, "total": len(events)}
    out = Path(f"output/namu_{artist}.json")
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    for e in events[:15]:
        print(f"  [{e['source']}] {e['text'][:90]}")
    print(f"\nSaved to {out}")
