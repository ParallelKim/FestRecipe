import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  MobileArtistView,
  MobileFestivalView,
  MobilePlaylistView,
} from '../view/types'
import { useMobileLineup } from '../hooks/useMobileLineup'
import { useMobileListen } from '../hooks/useMobileListen'
import { lineupIdsOnDay, removeDayFromLineup } from '../lib/lineup'
import MobileDayBar from './MobileDayBar'
import MobileTimetable from './MobileTimetable'
import MobileArtistList from './MobileArtistList'
import MobileLineupDock from './MobileLineupDock'
import MobileLineupSheet from './MobileLineupSheet'
import MobileArtistSheet from './MobileArtistSheet'
import MobileMoreSheet, { MobileBundleNoticeBar } from './MobileMoreSheet'
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
  const [moreSheetOpen, setMoreSheetOpen] = useState(false)
  const [wallpaperOpen, setWallpaperOpen] = useState(false)
  const [artistPlaylist, setArtistPlaylist] = useState<MobilePlaylistView | null>(null)
  const [artistPlaylistLoading, setArtistPlaylistLoading] = useState(false)

  const lineup = useMobileLineup(festival.id)
  const activeDay = festival.days.find((d) => d.id === activeDayId) ?? festival.days[0]

  const lineupOnDay = useMemo(
    () => lineupIdsOnDay(lineup.artistIds, activeDay),
    [lineup.artistIds, activeDay],
  )

  const listen = useMobileListen(festival, activeDay, lineup.artistIds, playlistReady)

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
      ? listen.artistListenUrl(selectedArtist.displayName, artistPlaylist.tracks)
      : null

  const dayReady = activeDay
    ? activeDay.artistIds.some((id) => playlistReady.has(id))
    : false
  const festivalReady = festival.allArtistIds.some((id) => playlistReady.has(id))
  const wallpaperAvailable =
    festival.layoutKind === 'timetable' && (activeDay?.slots.length ?? 0) > 0

  const openArtist = useCallback((artistId: string) => {
    setSelectedArtistId(artistId)
    setLineupSheetOpen(false)
  }, [])

  const closeArtist = useCallback(() => setSelectedArtistId(null), [])

  const handleDayChange = useCallback(
    (dayId: string) => {
      setActiveDayId(dayId)
      setSelectedArtistId(null)
    },
    [],
  )

  const clearLineupOnDay = useCallback(() => {
    lineup.setIds(removeDayFromLineup(lineup.artistIds, activeDay))
  }, [lineup, activeDay])

  const listArtistIds =
    festival.layoutKind === 'all'
      ? festival.allArtistIds
      : (activeDay?.artistIds ?? [])

  const hasDock = lineupOnDay.length > 0

  return (
    <div className={`m-app${hasDock ? ' has-dock' : ''}`}>
      <header className="m-header">
        <div className="m-header__days">
          <MobileDayBar
            days={festival.days}
            activeId={activeDayId}
            onChange={handleDayChange}
          />
        </div>
        <button
          type="button"
          className="m-header__more"
          aria-label="더보기"
          onClick={() => setMoreSheetOpen(true)}
        >
          ⋯
        </button>
      </header>

      <main className="m-main">
        {festival.layoutKind === 'timetable' && activeDay && activeDay.slots.length > 0 ? (
          <MobileTimetable
            day={activeDay}
            stages={festival.stages}
            artists={artistMap}
            lineupIds={lineup.artistIds}
            selectedArtistId={selectedArtistId ?? undefined}
            onSlotClick={openArtist}
            onToggleLineup={lineup.toggle}
          />
        ) : (
          <MobileArtistList
            artistIds={listArtistIds}
            artists={artistMap}
            playlistReady={playlistReady}
            lineupIds={lineup.artistIds}
            selectedArtistId={selectedArtistId ?? undefined}
            onArtistClick={openArtist}
            onToggleLineup={lineup.toggle}
          />
        )}
      </main>

      {listen.notice && (
        <MobileBundleNoticeBar notice={listen.notice} onDismiss={listen.dismissNotice} />
      )}

      <MobileLineupDock
        count={lineupOnDay.length}
        loading={listen.loading === 'custom'}
        onPlay={() => listen.openLineupBundle()}
        onExpand={() => setLineupSheetOpen(true)}
      />

      <MobileArtistSheet
        open={!!selectedArtist}
        artist={selectedArtist}
        inLineup={selectedArtist ? lineup.artistIds.includes(selectedArtist.id) : false}
        loading={artistPlaylistLoading}
        playlist={artistPlaylist}
        listenUrl={artistListenUrl}
        onClose={closeArtist}
        onToggleLineup={() => selectedArtist && lineup.toggle(selectedArtist.id)}
        onOpenLineup={() => {
          closeArtist()
          setLineupSheetOpen(true)
        }}
        lineupCount={lineupOnDay.length}
      />

      <MobileLineupSheet
        open={lineupSheetOpen}
        artistIds={lineupOnDay}
        artists={artistMap}
        playlistReady={playlistReady}
        loading={listen.loading === 'custom'}
        onClose={() => setLineupSheetOpen(false)}
        onPlay={() => listen.openLineupBundle()}
        onClear={clearLineupOnDay}
        onRemove={(id) => lineup.toggle(id)}
        onArtistClick={(id) => {
          setLineupSheetOpen(false)
          openArtist(id)
        }}
      />

      <MobileMoreSheet
        open={moreSheetOpen}
        dayReady={dayReady}
        festivalReady={festivalReady}
        wallpaperAvailable={wallpaperAvailable}
        loadingDay={listen.loading === 'day'}
        loadingFestival={listen.loading === 'festival'}
        onClose={() => setMoreSheetOpen(false)}
        onListenDay={() => listen.openDayBundle()}
        onListenFestival={() => listen.openFestivalBundle()}
        onWallpaper={() => {
          setMoreSheetOpen(false)
          setWallpaperOpen(true)
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
