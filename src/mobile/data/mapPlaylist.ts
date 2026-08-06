import type { MobilePlaylistView, RecognitionTier } from '../view/types'

function tierFromRaw(v: unknown): RecognitionTier {
  if (v === 'high' || v === 'mid' || v === 'low') return v
  return 'low'
}

export function mapPlaylistView(raw: Record<string, unknown>): MobilePlaylistView | null {
  const artistId = typeof raw.artistId === 'string' ? raw.artistId : ''
  if (!artistId) return null

  const tracks: MobilePlaylistView['tracks'] = []
  if (Array.isArray(raw.tracks)) {
    for (const item of raw.tracks) {
      if (!item || typeof item !== 'object') continue
      const t = item as Record<string, unknown>
      const videoId = typeof t.videoId === 'string' ? t.videoId.trim() : ''
      if (!videoId) continue
      const title =
        typeof t.songTitle === 'string' && t.songTitle.trim()
          ? t.songTitle
          : typeof t.title === 'string'
            ? t.title
            : videoId
      tracks.push({ videoId, title })
    }
  }

  const recognition =
    raw.recognition && typeof raw.recognition === 'object'
      ? (raw.recognition as Record<string, unknown>)
      : null

  const targetSongCount =
    typeof raw.targetSongCount === 'number' && raw.targetSongCount > 0
      ? raw.targetSongCount
      : typeof recognition?.songCount === 'number'
        ? recognition.songCount
        : tracks.length

  return {
    artistId,
    tracks,
    targetSongCount,
    tier: tierFromRaw(recognition?.tier),
    listenUrl:
      typeof raw.youtubePlaylistUrl === 'string' && raw.youtubePlaylistUrl.trim()
        ? raw.youtubePlaylistUrl.trim()
        : null,
  }
}
