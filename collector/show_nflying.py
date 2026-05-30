import json

d = json.load(open('/Users/oong/projects/side-project/FestRecipe/collector/output/nflying.json'))

print(f"엔플라잙 (N.Flying) - 총 {len(d['videos'])}개 영상\n")
print("=" * 80)

for i, v in enumerate(d['videos'], 1):
    title = v.get('title', '')
    desc_len = len(v.get('description', '') or '')
    uploader = v.get('uploader', '')
    upload_date = v.get('uploadDate', '')
    
    # 타임스탬프 수 확인
    import re
    ts_count = len(re.findall(r'\d{1,2}:\d{2}', v.get('description', '') or ''))
    
    print(f"{i:2d}. [{upload_date}] ({desc_len:4d}자, {ts_count:2d}TS) [{uploader[:15]}]")
    print(f"    {title}")
    print()
