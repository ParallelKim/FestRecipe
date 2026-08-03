import { useState, useEffect, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FestivalService } from '../services/festivals'
import type { Festival, Artist } from '../types'
import FestivalHelmet from '../components/seo/FestivalHelmet'
import LoadingState from '../components/LoadingState'
import FestivalMobileExperience from '../components/festival-mobile/FestivalMobileExperience'
import { buildFestivalMapUrl } from '../lib/festivalLinks'
import { festivalLineupHighlightFallback } from '../lib/stageTheme'
import { artistIdsOnDay } from '../lib/lineupDay'
import { useMyLineup } from '../hooks/useMyLineup'
import { useFestivalPlaylistActions } from '../hooks/useFestivalPlaylistActions'
import { Button } from '@/components/ui/button'
import '../components/festival-mobile/festival-mobile.css'

function formatDateRange(start: string, end: string): string {
  const fmt = (iso: string) => {
    const [, m, d] = iso.split('-')
    return `${Number(m)}.${Number(d)}`
  }
  return `${fmt(start)} – ${fmt(end)}`
}

/**
 * 모바일 전용 페스티벌 상세 — `/festival/:id/m`
 * 기존 `/festival/:id`와 분리된 신 UI 실험 경로.
 */
export default function FestivalMobile() {
  const { id } = useParams<{ id: string }>()

  const [festival, setFestival] = useState<Festival | null>(null)
  const [artists, setArtists] = useState<Artist[]>([])
  const [playlistReady, setPlaylistReady] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [activeDayIndex, setActiveDayIndex] = useState(0)

  const myLineup = useMyLineup(id)

  useEffect(() => {
    let active = true
    if (!id) return

    Promise.all([
      FestivalService.getFestivalById(id),
      FestivalService.getArtists(),
      FestivalService.getPlaylistIndex(),
    ]).then(([festData, artistsData, playlistIndex]) => {
      if (active) {
        if (festData) setFestival(festData)
        setArtists(artistsData)
        setPlaylistReady(playlistIndex)
        setLoading(false)
      }
    })

    return () => {
      active = false
    }
  }, [id])

  useEffect(() => {
    if (!festival) return
    const day = festival.lineup[activeDayIndex]
    const ids =
      festival.lineupStage === 'stage1_all'
        ? festival.allArtists
        : day?.artists?.length
          ? day.artists
          : (day?.slots || []).map((s) => s.artistId)
    if (ids.length === 0) return
    const schedule = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 600))
    const cancel = window.cancelIdleCallback ?? window.clearTimeout
    const handle = schedule(() => FestivalService.prefetchPlaylists(ids))
    return () => cancel(handle as number)
  }, [festival, activeDayIndex])

  if (loading) {
    return <LoadingState label="페스티벌 정보를 불러오는 중…" minHeight="100vh" />
  }

  if (!festival || !id) {
    return (
      <div className="container festival-missing">
        <h2 className="text-title-lg">페스티벌을 찾을 수 없어요.</h2>
        <p className="text-body text-muted">주소가 잘못되었거나 아직 준비 중인 페스티벌이에요.</p>
        <Button render={<Link to="/" />} nativeButton={false}>홈으로 돌아가기</Button>
      </div>
    )
  }

  const activeDay = festival.lineup[activeDayIndex]
  const mapUrl = buildFestivalMapUrl(festival)

  const {
    bundleLoading,
    bundleNotice,
    openBundledPlaylist,
    openMyLineupPlaylist,
    dismissBundleNotice,
  } = useFestivalPlaylistActions({
    festival,
    activeDay,
    playlistReady,
    myLineupArtistIds: myLineup.artistIds,
  })

  const clearMyLineupOnDay = useCallback(() => {
    const onDay = artistIdsOnDay(activeDay)
    if (onDay.size === 0) return
    myLineup.setArtistIds(myLineup.artistIds.filter((aid) => !onDay.has(aid)))
  }, [activeDay, myLineup])

  const artistCount =
    festival.lineupStage === 'stage1_all'
      ? festival.allArtists?.length || 0
      : festival.lineup.reduce((acc, day) => {
          if (day.artists?.length) return acc + day.artists.length
          if (day.slots?.length) return acc + day.slots.length
          return acc
        }, 0)

  const festivalLineupBg = festivalLineupHighlightFallback(
    festival.stageStyles,
    festival.lineupHighlightColor,
  )

  return (
    <div
      className="fm-page"
      style={{ ['--festival-lineup-bg' as string]: festivalLineupBg }}
    >
      <FestivalHelmet
        festivalId={festival.id}
        festivalName={festival.name}
        description={festival.description}
        startDate={festival.startDate}
        endDate={festival.endDate}
        location={festival.location}
        artistCount={artistCount}
      />

      <p className="fm-page__desktop-hint">
        모바일에 맞춘 화면이에요. 넓은 화면에서는{' '}
        <Link to={`/festival/${id}`}>기존 페스티벌 화면</Link>을 써 보세요.
      </p>

      <header className="fm-page__header">
        <div className="fm-page__header-row">
          <Link to="/" className="fm-page__back">← 목록</Link>
          <Link to={`/festival/${id}`} className="fm-page__classic">기존 화면</Link>
        </div>
        <div className="fm-page__brand">
          {festival.logoUrl && (
            <img src={festival.logoUrl} alt="" className="fm-page__mark" />
          )}
          <div className="fm-page__copy">
            <h1 className="fm-page__title">{festival.name}</h1>
            <p className="fm-page__meta">
              {formatDateRange(festival.startDate, festival.endDate)}
              <span aria-hidden="true"> · </span>
              {mapUrl ? (
                <a href={mapUrl} target="_blank" rel="noopener noreferrer">
                  {festival.location}
                </a>
              ) : (
                festival.location
              )}
            </p>
          </div>
        </div>
      </header>

      <FestivalMobileExperience
        standalone
        festival={festival}
        artists={artists}
        activeDayIndex={activeDayIndex}
        onDayChange={setActiveDayIndex}
        playlistReady={playlistReady}
        bundleLoading={bundleLoading}
        bundleNotice={bundleNotice}
        onOpenBundled={openBundledPlaylist}
        onPlayMyLineup={openMyLineupPlaylist}
        onDismissBundleNotice={dismissBundleNotice}
        myLineupIds={myLineup.artistIds}
        onToggleLineup={myLineup.toggle}
        onClearLineupOnDay={clearMyLineupOnDay}
      />
    </div>
  )
}
