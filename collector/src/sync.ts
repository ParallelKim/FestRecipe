import * as fs from "fs";
import * as path from "path";
import { db } from "./firebase";

const OUTPUT_DIR = path.join(__dirname, "..", "output");

interface CollectedVideo {
  videoId: string;
  title: string;
  description: string;
  url: string;
  uploader: string;
  duration: number | null;
  viewCount: number | null;
  uploadDate: string | null;
}

interface CollectedResult {
  artistId: string;
  artistName: string;
  englishName: string;
  collectedAt: string;
  stats: Record<string, number | boolean>;
  videos: CollectedVideo[];
}

async function syncArtist(result: CollectedResult): Promise<void> {
  const { artistId, artistName, videos, collectedAt, stats } = result;

  console.log(`[sync] ${artistName} (${artistId}) — ${videos.length} videos`);

  // 1. 아티스트 문서 업데이트
  const artistRef = db.collection("artists").doc(artistId);
  await artistRef.set(
    {
      name: artistName,
      englishName: result.englishName || null,
      updatedAt: collectedAt,
      videoCount: videos.length,
      stats,
    },
    { merge: true }
  );

  // 2. 영상을 배치로 저장 (Firestore batch = 500개 제한)
  const col = artistRef.collection("videos");
  const batchSize = 400;
  for (let i = 0; i < videos.length; i += batchSize) {
    const batch = db.batch();
    const chunk = videos.slice(i, i + batchSize);
    for (const v of chunk) {
      const docRef = col.doc(v.videoId);
      batch.set(docRef, {
        videoId: v.videoId,
        title: v.title,
        description: v.description,
        url: v.url,
        uploader: v.uploader,
        duration: v.duration,
        viewCount: v.viewCount,
        uploadDate: v.uploadDate,
        syncedAt: collectedAt,
      });
    }
    await batch.commit();
    console.log(`  [batch] ${i + chunk.length}/${videos.length}`);
  }

  console.log(`[done] ${artistName} synced`);
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    console.error("[ERR] output/ not found. Run collect.py first.");
    process.exit(1);
  }

  const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith(".json") && !f.startsWith("_"));

  if (files.length === 0) {
    console.error("[ERR] No result files found in output/");
    process.exit(1);
  }

  console.log(`[sync] ${files.length} files found`);

  const summary: { artistId: string; artistName: string; videos: number }[] = [];

  for (const file of files) {
    const data: CollectedResult = JSON.parse(fs.readFileSync(path.join(OUTPUT_DIR, file), "utf-8"));
    await syncArtist(data);
    summary.push({ artistId: data.artistId, artistName: data.artistName, videos: data.videos.length });
  }

  // 동기화 요약
  const summaryRef = db.collection("_sync").doc("last");
  await summaryRef.set({
    syncedAt: new Date().toISOString(),
    artists: summary,
    totalVideos: summary.reduce((s, a) => s + a.videos, 0),
  });

  console.log(`\n[sync complete] ${summary.length} artists, ${summaryRef ? "?" : "?"} total`);
  const total = summary.reduce((s, a) => s + a.videos, 0);
  console.log(`[sync complete] ${summary.length} artists, ${total} total videos`);
}

main().catch(err => {
  console.error("[FATAL]", err);
  process.exit(1);
});
