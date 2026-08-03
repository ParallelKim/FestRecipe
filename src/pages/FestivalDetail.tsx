import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FestivalService } from '../services/festivals'
import type { Festival, Artist, ArtistPlaylist } from '../types'
import TimetableGrid from '../components/TimetableGrid'
import MyLineupPickButton from '../components/MyLineupPickButton'
import FestivalHelmet from '../components/seo/FestivalHelmet'
import LoadingState from '../components/LoadingState'
import DayTabs from '../components/DayTabs'
import ArtistPlaylistPanel from '../components/ArtistPlaylistPanel'
import FestivalMobileExperience from '../components/festival-mobile/FestivalMobileExperience'
import { headlinerArtistIds } from '../lib/headliners'
import { officialArtistName } from '../lib/artistOfficialName'
import { buildFestivalMapUrl } from '../lib/festivalLinks'
import { blurAfterTap } from '../lib/blurAfterTap'
import { festivalLineupHighlightFallback } from '../lib/stageTheme'
import { filterMyLineupForDay, artistIdsOnDay } from '../lib/lineupDay'
import { useMyLineup } from '../hooks/useMyLineup'
import { useFestivalPlaylistActions } from '../hooks/useFestivalPlaylistActions'
import { Button } from '@/components/ui/button'

interface FestivalDetailLoadedProps {
  id: string
  festival: Festival
  artists: Artist[]
  playlistReady: Set<string>
}

