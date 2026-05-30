import json, re
from pathlib import Path

output_dir = Path('/Users/oong/projects/side-project/FestRecipe/collector/output')
files = sorted([f for f in output_dir.glob('*.json') if not f.name.startswith('_')])

total_videos = 0
total_ts = 0
artists_with_ts = []

for f in files:
    try:
        d = json.load(open(f))
        name = d.get('artistName', f.stem)
        videos = d.get('videos', [])
        n = len(videos)
        ts = 0
        for v in videos:
            desc = v.get('description', '') or ''
            if re.search(r'\d{1,2}:\d{2}', desc):
                ts += 1
        total_videos += n
        total_ts += ts
        if ts > 0:
            artists_with_ts.append((name, ts, n))
    except Exception as e:
        print(f'ERR {f.name}: {e}')

print(f'아티스트: {len(files)}, 총 영상: {total_videos}, 타임스탬프: {total_ts}')
print()
artists_with_ts.sort(key=lambda x: x[1], reverse=True)
for name, ts, n in artists_with_ts[:20]:
    print(f'{name:25s} ts={ts:3d} / total={n:3d}')

if artists_with_ts:
    # Show sample
    print('\n=== 샘플 ===')
    for name, ts, n in artists_with_ts[:3]:
        f = output_dir / f'{name}.json'
        if f.exists():
            d = json.load(open(f))
            for v in d.get('videos', []):
                desc = v.get('description', '') or ''
                if re.search(r'\d{1,2}:\d{2}', desc):
                    print(f'\n[{name}] {v["title"][:70]}')
                    for line in desc.split('\n')[:8]:
                        if re.search(r'\d{1,2}:\d{2}', line):
                            print(f'  {line[:90]}')
                    break
