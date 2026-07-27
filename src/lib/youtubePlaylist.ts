/** YouTube 임시 재생목록(watch_videos) URL + 제목 헬퍼 */

const WATCH_VIDEOS_MAX = 50

export type PlaylistTitleKind = 'artist' | 'day' | 'festival' | 'custom'

/** watch_videos 딥링크. title 이 있으면 Untitled List 대신 해당 제목으로 열림. */
export function buildWatchVideosUrl(
  videoIds: string[],
  title?: string | null,
): string | null {
  const ids = uniqueVideoIds(videoIds).slice(0, WATCH_VIDEOS_MAX)
  if (ids.length === 0) return null

  const params = new URLSearchParams()
  params.set('video_ids', ids.join(','))
  const trimmed = (title || '').trim()
  if (trimmed) params.set('title', trimmed)
  return `https://www.youtube.com/watch_videos?${params.toString()}`
}

export function uniqueVideoIds(videoIds: Array<string | null | undefined>): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of videoIds) {
    const id = (raw || '').trim()
    if (!id || seen.has(id)) continue
    seen.add(id)
    out.push(id)
  }
  return out
}

/** 아티스트 대표곡 재생목록 */
export function playlistTitleForArtist(artistName: string): string {
  return (artistName || '').trim() || '아티스트 플레이리스트'
}

/** 요일(일별) 재생목록 */
export function playlistTitleForDay(festivalName: string, dayLabel: string): string {
  const fest = (festivalName || '').trim()
  const day = (dayLabel || '').trim()
  if (fest && day) return `${fest} · ${day}`
  if (day) return day
  return playlistTitleForFestival(fest)
}

/** 페스티벌 전체 재생목록 */
export function playlistTitleForFestival(festivalName: string): string {
  const fest = (festivalName || '').trim()
  return fest ? `${fest} 전체 플레이리스트` : '페스티벌 전체 플레이리스트'
}

/** 그 외 커스텀/조합 재생목록 */
export function playlistTitleForCustom(festivalName: string): string {
  const fest = (festivalName || '').trim()
  return fest ? `나만의 ${fest} 플레이리스트` : '나만의 페스티벌 플레이리스트'
}

export function playlistTitle(
  kind: PlaylistTitleKind,
  opts: { artistName?: string; festivalName?: string; dayLabel?: string },
): string {
  switch (kind) {
    case 'artist':
      return playlistTitleForArtist(opts.artistName || '')
    case 'day':
      return playlistTitleForDay(opts.festivalName || '', opts.dayLabel || '')
    case 'festival':
      return playlistTitleForFestival(opts.festivalName || '')
    case 'custom':
    default:
      return playlistTitleForCustom(opts.festivalName || '')
  }
}