function FestivalDetailLoaded({
  id,
  festival,
  artists,
  playlistReady,
}: FestivalDetailLoadedProps) {
  const [activeDayIndex, setActiveDayIndex] = useState(0)
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null)
  const [artistPlaylist, setArtistPlaylist] = useState<ArtistPlaylist | null>(null)
  const [playlistLoading, setPlaylistLoading] = useState(false)
  const [showMyLineupEditor, setShowMyLineupEditor] = useState(false)

  const myLineup = useMyLineup(id)

  useEffect(() => {
    let active = true
    if (!selectedArtist) {
      setArtistPlaylist(null)
      setPlaylistLoading(false)
      return
    }

    setPlaylistLoading(true)
    FestivalService.getPlaylistForArtist(selectedArtist.id).then((playlist) => {
      if (active) {
        setArtistPlaylist(playlist || null)
        setPlaylistLoading(false)
      }
    })

    return () => {
      active = false
    }
  }, [selectedArtist])

  useEffect(() => {
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

  const activeDay = festival.lineup[activeDayIndex]
  const myLineupOnDayCount = filterMyLineupForDay(myLineup.artistIds, activeDay).length

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

  let sigColor = 'var(--color-sig-cream)'
  let sigTextColor = 'var(--color-ink)'
  let sigMutedColor = 'var(--color-muted)'

  if (festival.signatureColor === 'forest') {
    sigColor = 'var(--color-sig-forest)'
    sigTextColor = '#ffffff'
    sigMutedColor = 'rgba(255,255,255,0.72)'
  } else if (festival.signatureColor === 'coral') {
    sigColor = 'var(--color-sig-coral)'
    sigTextColor = '#ffffff'
    sigMutedColor = 'rgba(255,255,255,0.72)'
  } else if (festival.signatureColor === 'dark') {
    sigColor = 'var(--color-surface-dark)'
    sigTextColor = '#ffffff'
    sigMutedColor = 'rgba(255,255,255,0.72)'
  }

  const artistMap = new Map(artists.map((a) => [a.id, a]))
  const mapUrl = buildFestivalMapUrl(festival)

  const stage1Artists = festival.allArtists
    .map((artistId) => artistMap.get(artistId))
    .filter((a): a is Artist => !!a)

  const activeDayArtists = (activeDay?.artists || [])
    .map((artistId) => artistMap.get(artistId))
    .filter((a): a is Artist => !!a)

  const handleDesktopArtistSelect = (artistId: string) => {
    const artist = artistMap.get(artistId)
    if (!artist) return
    setSelectedArtist(artist)
    blurAfterTap(document.activeElement)
  }

  const clearSelectedArtist = () => setSelectedArtist(null)

  const changeDay = (idx: number) => {
    setActiveDayIndex(idx)
    setSelectedArtist(null)
    setShowMyLineupEditor(false)
    dismissBundleNotice()
  }

  const artistCount = festival.lineupStage === 'stage1_all'
    ? (festival.allArtists?.length || 0)
    : festival.lineup.reduce((acc, day) => {
        if (day.artists?.length) return acc + day.artists.length
        if (day.slots?.length) return acc + day.slots.length
        return acc
      }, 0)

  const panelProps = {
    festival,
    activeDay,
    artists,
    selectedArtist,
    artistPlaylist: artistPlaylist || null,
    playlistLoading,
    playlistReady,
    bundleLoading,
    headlinerIds: headlinerArtistIds(activeDay?.slots),
    onOpenBundled: openBundledPlaylist,
    onOpenMyPlaylist: () => setShowMyLineupEditor(true),
    myLineupCount: myLineupOnDayCount,
    showMyLineupEditor,
    myLineupIds: myLineup.artistIds,
    onToggleMyLineup: myLineup.toggle,
    onClearMyLineup: clearMyLineupOnDay,
    onPlayMyLineup: openMyLineupPlaylist,
    onToggleMyLineupFromArtist: myLineup.toggle,
    onSelectArtistFromLineup: handleDesktopArtistSelect,
    onBackFromMyLineup: () => setShowMyLineupEditor(false),
    isInMyLineup: myLineup.has,
    bundleNotice,
    onDismissBundleNotice: dismissBundleNotice,
  }

  const festivalLineupBg = festivalLineupHighlightFallback(
    festival.stageStyles,
    festival.lineupHighlightColor,
  )

  return (
    <div
      className="festival-detail"
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

      <section
        className="festival-hero"
        style={{ backgroundColor: sigColor, color: sigTextColor }}
      >
        <div className="container">
          <Link to="/" className="festival-hero__back" style={{ color: sigTextColor }}>
            ← 페스티벌 목록
          </Link>

          {festival.posterUrl && (
            <motion.div
              className="festival-hero__poster-wrap"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <img
                src={festival.posterUrl}
                alt={`${festival.name} 공식 포스터`}
                className="festival-hero__poster"
              />
            </motion.div>
          )}

          <motion.div
            className="festival-hero__brand"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.04 }}
          >
            {!festival.posterUrl && festival.logoUrl && (
              <img src={festival.logoUrl} alt="" className="festival-hero__mark" />
            )}
            <h1 className="festival-hero__name">{festival.name}</h1>
          </motion.div>
          <p className="festival-hero__tagline" style={{ color: sigTextColor }}>
            {festival.tagline || festival.description}
          </p>
          {festival.tagline && (
            <p className="festival-hero__desc" style={{ color: sigMutedColor }}>
              {festival.description}
            </p>
          )}
          <div className="festival-hero__meta" style={{ color: sigMutedColor }}>
            {mapUrl ? (
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="festival-hero__meta-link"
                style={{ color: sigMutedColor }}
              >
                {festival.location}
              </a>
            ) : (
              <span>{festival.location}</span>
            )}
            <span>{festival.startDate} ~ {festival.endDate}</span>
          </div>
          {festival.websiteUrl && (
            <div className="festival-hero__links">
              <a
                href={festival.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="festival-hero__link"
                style={{ color: sigTextColor, borderColor: 'currentColor' }}
              >
                공식 홈페이지
              </a>
            </div>
          )}
        </div>
      </section>

      <p className="festival-mobile-beta-link container">
        <Link to={`/festival/${id}/m`}>모바일 전용 화면 체험 →</Link>
      </p>

      <section className="festival-body">
        <div className="container festival-layout">
          <div className="festival-main festival-desktop-only">
            {festival.lineupStage === 'stage1_all' && (
              <div className="lineup-block">
                <h3>공개된 아티스트 라인업 ({stage1Artists.length}팀)</h3>
                <p>아티스트를 눌러 대표곡을 들어 보세요. ☆로 내 라인업에 담을 수 있어요.</p>
                <div className="artist-chip-row">
                  {stage1Artists.map((artist) => {
                    const isSelected = selectedArtist?.id === artist.id
                    const ready = playlistReady.has(artist.id)
                    const inLineup = myLineup.has(artist.id)
                    return (
                      <div
                        key={artist.id}
                        className={`artist-chip-group${isSelected ? ' is-selected' : ''}${inLineup ? ' is-in-lineup' : ''}`}
                      >
                        <button
                          type="button"
                          onClick={() => handleDesktopArtistSelect(artist.id)}
                          className={`artist-chip${isSelected ? ' is-selected' : ''}`}
                          style={{ opacity: ready ? 1 : 0.7 }}
                          title={ready ? '대표곡 준비 완료' : '대표곡 준비 중'}
                        >
                          {officialArtistName(artist)}
                        </button>
                        <MyLineupPickButton
                          active={inLineup}
                          className="lineup-pick-btn--chip"
                          onToggle={() => myLineup.toggle(artist.id)}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {festival.lineupStage === 'stage2_daily' && (
              <div>
                <DayTabs
                  days={festival.lineup}
                  activeIndex={activeDayIndex}
                  onChange={changeDay}
                />
                <h3 className="lineup-block__subhead">일별 라인업 아티스트</h3>
                <div className="artist-card-grid">
                  {activeDayArtists.map((artist) => {
                    const isSelected = selectedArtist?.id === artist.id
                    const ready = playlistReady.has(artist.id)
                    const inLineup = myLineup.has(artist.id)
                    return (
                      <div
                        key={artist.id}
                        className={`artist-card-wrap${isSelected ? ' is-selected' : ''}${inLineup ? ' is-in-lineup' : ''}`}
                      >
                        <button
                          type="button"
                          onClick={() => handleDesktopArtistSelect(artist.id)}
                          className={`artist-card${isSelected ? ' is-selected' : ''}`}
                        >
                          <span className="artist-card__name">{officialArtistName(artist)}</span>
                          {artist.country && (
                            <span className="artist-card__country">{artist.country}</span>
                          )}
                          <span className={`artist-card__status${ready ? ' is-ready' : ''}`}>
                            {ready ? '대표곡 준비 완료' : '대표곡 준비 중'}
                          </span>
                        </button>
                        <MyLineupPickButton
                          active={inLineup}
                          className="lineup-pick-btn--card"
                          onToggle={() => myLineup.toggle(artist.id)}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {festival.lineupStage === 'stage3_timetable' && (
              <div>
                <DayTabs
                  days={festival.lineup}
                  activeIndex={activeDayIndex}
                  onChange={changeDay}
                />
                <div className="timetable-scroll">
                  <TimetableGrid
                    stages={activeDay?.stages || []}
                    slots={activeDay?.slots || []}
                    artists={artists}
                    stageStyles={festival.stageStyles}
                    selectedArtistId={selectedArtist?.id}
                    onSlotClick={handleDesktopArtistSelect}
                    myLineupArtistIds={filterMyLineupForDay(myLineup.artistIds, activeDay)}
                    isInMyLineup={myLineup.has}
                    onToggleMyLineup={myLineup.toggle}
                  />
                </div>
              </div>
            )}
          </div>

          <aside className="festival-aside festival-aside--desktop">
            <ArtistPlaylistPanel
              {...panelProps}
              onCloseArtist={selectedArtist ? clearSelectedArtist : undefined}
              artistCloseLabel="닫기"
            />
          </aside>
        </div>

        <div className="container">
          <FestivalMobileExperience
            festival={festival}
            artists={artists}
            activeDayIndex={activeDayIndex}
            onDayChange={changeDay}
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
      </section>
    </div>
  )
}

export default function FestivalDetail() {
  const { id } = useParams<{ id: string }>()

  const [festival, setFestival] = useState<Festival | null>(null)
  const [artists, setArtists] = useState<Artist[]>([])
  const [playlistReady, setPlaylistReady] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    if (!id) {
      setLoading(false)
      return
    }

    setLoading(true)

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
        console.error('FestivalDetail load failed:', err)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [id])

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

  return (
    <FestivalDetailLoaded
      id={id}
      festival={festival}
      artists={artists}
      playlistReady={playlistReady}
    />
  )
}
