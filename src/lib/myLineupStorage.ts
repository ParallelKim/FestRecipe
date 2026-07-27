/**
 * 내 라인업(커스텀 플레이리스트) — 브라우저 localStorage.
 * 향후 FB 로그인·DB 동기화 시 festivalId + artistIds[] 스키마 유지.
 */

export const MY_LINEUP_STORE_KEY = 'festrecipe.myLineup.v1'

export interface MyLineupEntry {
  artistIds: string[]
  updatedAt: string
}

export interface MyLineupStoreV1 {
  version: 1
  byFestival: Record<string, MyLineupEntry>
}

function emptyStore(): MyLineupStoreV1 {
  return { version: 1, byFestival: {} }
}

function readStore(): MyLineupStoreV1 {
  if (typeof localStorage === 'undefined') return emptyStore()
  try {
    const raw = localStorage.getItem(MY_LINEUP_STORE_KEY)
    if (!raw) return emptyStore()
    const parsed = JSON.parse(raw) as MyLineupStoreV1
    if (parsed?.version !== 1 || !parsed.byFestival) return emptyStore()
    return parsed
  } catch {
    return emptyStore()
  }
}

function writeStore(store: MyLineupStoreV1): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(MY_LINEUP_STORE_KEY, JSON.stringify(store))
}

export function loadMyLineupArtistIds(festivalId: string): string[] {
  const entry = readStore().byFestival[festivalId]
  return entry?.artistIds ? [...entry.artistIds] : []
}

export function saveMyLineupArtistIds(festivalId: string, artistIds: string[]): void {
  const store = readStore()
  if (artistIds.length === 0) {
    delete store.byFestival[festivalId]
  } else {
    store.byFestival[festivalId] = {
      artistIds: [...artistIds],
      updatedAt: new Date().toISOString(),
    }
  }
  writeStore(store)
}

export function toggleMyLineupArtist(festivalId: string, artistId: string): string[] {
  const current = loadMyLineupArtistIds(festivalId)
  const next = current.includes(artistId)
    ? current.filter((id) => id !== artistId)
    : [...current, artistId]
  saveMyLineupArtistIds(festivalId, next)
  return next
}

export function clearMyLineup(festivalId: string): void {
  saveMyLineupArtistIds(festivalId, [])
}
