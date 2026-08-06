/**
 * 대표곡 플레이리스트 스토어 — 지연 로딩 대신 "프리로드 + 캐싱".
 *
 * 전체 플레이리스트는 별도 청크(`playlistsBundle.ts`)로 분리되어 있고,
 * 앱 시작 직후 유휴 시점에 `preloadPlaylists()`로 한 번 받아 메모리에 캐싱한다.
 * 이후 아티스트 선택·듣기 등 상호작용은 네트워크 왕복 없이 즉시 응답한다
 * (캐시 미준비 시에도 이미 로딩 중인 단일 Promise를 공유해 중복 요청이 없다).
 *
 * 콜라보(`artists.json` `composedOf`): 전용 `playlists/{id}.json`이 있으면 그걸 쓰고,
 * 없으면 멤버 PL을 라운드로빈 병합한다. → docs/ARTIST_DISPLAY_NAMES.md
 */
import { artists } from './staticData'

type RawRecord = Record<string, unknown>

let cache: Record<string, RawRecord> | null = null
let loadPromise: Promise<Record<string, RawRecord>> | null = null

const composedOfById: ReadonlyMap<string, readonly string[]> = (() => {
  const m = new Map<string, readonly string[]>()
  for (const a of artists) {
    if (Array.isArray(a.composedOf) && a.composedOf.length > 0) {
      m.set(a.id, a.composedOf)
    }
  }
  return m
})()

function loadAll(): Promise<Record<string, RawRecord>> {
  if (cache) return Promise.resolve(cache)
  if (!loadPromise) {
    loadPromise = import('./playlistsBundle')
      .then((mod) => {
        cache = mod.playlistsById
        return cache
      })
      .catch((error) => {
        loadPromise = null // 실패 시 다음 접근에서 재시도 허용
        throw error
      })
  }
  return loadPromise
}

/** 멤버 플레이리스트 tracks를 라운드로빈으로 합친다 (videoId 중복 제거). */
function mergeMemberPlaylists(
  collabId: string,
  memberIds: readonly string[],
  all: Record<string, RawRecord>,
): RawRecord | null {
  const memberDocs = memberIds
    .map((id) => all[id])
    .filter((d): d is RawRecord => Boolean(d))
  if (memberDocs.length === 0) return null

  const queues = memberDocs.map((doc) => {
    const tracks = Array.isArray(doc.tracks) ? [...doc.tracks] : []
    return tracks.filter(
      (t): t is RawRecord =>
        Boolean(t) && typeof t === 'object' && typeof (t as RawRecord).videoId === 'string',
    )
  })
  const merged: RawRecord[] = []
  const seen = new Set<string>()
  let round = 0
  const maxRounds = Math.max(...queues.map((q) => q.length), 0)
  while (round < maxRounds && merged.length < 20) {
    for (const q of queues) {
      const t = q[round]
      if (!t) continue
      const vid = String(t.videoId)
      if (seen.has(vid)) continue
      seen.add(vid)
      merged.push(t)
      if (merged.length >= 20) break
    }
    round++
  }
  if (merged.length === 0) return null

  const collabMeta = artists.find((a) => a.id === collabId)
  const name = collabMeta?.name
    ?? (typeof memberDocs[0]?.artistName === 'string' ? memberDocs[0].artistName : collabId)
  return {
    artistId: collabId,
    artistName: name,
    source: 'youtube_music',
    selection: 'composedOf_merge_runtime',
    songCount: merged.length,
    targetSongCount: 3,
    recognition: { tier: 'low', songCount: 3, reason: 'composedOf_merge' },
    composedOf: [...memberIds],
    tracks: merged,
  }
}

/** 앱 시작 시 백그라운드 프리로드(전체 청크 1회 수신 → 캐싱) */
export function preloadPlaylists(): void {
  void loadAll().catch(() => {})
}

/** 캐시가 있으면 즉시, 없으면 공유 Promise로 로딩 후 반환 */
export async function getPlaylistRaw(artistId: string): Promise<RawRecord | null> {
  try {
    const all = cache ?? (await loadAll())
    const own = all[artistId]
    if (own) return own

    const members = composedOfById.get(artistId)
    if (members?.length) return mergeMemberPlaylists(artistId, members, all)
    return null
  } catch {
    return null
  }
}

/**
 * 전용 PL이 있거나, composedOf 멤버 중 하나라도 PL이 있으면 준비됨.
 * (예: 블랙홀 X 방수미 — 방수미 단독 채널이 없어도 블랙홀 PL로 듣기 가능)
 */
export function isPlaylistReady(
  artistId: string,
  readyIds: ReadonlySet<string> = new Set(),
): boolean {
  if (readyIds.has(artistId)) return true
  const members = composedOfById.get(artistId)
  if (!members?.length) return false
  return members.some((id) => readyIds.has(id))
}
