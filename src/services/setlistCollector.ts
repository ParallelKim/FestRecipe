/**
 * setlistCollector.ts
 *
 * [목적]
 * 아티스트 이름을 CLI 인자로 받아, YouTube에서 해당 아티스트의 과거 공연 영상을
 * 자동으로 수집하고, 각 공연의 셋리스트(곡 제목 + 순서 + 타임스탬프)를 추출하여
 * Firestore에 저장합니다.
 *
 * [파이프라인 — 두 가지 수집 경로]
 *
 * ① 풀캠 경로 (단일 영상 + 설명글 타임라인)
 *    검색 → 후보 영상 필터링 → description 재조회 → 타임라인 파싱
 *    예: "너드커넥션 2025 BML 풀영상" → 설명글 "00:00 좋은 밤 좋은 꿈 ..."
 *
 * ② 재생목록 경로 (곡별 분리 영상 + 재생 순서)
 *    검색 → 재생목록 URL 감지 → 재생목록 전체 조회 → 각 영상 제목에서 곡명 추출
 *    예: "너드커넥션 2024 콘서트" 재생목록 → 영상1 "좋은 밤 좋은 꿈", 영상2 "개화" ...
 *    재생목록 내 영상 순서 = 셋리스트 순서
 *
 * [실행 방법]
 * npx ts-node setlistCollector.ts --artist "너드커넥션" --id "nerd-connection"
 * npx ts-node setlistCollector.ts --artist "잔나비" --id "jannabi" --limit 10
 *
 * [의존성]
 * - yt-dlp (CLI 설치 필요: https://github.com/yt-dlp/yt-dlp)
 * - firebase/app, firebase/firestore
 * - 환경변수에 VITE_FIREBASE_* 또는 FIREBASE_* 설정
 */

import { execSync } from 'child_process';
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { setDoc, getFirestore, Firestore, doc, collection } from 'firebase/firestore';

// ─────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────

export type SongType = "released" | "unreleased" | "cover";

/**
 * sourceType: 셋리스트가 어떤 방식으로 수집됐는지 기록
 *   'fullcam'  - 풀캠 단일 영상의 설명글 타임라인에서 파싱
 *   'playlist' - 재생목록의 곡별 분리 영상 순서에서 추출
 */
export type SetlistSourceType = "fullcam" | "playlist";

export interface SetlistSong {
    order: number; // 셋리스트 내 순서 (1부터 시작)
    songTitle: string; // 곡 제목
    songType: SongType; // released / unreleased / cover
    // 풀캠: 타임스탬프 초(0이면 전체 영상 시작), 재생목록: 0 고정
    timestampSeconds: number;
    // 풀캠: &t=Ns 포함 URL, 재생목록: 해당 곡 개별 영상 URL
    youtubeUrl: string;
}

export interface ConcertSetlist {
    concertLabel: string; // 공연 식별명 (예: "2025 BML")
    concertYear: string; // 연도 (예: "2025")
    sourceType: SetlistSourceType; // 수집 경로
    // 풀캠일 때 채워짐
    youtubeFullcamVideoId: string | null;
    youtubeFullcamUrl: string | null;
    // 재생목록일 때 채워짐
    youtubePlaylistId: string | null;
    youtubePlaylistUrl: string | null;
    updatedAt: string; // ISO 수집 시각
    songs: SetlistSong[]; // 셋리스트 (순서 보존)
}

// yt-dlp에서 받아오는 원시 메타
interface RawVideoMeta {
    videoId: string;
    title: string;
    description: string;
    playlistId?: string;
}

// ─────────────────────────────────────────────
// Firebase 초기화
// ─────────────────────────────────────────────

function initFirebase(): Firestore | null {
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
    if (!projectId) {
        console.warn("[Firebase] FIREBASE_PROJECT_ID 환경변수가 없습니다. Firestore 저장을 건너뜁니다.");
        return null;
    }
    const firebaseConfig = {
        apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
        authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
        projectId,
        storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
    };
    const app: FirebaseApp = initializeApp(firebaseConfig);
    return getFirestore(app);
}

