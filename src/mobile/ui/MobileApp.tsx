import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  MobileArtistView,
  MobileFestivalView,
  MobilePlaylistView,
} from '../view/types'
import { useMobileLineup } from '../hooks/useMobileLineup'
import { useMobileListen } from '../hooks/useMobileListen'
import { useMobileListenScope } from '../hooks/useMobileListenScope'
import { lineupIdsOnDay, removeDayFromLineup } from '../lib/lineup'
import { orderArtistIdsForDay } from '../lib/orderArtists'
import MobileDayBar from './MobileDayBar'
import MobileTimetable from './MobileTimetable'
import MobileArtistList from './MobileArtistList'
import MobileBottomBar from './MobileBottomBar'
import MobileLineupSheet from './MobileLineupSheet'
import MobileArtistSheet from './MobileArtistSheet'
import MobileBundleNoticeBar from './MobileBundleNoticeBar'
import MobileWallpaperStudio from './MobileWallpaperStudio'

interface MobileAppProps {
  festival: MobileFestivalView
  artistMap: Map<string, MobileArtistView>
  playlistReady: Set<string>
}

export default function MobileApp({
  festival,
  artistMap,
  playlistReady,
}: MobileAppProps) {
  const [activeDayId, setActiveDayId] = useState(festival.days[0]?.id ?? '')
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null)
  const [lineupSheetOpen, setLineupSheetOpen] = useState(false)
  const [wallpaperOpen, setWallpaperOpen] = useState(false)
  const [artistPlaylist, setArtistPlaylist] = useState<MobilePlaylistView | null>(null)
  const [artistPlaylistLoading, setArtistPlaylistLoading] = useState(false)

  const lineup = useMobileLineup(festival.id)
  const listenScope = useMobileListenScope()
  const activeDay = festival.days.find((d) => d.id === activeDayId) ?? festival.days[0]

  const lineupOnDay = useMemo(
    () => lineupIdsOnDay(lineup.artistIds, activeDay),
    [lineup.artistIds, activeDay],
  )

  const lineupOnDayOrdered = useMemo(() => {
    if (
      festival.layoutKind === 'timetable' &&
      activeDay?.slots.length
    ) {
      return orderArtistIdsForDay(activeDay.slots, lineupOnDay)
    }
    return lineupOnDay
  }, [festival.layoutKind, activeDay, lineupOnDay])

  const lineupReadyOnDay = useMemo(
    () => lineupOnDay.filter((id) => playlistReady.has(id)).length,
    [lineupOnDay, playlistReady],
  )

  const listen = useMobileListen(festival, activeDay, lineup.artistIds, playlistReady)

  useEffect(() => {
    listenScope.syncLineupEmpty(lineup.artistIds.length)
  }, [lineup.artistIds.length, listenScope.syncLineupEmpty])

  useEffect(() => {
    const ids = activeDay?.artistIds ?? []
    if (ids.length === 0) return
    const schedule =
      window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 600))
    const cancel = window.cancelIdleCallback ?? window.clearTimeout
    const handle = schedule(() => listen.prefetch(ids.slice(0, 24)))
    return () => cancel(handle as number)
  }, [activeDay, listen.prefetch])

  useEffect(() => {
    if (!selectedArtistId) {
      setArtistPlaylist(null)
      setArtistPlaylistLoading(false)
      return
    }

    let active = true
    setArtistPlaylistLoading(true)
    setArtistPlaylist(null)

    listen.loadPlaylist(selectedArtistId).then((pl) => {
      if (!active) return
      setArtistPlaylist(pl)
      setArtistPlaylistLoading(false)
    })

    return () => {
      active = false
    }
  }, [selectedArtistId, listen.loadPlaylist])

  const selectedArtist = selectedArtistId
    ? (artistMap.get(selectedArtistId) ?? null)
    : null

  const artistListenUrl =
    selectedArtist && artistPlaylist
      ? listen.artistListenUrl(
          selectedArtist.displayName,
          artistPlaylist.tracks,
          artistPlaylist.listenUrl,
        )
      : null

  const dayReady = activeDay
    ? activeDay.artistIds.some((id) => playlistReady.has(id))
    : false
  const festivalReady = festival.allArtistIds.some((id) => playlistReady.has(id))
  const customReady = lineupReadyOnDay > 0
  const wallpaperAvailable =
    festival.layoutKind === 'timetable' && (activeDay?.slots.length ?? 0) > 0

  const scope = listenScope.scope
  const canPlay =
    scope === 'day'
      ? dayReady
      : scope === 'festival'
        ? festivalReady
        : customReady

  const scopeLoading =
    listen.loading === scope

  const openArtist = useCallback((artistId: string) => {
    setSelectedArtistId(artistId)
    setLineupSheetOpen(false)
  }, [])

  const closeArtist = useCallback(() => setSelectedArtistId(null), [])

  const handleDayChange = useCallback(
    (dayId: string) => {
      setActiveDayId(dayId)
      setSelectedArtistId(null)
      const day = festival.days.find((d) => d.id === dayId)
      const onDayCount = lineupIdsOnDay(lineup.artistIds, day).length
      listenScope.syncForActiveDay(onDayCount)
      // 일자 탭 전환 시 스크롤을 최상단으로
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    },
    [festival.days, lineup.artistIds, listenScope],
  )

  const handleToggleLineup = useCallback(
    (artistId: string) => {
      const adding = !lineup.artistIds.includes(artistId)
      const lineupOnDayBefore = lineupIdsOnDay(lineup.artistIds, activeDay).length === 0
      lineup.toggle(artistId)
      if (adding && lineupOnDayBefore) {
        listenScope.applyContextualCustom()
      }
    },
    [lineup, activeDay, listenScope],
  )

  const clearLineupOnDay = useCallback(() => {
    lineup.setIds(removeDayFromLineup(lineup.artistIds, activeDay))
    listenScope.resetAfterStrongAction()
  }, [lineup, activeDay, listenScope])

  const playListen = useCallback(() => {
    if (scope === 'day') listen.openDayBundle()
    else if (scope === 'festival') listen.openFestivalBundle()
    else listen.openLineupBundle()
  }, [scope, listen])

  const listArtistIds =
    festival.layoutKind === 'all'
      ? festival.allArtistIds
      : (activeDay?.artistIds ?? [])

  return (
    <div className="relative pb-[calc(56px+env(safe-area-inset-bottom))]">
      <header className="border-b border-border bg-background px-4 py-3">
        <MobileDayBar
          days={festival.days}
          activeId={activeDayId}
          onChange={handleDayChange}
        />
      </header>

      <main className="px-4 py-3 pb-4">
        {festival.layoutKind === 'timetable' && activeDay && activeDay.slots.length > 0 ? (
          <MobileTimetable
            day={activeDay}
            stages={festival.stages}
            artists={artistMap}
            lineupIds={lineup.artistIds}
            selectedArtistId={selectedArtistId ?? undefined}
            onSlotClick={openArtist}
            onToggleLineup={handleToggleLineup}
          />
        ) : (
          <MobileArtistList
            artistIds={listArtistIds}
            artists={artistMap}
            lineupIds={lineup.artistIds}
            selectedArtistId={selectedArtistId ?? undefined}
            onArtistClick={openArtist}
            onToggleLineup={handleToggleLineup}
          />
        )}
      </main>

      {listen.notice && (
        <MobileBundleNoticeBar notice={listen.notice} onDismiss={listen.dismissNotice} />
      )}

      <MobileBottomBar
        scope={scope}
        dayLabel={activeDay?.label ?? ''}
        onScopeChange={listenScope.pickScope}
        canPlay={canPlay}
        loading={scopeLoading}
        onPlay={playListen}
        dayReady={dayReady}
        festivalReady={festivalReady}
        customReady={customReady}
        wallpaperAvailable={wallpaperAvailable}
        canClearLineup={lineupOnDay.length > 0}
        onOpenLineup={() => setLineupSheetOpen(true)}
        onClearLineup={clearLineupOnDay}
        onWallpaper={() => setWallpaperOpen(true)}
      />

      <MobileArtistSheet
        open={!!selectedArtist}
        artist={selectedArtist}
        inLineup={selectedArtist ? lineup.artistIds.includes(selectedArtist.id) : false}
        loading={artistPlaylistLoading}
        playlist={artistPlaylist}
        listenUrl={artistListenUrl}
        onClose={closeArtist}
        onToggleLineup={() => selectedArtist && handleToggleLineup(selectedArtist.id)}
      />

      <MobileLineupSheet
        open={lineupSheetOpen}
        dayLabel={activeDay?.label ?? ''}
        artistIds={lineupOnDayOrdered}
        artists={artistMap}
        playlistReady={playlistReady}
        onClose={() => setLineupSheetOpen(false)}
        onRemove={(id) => handleToggleLineup(id)}
        onArtistClick={(id) => {
          setLineupSheetOpen(false)
          openArtist(id)
        }}
      />

      {wallpaperAvailable && activeDay && (
        <MobileWallpaperStudio
          open={wallpaperOpen}
          onClose={() => setWallpaperOpen(false)}
          festival={festival}
          day={activeDay}
          artists={artistMap}
          lineupIds={lineup.artistIds}
        />
      )}
    </div>
  )
}
