/** YouTube 임시 재생목록(watch_videos) URL + 제목 헬퍼 */

/**
 * YouTube `watch_videos` 딥링크 하드 캡 (서버 제한, URL 길이 이슈 아님).
 * @see https://github.com/TeamNewPipe/NewPipe/issues/11930
 *
 * TODO(day-playlist): 장기적으로는 대표 YouTube 계정 + Data API 고정 PL.
 * 단기 번들: `bundlePlaylist.ts` 에서 티어 곡 수 5/4/3 → 4/3/2 → 3/2/1 다운그레이드.
 *
 * ---
 * TODO(investigate-embed-playlist): Reddit 우회법 — 나중에 수동 검증해볼 가치 있음
 *
 * 출처 게시글: r/youtube 「Anonymous playlist - not working anymore?」
 *   https://www.reddit.com/r/youtube/comments/1df032v/anonymous_playlist_not_working_anymore/
 * 대상 댓글 (id=l8se183, u/DifficultyOnly3869, 2024-06):
 *   https://www.reddit.com/r/youtube/comments/1df032v/comment/l8se183/
 *
 * 게시글 요지:
 *   - 계정 없이 만드는 익명 PL = `watch_videos?video_ids=...` (또는 Playlist Helper 확장)
 *   - 당시(2024-06) 일부 환경에서 PL이 안 만들어지고 첫 영상만 재생됨
 *
 * 댓글 제안 절차:
 *   1) `https://www.youtube.com/embed/?playlist=VID1,VID2,...,VIDn` 로 연다
 *      (경로에 첫 videoId 를 넣는 `embed/FIRST?playlist=REST` 형태가 더 안정적이라는
 *       StackOverflow 보고도 있음 — 둘 다 테스트)
 *   2) 열린 플레이어 우측 상단 Playlist UI에서 우클릭 → 「Copy video URL」
 *   3) 복사된 URL이 `watch?v=...&list=...` 형태의 “정식” 플레이리스트 링크로 바뀐다고 함
 *      (연속재생·목록 UI 등 일반 PL 기능 포함)
 *
 * 우리가 나중에 확인할 것:
 *   - [ ] 2026 기준으로 embed/?playlist= → Copy video URL 흐름이 아직 동작하는지
 *   - [ ] 생성되는 `list=` ID 수명(임시 TLGG 류인지, 오래 유지되는지)
 *   - [ ] `watch_videos` 50곡 캡을 우회하는지, 아니면 embed 쪽도 동일/유사 한도인지
 *   - [ ] title 파라미터·모바일·YouTube Music 앱에서 어떻게 열리는지
 *   - [ ] 자동화(유저 클릭 없이 list URL 확보) 가능 여부 — UI 우클릭이 필수면 제품화는 어려움
 *
 * 현행: 구현하지 않음. 참고용 메모만.
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

/** 아티스트 대표곡 재생목록: "{페스티벌명} {아티스트명} 대표곡" */
export function playlistTitleForArtist(festivalName: string, artistName: string): string {
  const fest = (festivalName || '').trim()
  const artist = (artistName || '').trim()
  if (fest && artist) return `${fest} ${artist} 대표곡`
  if (artist) return `${artist} 대표곡`
  if (fest) return `${fest} 아티스트 대표곡`
  return '아티스트 대표곡'
}

/** 요일(일별) 재생목록 */
export function playlistTitleForDay(festivalName: string, dayLabel: string): string {
  const fest = (festivalName || '').trim()
  const day = (dayLabel || '').trim()
  if (fest && day) return `${fest} · ${day} 대표곡`
  if (day) return `${day} 대표곡`
  return playlistTitleForFestival(fest)
}

/** 페스티벌 전체 재생목록 */
export function playlistTitleForFestival(festivalName: string): string {
  const fest = (festivalName || '').trim()
  return fest ? `${fest} 전체 대표곡` : '페스티벌 전체 대표곡'
}

/** 그 외 커스텀/조합 재생목록 */
export function playlistTitleForCustom(festivalName: string): string {
  const fest = (festivalName || '').trim()
  return fest ? `${fest} 내 라인업 대표곡` : '내 라인업 대표곡'
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