// ─────────────────────────────────────────────
// yt-dlp 래퍼
// ─────────────────────────────────────────────

function checkYtDlp(): void {
    try {
        execSync("yt-dlp --version", { stdio: "pipe" });
    } catch {
        throw new Error(
            "yt-dlp가 설치되어 있지 않습니다.\n" +
                "설치: pip install yt-dlp  또는  brew install yt-dlp\n" +
                "참고: https://github.com/yt-dlp/yt-dlp#installation",
        );
    }
}

/**
 * YouTube 키워드 검색 → 영상/재생목록 메타 목록 반환 (flat, 빠름)
 * description은 대부분 빈 값 → fetchVideoDetail()로 보완 필요
 */
function searchYouTube(query: string, maxResults: number): RawVideoMeta[] {
    console.log(`  [검색] "${query}"`);
    const cmd = `yt-dlp "ytsearch${maxResults}:${query}" --dump-single-json --flat-playlist --no-warnings`;
    try {
        const out = execSync(cmd, { encoding: "utf-8", timeout: 30_000 });
        const entries: any[] = JSON.parse(out).entries || [];
        return entries.map((e) => ({
            videoId: e.id || "",
            title: e.title || "",
            description: e.description || "",
            playlistId: e.playlist_id || undefined,
        }));
    } catch (err: any) {
        console.error("  [검색 오류]", err.message);
        return [];
    }
}

/**
 * 단일 영상의 상세 메타 조회 (description 전문 복구용)
 */
function fetchVideoDetail(videoId: string): RawVideoMeta | null {
    const cmd = `yt-dlp "https://www.youtube.com/watch?v=${videoId}" --dump-single-json --no-playlist --no-warnings`;
    try {
        const out = execSync(cmd, { encoding: "utf-8", timeout: 20_000 });
        const e = JSON.parse(out);
        return {
            videoId: e.id || videoId,
            title: e.title || "",
            description: e.description || "",
            playlistId: e.playlist_id || undefined,
        };
    } catch (err: any) {
        console.error(`  [상세조회 오류] ${videoId}:`, err.message);
        return null;
    }
}

/**
 * 재생목록 전체의 영상 목록을 순서대로 반환합니다.
 * 재생목록 내 각 영상은 개별 곡에 해당하므로, 영상 순서 = 셋리스트 순서입니다.
 *
 * yt-dlp는 재생목록을 flat으로 조회할 때 playlist_index를 포함하므로
 * 이를 order 값으로 사용합니다.
 */
function fetchPlaylistVideos(playlistId: string): Array<RawVideoMeta & { playlistIndex: number }> {
    console.log(`  [재생목록 조회] playlist ID: ${playlistId}`);
    const url = `https://www.youtube.com/playlist?list=${playlistId}`;
    const cmd = `yt-dlp "${url}" --dump-single-json --flat-playlist --no-warnings`;
    try {
        const out = execSync(cmd, { encoding: "utf-8", timeout: 60_000 });
        const data = JSON.parse(out);
        const entries: any[] = data.entries || [];
        return entries.map((e, idx) => ({
            videoId: e.id || "",
            title: e.title || "",
            description: e.description || "",
            playlistId,
            playlistIndex: e.playlist_index ?? idx + 1,
        }));
    } catch (err: any) {
        console.error(`  [재생목록 조회 오류] ${playlistId}:`, err.message);
        return [];
    }
}

// ─────────────────────────────────────────────
// 소스 타입 판별
// ─────────────────────────────────────────────

const TIMESTAMP_RE = /(?:\d{1,2}:)?\d{1,2}:\d{2}/;

/**
 * 검색 결과 하나가 재생목록인지 풀캠인지 판별합니다.
 *
 * 재생목록 판단 기준:
 *   - yt-dlp 검색 결과의 entry type이 'playlist'
 *   - 제목에 재생목록 키워드 포함 (단, 풀캠 키워드가 더 강하면 풀캠 우선)
 *   - 설명에 타임라인이 없고 재생목록 ID가 있는 경우
 */
