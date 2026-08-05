import type { Festival, Artist, ArtistPlaylist } from '../types'
import { artists as allArtists, festivals as allFestivals, playlistReadyIds } from '../data/staticData'

// 초기 필수 데이터는 번들에서 즉시 제공(동기). 아티스트별 대표곡만 지연 로딩.
const festivalById = new Map(allFestivals.map((f) => [f.id, f]))
const artistById = new Map(allArtists.map((a) => [a.id, a]))
const cachedPlaylists: Record<string, ArtistPlaylist | null> = {}

export const FestivalService = {
  /** 번들 데이터에서 즉시 반환(스피너 없이 동기 렌더용) */
  getFestivalsSync(): Festival[] {
    return allFestivals
  },

  async getFestivals(): Promise<Festival[]> {
    return allFestivals
  },

  getFestivalByIdSync(id: string): Festival | undefined {
    return festivalById.get(id)
  },

  async getFestivalById(id: string): Promise<Festival | undefined> {
    return festivalById.get(id)
  },

  getArtistsSync(): Artist[] {
    return allArtists
  },

  async getArtists(): Promise<Artist[]> {
    return allArtists
  },

  async getArtistById(id: string): Promise<Artist | undefined> {
    return artistById.get(id)
  },

  async getArtistsByIds(ids: string[]): Promise<Artist[]> {
    return ids
      .map((id) => artistById.get(id))
      .filter((a): a is Artist => !!a)
  },

  getPlaylistIndexSync(): ReadonlySet<string> {
    return playlistReadyIds
  },

  async getPlaylistIndex(): Promise<ReadonlySet<string>> {
    return playlistReadyIds
  },

  async hasPlaylist(artistId: string): Promise<boolean> {
    return playlistReadyIds.has(artistId)
  },

  /** 대표곡 플레이리스트(~700KB 전체)는 선택 시점에만 fetch — 지연 로딩 유지 */
  async getPlaylistForArtist(artistId: string): Promise<ArtistPlaylist | undefined> {
    if (artistId in cachedPlaylists) {
      return cachedPlaylists[artistId] || undefined
    }
    try {
      const response = await fetch(`/data/playlists/${artistId}.json`)
      if (!response.ok) {
        cachedPlaylists[artistId] = null
        return undefined
      }
      const data: ArtistPlaylist = await response.json()
      cachedPlaylists[artistId] = data
      return data
    } catch (error) {
      console.error(`Error fetching playlist ${artistId}:`, error)
      cachedPlaylists[artistId] = null
      return undefined
    }
  },

  /** 백그라운드 프리페치 — 모듈 캐시를 채워 선택 시 즉시 표시 */
  prefetchPlaylists(artistIds: string[]): void {
    for (const artistId of artistIds) {
      void this.getPlaylistForArtist(artistId)
    }
  },
}
