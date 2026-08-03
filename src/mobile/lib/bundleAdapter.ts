import type { BundleArtistInput } from '../../lib/bundlePlaylist'
import { uniqueVideoIds } from '../../lib/youtubePlaylist'
import type { MobilePlaylistView } from '../view/types'

/** MobilePlaylistView → 번들러 입력 (ArtistPlaylist 타입 미사용) */
export function artistInputsFromMobilePlaylists(
  playlists: Array<MobilePlaylistView | null>,
): BundleArtistInput[] {
  const out: BundleArtistInput[] = []
  for (const pl of playlists) {
    if (!pl?.artistId) continue
    const bundleLimit =
      pl.targetSongCount > 0 ? pl.targetSongCount : pl.tracks.length
    const videoIds = uniqueVideoIds(
      pl.tracks.slice(0, bundleLimit).map((t) => t.videoId),
    )
    if (videoIds.length === 0) continue
    out.push({
      artistId: pl.artistId,
      tier: pl.tier,
      videoIds,
    })
  }
  return out
}