const PLAYLIST_KEYWORDS = ["재생목록", "playlist", "전곡", "모아보기", "공연 영상 모음", "직캠 모음"];
const FULLCAM_KEYWORDS = ["풀영상", "풀캠", "fullcam", "full cam", "full video", "전체 영상", "full concert"];

function detectSourceType(video: RawVideoMeta): SetlistSourceType {
    const text = `${video.title} ${video.description}`.toLowerCase();

    const isFullcam = FULLCAM_KEYWORDS.some((kw) => text.includes(kw.toLowerCase()));
    const isPlaylist = PLAYLIST_KEYWORDS.some((kw) => text.includes(kw.toLowerCase()));

    // 풀캠 키워드가 명시적이면 풀캠 우선
    if (isFullcam) return "fullcam";
    // 재생목록 ID가 있고 타임라인이 없으면 재생목록
    if (video.playlistId && !TIMESTAMP_RE.test(video.description)) return "playlist";
    // 재생목록 키워드
    if (isPlaylist) return "playlist";

    return "fullcam";
}

// ─────────────────────────────────────────────
// 공연 영상 후보 필터링
// ─────────────────────────────────────────────

const CONCERT_KEYWORDS = [
    "공연",
    "콘서트",
    "라이브",
    "투어",
    "셋리스트",
    "세트리스트",
    "concert",
    "live",
    "tour",
    "setlist",
    "full",
    "fullcam",
    "앵콜",
    "encore",
    "재생목록",
    "playlist",
];

function filterConcertVideos(videos: RawVideoMeta[]): RawVideoMeta[] {
    return videos.filter((v) => {
        const text = `${v.title} ${v.description}`.toLowerCase();
        return CONCERT_KEYWORDS.some((kw) => text.includes(kw.toLowerCase())) || TIMESTAMP_RE.test(v.description);
    });
}

// ─────────────────────────────────────────────
// 공연 레이블 추출
// ─────────────────────────────────────────────

