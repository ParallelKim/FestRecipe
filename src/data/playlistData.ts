/**
 * 대표곡 플레이리스트 스토어 — 지연 로딩 대신 "프리로드 + 캐싱".
 *
 * 전체 플레이리스트는 별도 청크(`playlistsBundle.ts`)로 분리되어 있고,
 * 앱 시작 직후 유휴 시점에 `preloadPlaylists()`로 한 번 받아 메모리에 캐싱한다.
 * 이후 아티스트 선택·듣기 등 상호작용은 네트워크 왕복 없이 즉시 응답한다
 * (캐시 미준비 시에도 이미 로딩 중인 단일 Promise를 공유해 중복 요청이 없다).
 */
type RawRecord = Record<string, unknown>

let cache: Record<string, RawRecord> | null = null
let loadPromise: Promise<Record<string, RawRecord>> | null = null

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

/** 앱 시작 시 백그라운드 프리로드(전체 청크 1회 수신 → 캐싱) */
export function preloadPlaylists(): void {
  void loadAll().catch(() => {})
}

/** 캐시가 있으면 즉시, 없으면 공유 Promise로 로딩 후 반환 */
export async function getPlaylistRaw(artistId: string): Promise<RawRecord | null> {
  if (cache) return cache[artistId] ?? null
  try {
    const all = await loadAll()
    return all[artistId] ?? null
  } catch {
    return null
  }
}
