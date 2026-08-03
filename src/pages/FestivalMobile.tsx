import { useState, useEffect, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FestivalService } from '../services/festivals'
import type { Festival, Artist } from '../types'
import FestivalHelmet from '../components/seo/FestivalHelmet'
import LoadingState from '../components/LoadingState'
import FmNextApp from '../features/fm-next/FmNextApp'
import { buildFestivalMapUrl } from '../lib/festivalLinks'
import { festivalLineupHighlightFallback } from '../lib/stageTheme'
import { artistIdsOnDay } from '../lib/lineupDay'
import { useMyLineup } from '../hooks/useMyLineup'
import { useFestivalPlaylistActions } from '../hooks/useFestivalPlaylistActions'
import { Button } from '@/components/ui/button'
import '../features/fm-next/fm-next.css'

function formatDateRange(start: string, end: string): string {
  const fmt = (iso: string) => {
    const [, m, d] = iso.split('-')
    return `${Number(m)}.${Number(d)}`
  }
  return `${fmt(start)} – ${fmt(end)}`
}

interface FestivalMobileLoadedProps {
  id: string
  festival: Festival
  artists: Artist[]
  playlistReady: Set<string>
}

function FestivalMobileLoaded({
  id,
  festival,
  artists,
  playlistReady,
}: FestivalMobileLoadedProps) {
  const [activeDayIndex, setActiveDayIndex] = useState(0)
  const myLineup = useMyLineup(id)
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
      className="fm2-page"
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

      <p className="fm2-page__desktop-hint">
        모바일에 맞춘 화면이에요. 넓은 화면에서는{' '}
        <Link to={`/festival/${id}`}>기존 페스티벌 화면</Link>을 써 보세요.
      </p>

      <header className="fm2-page__header">
        <div className="fm2-page__header-row">
          <Link to="/" className="fm2-page__back">← 목록</Link>
          <Link to={`/festival/${id}`} className="fm2-page__classic">기존 화면</Link>
        </div>
        <div className="fm2-page__brand">
          {festival.logoUrl && (
            <img src={festival.logoUrl} alt="" className="fm2-page__mark" />
          )}
          <div>
            <h1 className="fm2-page__title">{festival.name}</h1>
            <p className="fm2-page__meta">
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

      <div className="fm2-page__body">
        <FmNextApp
          festival={festival}
          artists={artists}
          activeDayIndex={activeDayIndex}
          onDayChange={setActiveDayIndex}
          playlistReady={playlistReady}
          myLineupIds={myLineup.artistIds}
          onToggleLineup={myLineup.toggle}
          onClearLineupOnDay={clearMyLineupOnDay}
          bundleLoading={bundleLoading}
          bundleNotice={bundleNotice}
          onDismissBundleNotice={dismissBundleNotice}
          onOpenBundled={openBundledPlaylist}
          onOpenLineupPlaylist={openMyLineupPlaylist}
        />
      </div>
    </div>
  )
}

/** `/festival/:id/m` — 신 모바일 UI (레거시 허브 컴포넌트 미사용) */
export default function FestivalMobile() {
  const { id } = useParams<{ id: string }>()

  const [festival, setFestival] = useState<Festival | null>(null)
  const [artists, setArtists] = useState<Artist[]>([])
  const [playlistReady, setPlaylistReady] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let active = true

    if (!id) {
      setLoading(false)
      return
    }

    setLoading(true)
    setLoadError(false)

    Promise.all([
      FestivalService.getFestivalById(id),
      FestivalService.getArtists(),
      FestivalService.getPlaylistIndex(),
    ])
      .then(([festData, artistsData, playlistIndex]) => {
        if (!active) return
        if (festData) setFestival(festData)
        setArtists(artistsData)
        setPlaylistReady(playlistIndex)
      })
      .catch((err) => {
        console.error('FestivalMobile load failed:', err)
        if (active) setLoadError(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [id])

  useEffect(() => {
    if (!festival) return
    const day = festival.lineup[0]
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
  }, [festival])

  if (loading) {
    return <LoadingState label="페스티벌 정보를 불러오는 중…" minHeight="100vh" />
  }

  if (loadError || !festival || !id) {
    return (
      <div className="container festival-missing">
        <h2 className="text-title-lg">페스티벌을 찾을 수 없어요.</h2>
        <p className="text-body text-muted">
          {loadError
            ? '정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'
            : '주소가 잘못되었거나 아직 준비 중인 페스티벌이에요.'}
        </p>
        <Button render={<Link to="/" />} nativeButton={false}>홈으로 돌아가기</Button>
      </div>
    )
  }

  return (
    <FestivalMobileLoaded
      id={id}
      festival={festival}
      artists={artists}
      playlistReady={playlistReady}
    />
  )
}
