import { useCallback, useRef, useState } from 'react'
import type { MobileBundleNotice, MobileDayView, MobileFestivalView } from '../view/types'
import { getPlaylistRaw } from '../../data/playlistData'
import { mapPlaylistView } from '../data/mapPlaylist'
import { lineupIdsOnDay } from '../lib/lineup'
import { orderArtistIdsForDay, orderArtistIdsForFestival } from '../lib/orderArtists'
import {
  buildBundledAnonymousPlaylist,
  bundleNoticeCopy,
  type BundledAnonymousPlaylist,
} from '../../lib/bundlePlaylist'
import { artistInputsFromMobilePlaylists } from '../lib/bundleAdapter'
import {
  buildWatchVideosUrl,
  playlistTitleForArtist,
  playlistTitleForCustom,
  playlistTitleForDay,
  playlistTitleForFestival,
} from '../../lib/youtubePlaylist'

type ListenKind = 'day' | 'festival' | 'custom' | null

function toNotice(bundle: BundledAnonymousPlaylist): MobileBundleNotice {
  const copy = bundleNoticeCopy(bundle)
  return {
    title: copy.title,
    body: copy.body,
    warn: bundle.truncated || bundle.thinCoverage,
  }
}

export function useMobileListen(
  festival: MobileFestivalView | null,
  activeDay: MobileDayView | undefined,
  lineupIds: string[],
  playlistReady: Set<string>,
) {
  const [loading, setLoading] = useState<ListenKind>(null)
  const [notice, setNotice] = useState<MobileBundleNotice | null>(null)
  const cacheRef = useRef<Map<string, Awaited<ReturnType<typeof mapPlaylistView>>>>(new Map())

  const loadPlaylist = useCallback(async (artistId: string) => {
    const cached = cacheRef.current.get(artistId)
    if (cached) return cached

    const raw = await getPlaylistRaw(artistId)
    if (!raw) return null
    const view = mapPlaylistView(raw)
    if (view) cacheRef.current.set(artistId, view)
    return view
  }, [])

  const prefetch = useCallback(
    (artistIds: string[]) => {
      for (const id of artistIds) {
        void loadPlaylist(id)
      }
    },
    [loadPlaylist],
  )

  const dismissNotice = useCallback(() => setNotice(null), [])

  const openYoutube = useCallback((url: string | null, bundle: BundledAnonymousPlaylist | null) => {
    if (!url) return
    if (bundle && (bundle.downgraded || bundle.truncated || bundle.thinCoverage)) {
      setNotice(toNotice(bundle))
    } else {
      setNotice(null)
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  }, [])

  const openDayBundle = useCallback(async () => {
    if (!festival || !activeDay) return
    const ids = activeDay.artistIds.filter((id) => playlistReady.has(id))
    if (ids.length === 0) return

    setLoading('day')
    try {
      const ordered = orderArtistIdsForDay(activeDay.slots, ids)
      const playlists = await Promise.all(ordered.map((id) => loadPlaylist(id)))
      const bundle = buildBundledAnonymousPlaylist(
        artistInputsFromMobilePlaylists(playlists),
      )
      if (!bundle) return
      const title = playlistTitleForDay(festival.name, activeDay.label)
      openYoutube(buildWatchVideosUrl(bundle.videoIds, title), bundle)
    } finally {
      setLoading(null)
    }
  }, [festival, activeDay, playlistReady, loadPlaylist, openYoutube])

  const openFestivalBundle = useCallback(async () => {
    if (!festival) return
    const ids = festival.allArtistIds.filter((id) => playlistReady.has(id))
    if (ids.length === 0) return

    setLoading('festival')
    try {
      const ordered = orderArtistIdsForFestival(festival.days, ids)
      const playlists = await Promise.all(ordered.map((id) => loadPlaylist(id)))
      const bundle = buildBundledAnonymousPlaylist(
        artistInputsFromMobilePlaylists(playlists),
      )
      if (!bundle) return
      const title = playlistTitleForFestival(festival.name)
      openYoutube(buildWatchVideosUrl(bundle.videoIds, title), bundle)
    } finally {
      setLoading(null)
    }
  }, [festival, playlistReady, loadPlaylist, openYoutube])

  const openLineupBundle = useCallback(async () => {
    if (!festival || !activeDay) return
    const onDay = lineupIdsOnDay(lineupIds, activeDay)
    const ids = onDay.filter((id) => playlistReady.has(id))
    if (ids.length === 0) return

    setLoading('custom')
    try {
      const ordered =
        festival.layoutKind === 'timetable' && activeDay.slots.length
          ? orderArtistIdsForDay(activeDay.slots, ids)
          : orderArtistIdsForFestival(festival.days, ids)
      const playlists = await Promise.all(ordered.map((id) => loadPlaylist(id)))
      const bundle = buildBundledAnonymousPlaylist(
        artistInputsFromMobilePlaylists(playlists),
      )
      if (!bundle) return
      const title = playlistTitleForCustom(festival.name)
      openYoutube(buildWatchVideosUrl(bundle.videoIds, title), bundle)
    } finally {
      setLoading(null)
    }
  }, [festival, activeDay, lineupIds, playlistReady, loadPlaylist, openYoutube])

  const artistListenUrl = useCallback(
    (artistName: string, tracks: { videoId: string }[], namedUrl?: string | null) => {
      const named = (namedUrl || '').trim()
      // 기명 PL(YTM Top songs) 우선 — 익명 watch_videos 조립하지 않음
      if (named.startsWith('https://www.youtube.com/playlist?list=')) return named
      if (named.startsWith('https://music.youtube.com/playlist?list=')) {
        // PRODUCT: 듣기는 YouTube 로 통일
        try {
          const u = new URL(named)
          const list = u.searchParams.get('list')
          if (list) return `https://www.youtube.com/playlist?list=${list}`
        } catch {
          /* fall through */
        }
      }
      if (!festival || tracks.length === 0) return named || null
      const title = playlistTitleForArtist(festival.name, artistName)
      return buildWatchVideosUrl(
        tracks.map((t) => t.videoId),
        title,
      )
    },
    [festival],
  )

  return {
    loading,
    notice,
    dismissNotice,
    loadPlaylist,
    prefetch,
    openDayBundle,
    openFestivalBundle,
    openLineupBundle,
    artistListenUrl,
  }
}
