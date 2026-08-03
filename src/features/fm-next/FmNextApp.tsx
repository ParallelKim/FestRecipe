import { useEffect, useState } from 'react'
import type { Artist, Festival } from '../../types'
import type { BundledAnonymousPlaylist } from '../../lib/bundlePlaylist'
import { filterMyLineupForDay } from '../../lib/lineupDay'
import {
  playlistTitleForDay,
  playlistTitleForFestival,
} from '../../lib/youtubePlaylist'
import FmNextTabBar from './FmNextTabBar'
import FmScheduleView from './FmScheduleView'
import FmPlanView from './FmPlanView'
import FmArtistSheet from './FmArtistSheet'

type FmTab = 'schedule' | 'plan'

interface FmNextAppProps {
  festival: Festival
  artists: Artist[]
  activeDayIndex: number
  onDayChange: (index: number) => void
  playlistReady: Set<string>
  myLineupIds: string[]
  onToggleLineup: (artistId: string) => void
  onClearLineupOnDay: () => void
  bundleLoading: 'day' | 'festival' | 'custom' | null
  bundleNotice: BundledAnonymousPlaylist | null
  onDismissBundleNotice: () => void
  onOpenBundled: (kind: 'day' | 'festival', artistIds: string[], title: string) => void
  onOpenLineupPlaylist: () => void
}

/** 신 모바일 UI 본체 — 레거시 허브·패널 없음 */
export default function FmNextApp({
  festival,
  artists,
  activeDayIndex,
  onDayChange,
  playlistReady,
  myLineupIds,
  onToggleLineup,
  onClearLineupOnDay,
  bundleLoading,
  bundleNotice,
  onDismissBundleNotice,
  onOpenBundled,
  onOpenLineupPlaylist,
}: FmNextAppProps) {
  const [tab, setTab] = useState<FmTab>('schedule')
  const [sheetArtistId, setSheetArtistId] = useState<string | null>(null)

  const activeDay = festival.lineup[activeDayIndex]
  const artistMap = new Map(artists.map((a) => [a.id, a]))
  const sheetArtist = sheetArtistId ? artistMap.get(sheetArtistId) : null
  const lineupOnDayCount = filterMyLineupForDay(myLineupIds, activeDay).length

  useEffect(() => {
    if (bundleNotice) setTab('plan')
  }, [bundleNotice])

  const openArtist = (artistId: string) => {
    setSheetArtistId(artistId)
  }

  const closeArtist = () => setSheetArtistId(null)

  const changeTab = (next: FmTab) => {
    setTab(next)
    if (next === 'plan') closeArtist()
  }

  const changeDay = (idx: number) => {
    onDayChange(idx)
    closeArtist()
  }

  const goToPlan = () => {
    closeArtist()
    requestAnimationFrame(() => setTab('plan'))
  }

  const dayArtistIds = activeDay?.artists?.length
    ? activeDay.artists
    : (activeDay?.slots || []).map((s) => s.artistId)

  const openDayBundle = () => {
    const title = playlistTitleForDay(festival.name, activeDay?.dayLabel || '')
    onOpenBundled('day', dayArtistIds, title)
  }

  const openFestivalBundle = () => {
    const title = playlistTitleForFestival(festival.name)
    onOpenBundled('festival', festival.allArtists || [], title)
  }

  return (
    <div className="fm2-app">
      <div className="fm2-app__panel">
        {tab === 'schedule' && (
          <FmScheduleView
            festival={festival}
            activeDay={activeDay}
            activeDayIndex={activeDayIndex}
            onDayChange={changeDay}
            artists={artists}
            myLineupIds={myLineupIds}
            playlistReady={playlistReady}
            selectedArtistId={sheetArtistId ?? undefined}
            onArtistClick={openArtist}
            onToggleLineup={onToggleLineup}
          />
        )}

        {tab === 'plan' && (
          <FmPlanView
            festival={festival}
            activeDay={activeDay}
            activeDayIndex={activeDayIndex}
            onDayChange={changeDay}
            artists={artists}
            myLineupIds={myLineupIds}
            playlistReady={playlistReady}
            bundleLoading={bundleLoading}
            bundleNotice={bundleNotice}
            onDismissBundleNotice={onDismissBundleNotice}
            onOpenDayBundle={openDayBundle}
            onOpenFestivalBundle={openFestivalBundle}
            onOpenLineupPlaylist={onOpenLineupPlaylist}
            onClearLineup={onClearLineupOnDay}
            onRemoveFromLineup={onToggleLineup}
            onArtistClick={openArtist}
          />
        )}
      </div>

      <FmNextTabBar
        active={tab}
        onChange={changeTab}
        hidden={!!sheetArtist}
        lineupCount={lineupOnDayCount}
      />

      <FmArtistSheet
        open={!!sheetArtist}
        artist={sheetArtist ?? null}
        festivalName={festival.name}
        inLineup={sheetArtist ? myLineupIds.includes(sheetArtist.id) : false}
        onClose={closeArtist}
        onToggleLineup={() => sheetArtist && onToggleLineup(sheetArtist.id)}
        onOpenPlanTab={goToPlan}
        lineupCount={lineupOnDayCount}
      />
    </div>
  )
}
