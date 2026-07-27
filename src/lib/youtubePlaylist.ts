/** YouTube 임시 재생목록(watch_videos) URL + 제목 헬퍼 */

/**
 * YouTube `watch_videos` 딥링크 하드 캡 (서버 제한, URL 길이 이슈 아님).
 * @see https://github.com/TeamNewPipe/NewPipe/issues/11930
 *
 * TODO(day-playlist): 요일/페스티벌 묶음이 50곡을 넘기므로, 현행 딥링크(앞 50곡만)
 * 대신 대표(운영) YouTube 계정 + Data API로 고정 플레이리스트를 발행하는 방안을 검토.
 * 나만의 플레이리스트는 유저 OAuth 또는 분할 딥링크 + 경고로 다루는 편이 맞음.
 */
export const WATCH_VIDEOS_MAX = 50

export type PlaylistTitleKind = 'artist' | 'day' | 'festival' | 'custom'

/** watch_videos 딥링크. title 이 있으면 Untitled List 대신 해당 제목으로 열림. */
export function buildWatchVideosUrl(
  videoIds: string[],
  title?: string | null,
): string | null {
  const unique = uniqueVideoIds(videoIds)
  const ids = unique.slice(0, WATCH_VIDEOS_MAX)
  if (ids.length === 0) return null

  const params = new URLSearchParams()
  params.set('video_ids', ids.join(','))
  const trimmed = (title || '').trim()
  if (trimmed) params.set('title', trimmed)
  return `https://www.youtube.com/watch_videos?${params.toString()}`
}

/** 딥링크로 열 때 잘리는 곡이 있으면 true (UI 경고용) */
export function watchVideosWouldTruncate(videoIds: string[]): boolean {
  return uniqueVideoIds(videoIds).length > WATCH_VIDEOS_MAX
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

/** 아티스트 대표곡 재생목록: "{페스티벌명} {아티스트명} 플레이리스트" */
export function playlistTitleForArtist(festivalName: string, artistName: string): string {
  const fest = (festivalName || '').trim()
  const artist = (artistName || '').trim()
  if (fest && artist) return `${fest} ${artist} 플레이리스트`
  if (artist) return `${artist} 플레이리스트`
  if (fest) return `${fest} 아티스트 플레이리스트`
  return '아티스트 플레이리스트'
}

/** 요일(일별) 재생목록 */
export function playlistTitleForDay(festivalName: string, dayLabel: string): string {
  const fest = (festivalName || '').trim()
  const day = (dayLabel || '').trim()
  if (fest && day) return `${fest} · ${day} 플레이리스트`
  if (day) return `${day} 플레이리스트`
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
      return playlistTitleForArtist(opts.festivalName || '', opts.artistName || '')
    case 'day':
      return playlistTitleForDay(opts.festivalName || '', opts.dayLabel || '')
    case 'festival':
      return playlistTitleForFestival(opts.festivalName || '')
    case 'custom':
    default:
      return playlistTitleForCustom(opts.festivalName || '')
  }
}
