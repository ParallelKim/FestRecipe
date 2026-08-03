import { useState } from 'react'
import { FestivalService } from '../services/festivals'
import type { Festival, DayLineup } from '../types'
import {
  artistInputsFromPlaylists,
  buildBundledAnonymousPlaylist,
  type BundledAnonymousPlaylist,
} from '../lib/bundlePlaylist'
import {
  orderArtistIdsForDayBundle,
  orderArtistIdsForFestivalBundle,
} from '../lib/playlistBundleOrder'
import { buildWatchVideosUrl, playlistTitleForCustom } from '../lib/youtubePlaylist'
import { filterMyLineupForDay } from '../lib/lineupDay'

interface UseFestivalPlaylistActionsOptions {
  festival: Festival
  activeDay?: DayLineup
  playlistReady: Set<string>
  myLineupArtistIds: string[]
  /** 묶음 재생 후 알림이 있을 때 (모바일 플랜 탭 등) */
  onPlanFocus?: () => void
}

export function useFestivalPlaylistActions({
  festival,
  activeDay,
  playlistReady,
  myLineupArtistIds,
  onPlanFocus,
}: UseFestivalPlaylistActionsOptions) {
  const [bundleLoading, setBundleLoading] = useState<'day' | 'festival' | 'custom' | null>(null)
  const [bundleNotice, setBundleNotice] = useState<BundledAnonymousPlaylist | null>(null)

  const openBundledPlaylist = async (
    kind: 'day' | 'festival',
    artistIds: string[],
    title: string,
  ) => {
    const ids = artistIds.filter((aid) => playlistReady.has(aid))
    if (ids.length === 0) return

    const orderedIds =
      kind === 'day'
        ? orderArtistIdsForDayBundle(ids, activeDay?.slots)
        : orderArtistIdsForFestivalBundle(ids, festival.lineup)

    setBundleLoading(kind)
    try {
      const playlists = await Promise.all(
        orderedIds.map((aid) => FestivalService.getPlaylistForArtist(aid)),
      )
      const bundle = buildBundledAnonymousPlaylist(artistInputsFromPlaylists(playlists))
      if (!bundle) return

      const url = buildWatchVideosUrl(bundle.videoIds, title)
      if (!url) return

      if (bundle.downgraded || bundle.truncated || bundle.thinCoverage) {
        setBundleNotice(bundle)
        onPlanFocus?.()
      } else {
        setBundleNotice(null)
      }

      window.open(url, '_blank', 'noopener,noreferrer')
    } finally {
      setBundleLoading(null)
    }
  }

  const openMyLineupPlaylist = async () => {
    const onDayIds = filterMyLineupForDay(myLineupArtistIds, activeDay)
    const ids = onDayIds.filter((aid) => playlistReady.has(aid))
    if (ids.length === 0) return

    const orderedIds =
      festival.lineupStage === 'stage3_timetable' && activeDay?.slots?.length
        ? orderArtistIdsForDayBundle(ids, activeDay.slots)
        : orderArtistIdsForFestivalBundle(ids, festival.lineup)

    setBundleLoading('custom')
    try {
      const playlists = await Promise.all(
        orderedIds.map((aid) => FestivalService.getPlaylistForArtist(aid)),
      )
      const bundle = buildBundledAnonymousPlaylist(artistInputsFromPlaylists(playlists))
      if (!bundle) return

      const title = playlistTitleForCustom(festival.name)
      const url = buildWatchVideosUrl(bundle.videoIds, title)
      if (!url) return

      if (bundle.downgraded || bundle.truncated || bundle.thinCoverage) {
        setBundleNotice(bundle)
        onPlanFocus?.()
      } else {
        setBundleNotice(null)
      }

      window.open(url, '_blank', 'noopener,noreferrer')
    } finally {
      setBundleLoading(null)
    }
  }

  return {
    bundleLoading,
    bundleNotice,
    setBundleNotice,
    openBundledPlaylist,
    openMyLineupPlaylist,
    dismissBundleNotice: () => setBundleNotice(null),
  }
}
