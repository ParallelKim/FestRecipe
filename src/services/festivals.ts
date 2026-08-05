import type { Festival, Artist, ArtistPlaylist } from '../types'
import { artists as allArtists, festivals as allFestivals, playlistReadyIds } from '../data/staticData'
import { getPlaylistRaw, preloadPlaylists } from '../data/playlistData'

// 초기 필수 데이터는 번들에서 즉시 제공(동기). 대표곡은 프리로드+캐싱 스토어 경유.
const festivalById = new Map(allFestivals.map((f) => [f.id, f]))
const artistById = new Map(allArtists.map((a) => [a.id, a]))

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

  /** 대표곡은 프리로드된 번들 캐시에서 반환(선택 시 즉시, 미준비 시 공유 Promise 대기) */
  async getPlaylistForArtist(artistId: string): Promise<ArtistPlaylist | undefined> {
    const raw = await getPlaylistRaw(artistId)
    return (raw as ArtistPlaylist | null) ?? undefined
  },

  /** 전체 플레이리스트 번들을 백그라운드로 프리로드해 캐시를 채운다 */
  prefetchPlaylists(): void {
    preloadPlaylists()
  },
}
