#!/usr/bin/env python3
"""
FestRecipe Collector - Batch runner with retry logic.
Runs collect.py for all artists, retries on failure.
"""

import subprocess, json, sys, time, traceback
from pathlib import Path
from datetime import datetime

SCRIPT_DIR = Path(__file__).parent
ARTISTS_JSON = SCRIPT_DIR.parent / "public" / "data" / "artists.json"
LOG_FILE = SCRIPT_DIR / "output" / "_batch_log.json"

MAX_RETRIES = 3
RETRY_DELAY = 30  # seconds


def load_log():
    if LOG_FILE.exists():
        return json.loads(LOG_FILE.read_text())
    return {"completed": [], "failed": [], "last_run": None}


def save_log(log):
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    LOG_FILE.write_text(json.dumps(log, ensure_ascii=False, indent=2), encoding="utf-8")


def run_artist(artist, max_videos=100, concurrency=5):
    """Run collect.py for a single artist. Returns (success, output_file)."""
    aid = artist["id"]
    cmd = [
        sys.executable, str(SCRIPT_DIR / "collect.py"),
        "--artist", artist["name"],
        "--max-videos", str(max_videos),
        "--concurrency", str(concurrency),
        "--output", str(SCRIPT_DIR / "output"),
    ]
    
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            print(f"  [attempt {attempt}/{MAX_RETRIES}] running: {artist['name']}")
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=1800,  # 30 min timeout per artist
            )
            
            if result.returncode == 0:
                out_file = SCRIPT_DIR / "output" / f"{aid}.json"
                if out_file.exists():
                    data = json.loads(out_file.read_text())
                    collected = data.get("stats", {}).get("totalCollected", 0)
                    print(f"  ✓ {artist['name']}: {collected} videos collected")
                    return True, str(out_file)
                else:
                    print(f"  ✗ {artist['name']}: output file not found")
            else:
                err = result.stderr[-500:] if result.stderr else "no stderr"
                print(f"  ✗ {artist['name']}: exit code {result.returncode}")
                print(f"    stderr: {err[:200]}")
                
        except subprocess.TimeoutExpired:
            print(f"  ✗ {artist['name']}: timed out after 30min")
        except Exception as e:
            print(f"  ✗ {artist['name']}: {e}")
            traceback.print_exc()
        
        if attempt < MAX_RETRIES:
            print(f"  retrying in {RETRY_DELAY}s...")
            time.sleep(RETRY_DELAY)
    
    return False, None


def main():
    all_artists = json.loads(ARTISTS_JSON.read_text())
    log = load_log()
    
    print(f"\n{'#'*60}")
    print(f"# FestRecipe Batch Collector")
    print(f"# Total artists: {len(all_artists)}")
    print(f"# Previously completed: {len(log['completed'])}")
    print(f"# Previously failed: {len(log['failed'])}")
    print(f"# Started at: {datetime.now().isoformat()}")
    print(f"{'#'*60}\n")
    
    # Filter out already completed
    completed_ids = set(log.get("completed", []))
    pending = [a for a in all_artists if a["id"] not in completed_ids]
    
    print(f"Pending: {len(pending)} artists\n")
    
    newly_completed = []
    newly_failed = []
    
    for i, artist in enumerate(pending):
        print(f"\n[{i+1}/{len(pending)}] {artist['name']} ({artist['id']})")
        
        success, out_file = run_artist(artist, max_videos=50, concurrency=5)
        
        if success:
            newly_completed.append(artist["id"])
        else:
            newly_failed.append({
                "id": artist["id"],
                "name": artist["name"],
                "time": datetime.now().isoformat(),
            })
        
        # Save progress after each artist
        log["completed"] = list(set(log.get("completed", []) + newly_completed))
        log["failed"] = [f for f in log.get("failed", []) if f["id"] not in newly_completed] + newly_failed
        log["last_run"] = datetime.now().isoformat()
        save_log(log)
    
    # Summary
    print(f"\n{'='*60}")
    print(f"# Batch Complete")
    print(f"# Newly completed: {len(newly_completed)}")
    print(f"# Newly failed: {len(newly_failed)}")
    print(f"# Total completed: {len(log['completed'])}")
    print(f"# Total failed: {len(log['failed'])}")
    print(f"{'='*60}")
    
    if newly_failed:
        print("\nFailed artists:")
        for f in newly_failed:
            print(f"  - {f['name']} ({f['id']})")


if __name__ == "__main__":
    main()
