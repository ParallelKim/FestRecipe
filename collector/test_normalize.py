#!/usr/bin/env python3
"""
LLM 셋리스트 정규화 테스트
수집된 description에서 셋리스트를 추출하여 JSON으로 정규화
"""

import json, re

# 엔플라잉 데이터
data = json.load(open('/Users/oong/projects/side-project/FestRecipe/collector/output/nflying.json'))
videos = data.get('videos', [])

print(f"총 {len(videos)}개 영상\n")

# 셋리스트 패턴 추출
ts_pattern = re.compile(r'(\d{1,2}:\d{2}(?::\d{2})?)\s+(.+)')

results = []

for v in videos:
    title = v.get('title', '')
    desc = v.get('description', '') or ''
    
    # 제목에서 공연명 추출
    event_name = None
    
    # "페스티벌", "콘서트", "축제" 등이 포함된 부분 추출
    for kw in ['페스티벌', '콘서트', '축제', '페스타', 'festival', 'concert', '대동제']:
        if kw.lower() in title.lower():
            # 키워드 앞뒤로 공연명 추출
            idx = title.lower().index(kw.lower())
            # 날짜 패턴 이후부터 추출
            after_date = re.sub(r'^\d{6,8}\s*', '', title)
            # 키워드 포함하여 추출
            start = max(0, after_date.lower().index(kw.lower()) - 20)
            end = min(len(after_date), after_date.lower().index(kw.lower()) + len(kw) + 20)
            event_name = after_date[start:end].strip()
            # 정리
            event_name = re.sub(r'\s*\|\s*.*$', '', event_name)  # | 이후 제거
            event_name = re.sub(r'\s*FULL\s*CAM.*$', '', event_name, flags=re.I)
            event_name = re.sub(r'\s*풀캠.*$', '', event_name, flags=re.I)
            event_name = event_name.strip()
            break
    
    if not event_name:
        continue
    
    # Description에서 곡명 추출 (타임스탬프 패턴)
    songs = []
    for line in desc.split('\n'):
        line = line.strip()
        match = ts_pattern.match(line)
        if match:
            timestamp = match.group(1)
            song = match.group(2).strip()
            # 멘트나 특수 항목은 제외
            if song not in ['⭐멘트', '⭐등장', '⭐지엔감지엔사', '⭐', '']:
                songs.append(f"{timestamp} {song}")
    
    if songs:
        results.append({
            "event": event_name,
            "date": title[:8] if re.match(r'\d{8}', title) else "unknown",
            "songs": songs,
            "source_title": title,
            "url": v.get('url', ''),
        })

print(f"=== 추출된 셋리스트: {len(results)}개 공연 ===\n")

for r in results:
    print(f"[{r['date']}] {r['event']}")
    print(f"  곡 수: {len(r['songs'])}곡")
    print(f"  URL: {r['url']}")
    print(f"  곡 목록 (일부):")
    for s in r['songs'][:5]:
        print(f"    {s}")
    if len(r['songs']) > 5:
        print(f"    ... 외 {len(r['songs'])-5}곡")
    print()

# 중복 공연 병합
print("=== 중복 병합 ===")
merged = {}
for r in results:
    key = re.sub(r'\s+', ' ', r['event'].lower().strip())
    # 날짜가 다르면 별도로 유지
    date = r['date']
    merge_key = f"{key}_{date}"
    
    if merge_key not in merged:
        merged[merge_key] = r
    else:
        # 곡 수가 더 많은 것으로 유지
        if len(r['songs']) > len(merged[merge_key]['songs']):
            merged[merge_key] = r

print(f"병합 후: {len(merged)}개 공연\n")

for key, r in sorted(merged.items()):
    print(f"[{r['date']}] {r['event']}: {len(r['songs'])}곡")