function extractConcertLabel(title: string, artistName: string): { label: string; year: string } {
    const cleaned = title
        .replace(new RegExp(artistName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "")
        .replace(/\[.*?\]/g, "")
        .replace(/【.*?】/g, "")
        .replace(/\(.*?\)/g, "")
        .replace(/[-|\/\\]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const yearMatch = cleaned.match(/\b(20\d{2})\b/);
    const year = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();
    const label = cleaned.slice(0, 40) || `${year} Concert`;

    return { label, year };
}

// ─────────────────────────────────────────────
// ① 풀캠 파싱 — 설명글 타임라인
// ─────────────────────────────────────────────

/**
 * 풀캠 영상의 description에서 "타임스탬프 곡명" 패턴을 파싱합니다.
 *
 * 지원 형식:
 *   00:00 곡명 / 00:00 - 곡명 / 00:00 | 곡명
 *   1:23:45 곡명 / 1. 00:00 곡명 / 곡명 00:00
 */
function parseFullcamTimestamps(video: RawVideoMeta): SetlistSong[] {
    const songs: SetlistSong[] = [];
    const text = video.description || video.title;
    const tsRe = /\b(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\b/;
    let order = 1;

    for (const rawLine of text.split("\n")) {
        const line = rawLine.trim();
        const tsMatch = line.match(tsRe);
        if (!tsMatch) continue;

        const hh = tsMatch[1] ? parseInt(tsMatch[1], 10) : 0;
        const mm = parseInt(tsMatch[2], 10);
        const ss = parseInt(tsMatch[3], 10);
        const seconds = hh * 3600 + mm * 60 + ss;

        const songTitle = line
            .replace(tsMatch[0], "")
            .replace(/^\s*\d+[.)]\s*/, "")
            .replace(/^[\s\-|:·•◆▶►]+/, "")
            .replace(/[\s\-|:·•◆▶►]+$/, "")
            .trim();

        if (songTitle.length < 1 || /^https?:\/\//.test(songTitle)) continue;

        songs.push({
            order,
            songTitle,
            songType: determineSongType(songTitle),
            timestampSeconds: seconds,
            youtubeUrl: `https://www.youtube.com/watch?v=${video.videoId}&t=${seconds}s`,
        });
        order++;
    }
    return songs;
}

// ─────────────────────────────────────────────
// ② 재생목록 파싱 — 영상 제목에서 곡명 추출
// ─────────────────────────────────────────────

/**
 * 재생목록 각 영상의 제목에서 곡명을 추출합니다.
 *
 * 처리하는 노이즈 패턴:
 *   "[아티스트] 콘서트명 - 곡명 (직캠/4K/fancam)"
 *   "아티스트 - 곡명 | 공연명 live"
 *   "01 곡명 아티스트 콘서트"
 *   "곡명 (커버)"
 */
function extractSongTitleFromVideoTitle(rawTitle: string, artistName: string, concertLabel: string): string {
    const title = rawTitle
        // 대괄호/괄호 내용 제거 (단, 곡명 자체가 괄호 포함일 수 있으므로 마지막에)
        .replace(/\[.*?\]/g, "")
        .replace(/【.*?】/g, "")
        // 아티스트명 제거
        .replace(new RegExp(artistName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "")
        // 공연명 제거
        .replace(new RegExp(concertLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "")
        // 흔한 공연 부가 설명 제거
        .replace(/\b(직캠|fancam|fullcam|풀캠|4[kK]|HD|직접촬영|live|공연|콘서트|concert|encore|앵콜)\b/gi, "")
        // 앞 트랙 번호 제거 (예: "01.", "1 -")
        .replace(/^\s*\d{1,2}[\s.\-–—]+/, "")
        // 구분자 정리
        .replace(/[\-–—|]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        // 괄호 안 내용 (마지막에 — 커버, unreleased 등은 남기기 위해 후처리)
        .replace(/\(\s*\)/g, "")
        .trim();

    // 너무 짧으면 원본 제목 사용
    return title.length >= 1 ? title : rawTitle.trim();
}

function parsePlaylistSongs(
    playlistVideos: Array<RawVideoMeta & { playlistIndex: number }>,
    _playlistId: string,
    artistName: string,
    concertLabel: string,
): SetlistSong[] {
    return playlistVideos
        .filter((v) => v.videoId && v.title)
        .sort((a, b) => a.playlistIndex - b.playlistIndex)
        .map((v) => {
            const songTitle = extractSongTitleFromVideoTitle(v.title, artistName, concertLabel);
            return {
                order: v.playlistIndex,
                songTitle,
                songType: determineSongType(songTitle),
                timestampSeconds: 0, // 개별 영상이므로 타임스탬프 없음
                youtubeUrl: `https://www.youtube.com/watch?v=${v.videoId}`,
            } satisfies SetlistSong;
        });
}

// ─────────────────────────────────────────────
// 공통 유틸
// ─────────────────────────────────────────────

function determineSongType(title: string): SongType {
    const t = title.toLowerCase();
    if (t.includes("cover") || t.includes("커버")) return "cover";
    if (t.includes("미발매") || t.includes("unreleased") || t.includes("신곡")) return "unreleased";
    return "released";
}

function formatSeconds(s: number): string {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
        ? `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`
        : `${m}:${sec.toString().padStart(2, "0")}`;
}

// ─────────────────────────────────────────────
// Firestore 저장
// ─────────────────────────────────────────────

async function uploadToFirestore(db: Firestore, artistId: string, setlist: ConcertSetlist): Promise<void> {
    const docId = setlist.concertLabel.replace(/[^a-zA-Z0-9가-힣_\-]/g, "_");
    const ref = doc(collection(db, "artists", artistId, "setlistRecipes"), docId);
    await setDoc(ref, setlist);
    console.log(`  [Firestore] 저장 완료 → artists/${artistId}/setlistRecipes/${docId}`);
}

// ─────────────────────────────────────────────
// 메인 수집 클래스
// ─────────────────────────────────────────────

export class SetlistCollector {
    private db: Firestore | null;

    constructor() {
        this.db = initFirebase();
    }

    /**
     * 아티스트 이름으로 과거 공연 목록과 각 셋리스트를 수집합니다.
     *
     * @param artistId   Firestore 문서 ID (예: 'nerd-connection')
     * @param artistName 검색에 사용할 아티스트명 (예: '너드커넥션')
     * @param maxVideos  수집할 최대 후보 영상 수 (기본 10)
     */
    async collect(artistId: string, artistName: string, maxVideos = 10): Promise<ConcertSetlist[]> {
        checkYtDlp();

        console.log(`\n${"=".repeat(60)}`);
        console.log(`[수집 시작] 아티스트: ${artistName} (ID: ${artistId})`);
        console.log(`${"=".repeat(60)}`);

        // ── Step 1: 복수 쿼리 검색 ───────────────────────────────────
        // 풀캠과 재생목록 두 패턴을 모두 커버하기 위해
        // '풀영상/풀캠' 쿼리와 '재생목록/모아보기' 쿼리를 동시에 사용합니다.
        const queries = [
            `${artistName} 콘서트 풀영상 세트리스트`,
            `${artistName} concert full setlist`,
            `${artistName} 공연 직캠 재생목록`,
            `${artistName} live playlist`,
        ];

        const allVideos: RawVideoMeta[] = [];
        const seenIds = new Set<string>();

        for (const q of queries) {
            for (const v of searchYouTube(q, 5)) {
                if (v.videoId && !seenIds.has(v.videoId)) {
                    seenIds.add(v.videoId);
                    allVideos.push(v);
                }
            }
        }

        console.log(`\n[검색 결과] 총 ${allVideos.length}개 후보 발견`);

        // ── Step 2: 공연 후보 필터링 ─────────────────────────────────
        const concertCandidates = filterConcertVideos(allVideos).slice(0, maxVideos);
        console.log(`[필터링 후] ${concertCandidates.length}개 선별`);

        if (concertCandidates.length === 0) {
            console.warn("[경고] 공연 영상을 찾지 못했습니다.");
            return [];
        }

        // ── Step 3: 각 후보를 소스 타입별로 처리 ────────────────────
        const results: ConcertSetlist[] = [];

        for (let i = 0; i < concertCandidates.length; i++) {
            let candidate = concertCandidates[i];
            console.log(`\n[${i + 1}/${concertCandidates.length}] "${candidate.title}"`);

            const sourceType = detectSourceType(candidate);
            console.log(`  → 소스 타입: ${sourceType}`);

            const { label, year } = extractConcertLabel(candidate.title, artistName);
            let songs: SetlistSong[] = [];
            let setlist: ConcertSetlist;

            // ─ ① 풀캠 경로 ─────────────────────────────────────────────
            if (sourceType === "fullcam") {
                // description이 없으면 상세 재조회
                if (!candidate.description || !TIMESTAMP_RE.test(candidate.description)) {
                    console.log("  → description 없음, 상세 재조회 중...");
                    const detail = fetchVideoDetail(candidate.videoId);
                    if (detail) candidate = detail;
                }

                songs = parseFullcamTimestamps(candidate);

                if (songs.length === 0) {
                    console.log("  → 타임라인 없음, 건너뜀");
                    continue;
                }

                console.log(`  → 풀캠 파싱 완료: ${songs.length}곡`);
                songs.forEach((s) =>
                    console.log(
                        `     ${s.order.toString().padStart(2)}. [${formatSeconds(s.timestampSeconds)}] ${s.songTitle}`,
                    ),
                );

                setlist = {
                    concertLabel: label,
                    concertYear: year,
                    sourceType: "fullcam",
                    youtubeFullcamVideoId: candidate.videoId,
                    youtubeFullcamUrl: `https://www.youtube.com/watch?v=${candidate.videoId}`,
                    youtubePlaylistId: candidate.playlistId || null,
                    youtubePlaylistUrl: candidate.playlistId
                        ? `https://www.youtube.com/playlist?list=${candidate.playlistId}`
                        : null,
                    updatedAt: new Date().toISOString(),
                    songs,
                };

                // ─ ② 재생목록 경로 ──────────────────────────────────────────
            } else {
                // 재생목록 ID 확보: candidate에 있으면 사용, 없으면 영상 URL에서 파싱 시도
                const playlistId =
                    candidate.playlistId ||
                    candidate.videoId.match(/^PL/)?.input || // videoId가 재생목록 ID인 경우
                    null;

                if (!playlistId) {
                    console.log("  → 재생목록 ID를 확보하지 못함, 건너뜀");
                    continue;
                }

                const playlistVideos = fetchPlaylistVideos(playlistId);

                if (playlistVideos.length === 0) {
                    console.log("  → 재생목록이 비어있거나 접근 불가, 건너뜀");
                    continue;
                }

                songs = parsePlaylistSongs(playlistVideos, playlistId, artistName, label);

                console.log(`  → 재생목록 파싱 완료: ${songs.length}곡`);
                songs.forEach((s) =>
                    console.log(
                        `     ${s.order.toString().padStart(2)}. ${s.songTitle}  (${s.youtubeUrl.split("v=")[1]})`,
                    ),
                );

                setlist = {
                    concertLabel: label,
                    concertYear: year,
                    sourceType: "playlist",
                    youtubeFullcamVideoId: null,
                    youtubeFullcamUrl: null,
                    youtubePlaylistId: playlistId,
                    youtubePlaylistUrl: `https://www.youtube.com/playlist?list=${playlistId}`,
                    updatedAt: new Date().toISOString(),
                    songs,
                };
            }

            results.push(setlist);

            // Firestore 저장
            if (this.db) {
                try {
                    await uploadToFirestore(this.db, artistId, setlist);
                } catch (e: any) {
                    console.error("  [Firestore 오류]", e.message);
                }
            }
        }

        // ── Step 4: 결과 출력 ────────────────────────────────────────
        console.log(`\n${"=".repeat(60)}`);
        console.log(`[수집 완료] ${results.length}개 공연의 셋리스트 수집`);
        console.log(
            results.map((r) => `  - [${r.sourceType.padEnd(8)}] ${r.concertLabel} (${r.songs.length}곡)`).join("\n"),
        );

        if (!this.db) {
            console.log("\n[로컬 출력 — Firestore 미연동]\n");
            console.log(JSON.stringify(results, null, 2));
        }

        return results;
    }
}

// ─────────────────────────────────────────────
// CLI 진입점
// ─────────────────────────────────────────────
// 실행: npx ts-node setlistCollector.ts --artist "너드커넥션" --id "nerd-connection"
// 옵션: --limit 15  (최대 후보 영상 수, 기본 10)

async function main() {
    const args = process.argv.slice(2);
    const getArg = (flag: string) => {
        const idx = args.indexOf(flag);
        return idx !== -1 ? args[idx + 1] : undefined;
    };

    const artistName = getArg("--artist");
    const artistId = getArg("--id");
    const limit = parseInt(getArg("--limit") || "10", 10);

    if (!artistName || !artistId) {
        console.error(
            '사용법: npx ts-node setlistCollector.ts --artist "아티스트명" --id "artist-id" [--limit 10]\n' +
                '예시:   npx ts-node setlistCollector.ts --artist "너드커넥션" --id "nerd-connection"\n' +
                '        npx ts-node setlistCollector.ts --artist "잔나비" --id "jannabi" --limit 15',
        );
        process.exit(1);
    }

    const collector = new SetlistCollector();
    await collector.collect(artistId, artistName, limit);
}

if (require.main === module) {
    main().catch((err) => {
        console.error("[치명적 오류]", err);
        process.exit(1);
    });
}
