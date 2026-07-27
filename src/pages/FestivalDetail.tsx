import { useState, useEffect } from 'react'
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
import PlaylistMobileDock from '../components/PlaylistMobileDock'
import PlaylistHubActions from '../components/PlaylistHubActions'
import { buildWatchVideosUrl } from '../lib/youtubePlaylist'
import { headlinerArtistIds } from '../lib/headliners'
import { officialArtistName } from '../lib/artistOfficialName'
import { buildFestivalMapUrl } from '../lib/festivalLinks'
import {
  artistInputsFromPlaylists,
  buildBundledAnonymousPlaylist,
  type BundledAnonymousPlaylist,
} from '../lib/bundlePlaylist'
import {
  orderArtistIdsForDayBundle,
  orderArtistIdsForFestivalBundle,
} from '../lib/playlistBundleOrder'
import { blurAfterTap } from '../lib/blurAfterTap'
import { festivalLineupHighlightFallback } from '../lib/stageTheme'
import { filterMyLineupForDay, artistIdsOnDay } from '../lib/lineupDay'
import { useMyLineup } from '../hooks/useMyLineup'
import { playlistTitleForCustom } from '../lib/youtubePlaylist'

export default function FestivalDetail() {
  const { id } = useParams<{ id: string }>()

  const [festival, setFestival] = useState<Festival | null>(null)
  const [artists, setArtists] = useState<Artist[]>([])
  const [playlistReady, setPlaylistReady] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const [activeDayIndex, setActiveDayIndex] = useState(0)
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null)
  const [artistPlaylist, setArtistPlaylist] = useState<ArtistPlaylist | null>(null)
  const [playlistLoading, setPlaylistLoading] = useState(false)
  const [bundleLoading, setBundleLoading] = useState<'day' | 'festival' | 'custom' | null>(null)
  const [playlistSheetOpen, setPlaylistSheetOpen] = useState(false)
  const [showMyLineupEditor, setShowMyLineupEditor] = useState(false)
  const [bundleNotice, setBundleNotice] = useState<BundledAnonymousPlaylist | null>(null)

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
    if (!playlistSheetOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPlaylistSheetOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [playlistSheetOpen])

  if (loading) {
    return <LoadingState label="페스티벌 정보를 불러오는 중..." minHeight="100vh" />
  }

  if (!festival) {
    return (
      <div className="container festival-missing">
        <h2 className="text-title-lg">페스티벌을 찾을 수 없습니다.</h2>
        <p className="text-body text-muted">요청하신 페스티벌 정보가 없거나 준비 중입니다.</p>
        <Link to="/" className="btn-primary" style={{ textDecoration: 'none' }}>홈으로 돌아가기</Link>
      </div>
    )
  }

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

  const activeDay = festival.lineup[activeDayIndex]
  const myLineupOnDayCount = filterMyLineupForDay(myLineup.artistIds, activeDay).length
  const artistMap = new Map(artists.map((a) => [a.id, a]))
  const mapUrl = buildFestivalMapUrl(festival)

  const stage1Artists = festival.allArtists
    .map((artistId) => artistMap.get(artistId))
    .filter((a): a is Artist => !!a)

  const activeDayArtists = (activeDay?.artists || [])
    .map((artistId) => artistMap.get(artistId))
    .filter((a): a is Artist => !!a)

  const handleArtistSelect = (artistId: string) => {
    const artist = artistMap.get(artistId)
    if (!artist) return
    setSelectedArtist(artist)
    setShowMyLineupEditor(false)
    setBundleNotice(null)
    setPlaylistSheetOpen(true)
    blurAfterTap(document.activeElement)
  }

  const clearArtist = () => {
    setSelectedArtist(null)
    setShowMyLineupEditor(false)
    setBundleNotice(null)
    setPlaylistSheetOpen(false)
  }

  const changeDay = (idx: number) => {
    setActiveDayIndex(idx)
    setSelectedArtist(null)
    setShowMyLineupEditor(false)
    setBundleNotice(null)
    setPlaylistSheetOpen(false)
  }

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
        : orderArtistIdsForFestivalBundle(ids, festival?.lineup)

    setBundleLoading(kind)
    setShowMyLineupEditor(false)
    try {
      const playlists = await Promise.all(
        orderedIds.map((aid) => FestivalService.getPlaylistForArtist(aid)),
      )
      // TODO(day-playlist): 장기적으로는 대표 YouTube 계정 + Data API 고정 PL로 교체.
      // 단기: 티어 곡 수(5/4/3 → 4/3/2 → 3/2/1) 다운그레이드로 50곡 캡에 맞춤.
      const bundle = buildBundledAnonymousPlaylist(artistInputsFromPlaylists(playlists))
      if (!bundle) return

      const url = buildWatchVideosUrl(bundle.videoIds, title)
      if (!url) return

      if (bundle.downgraded || bundle.truncated || bundle.thinCoverage) {
        setBundleNotice(bundle)
        setSelectedArtist(null)
        setPlaylistSheetOpen(true)
      } else {
        setBundleNotice(null)
      }

      window.open(url, '_blank', 'noopener,noreferrer')
    } finally {
      setBundleLoading(null)
    }
  }

  const artistCount = festival.lineupStage === 'stage1_all'
    ? (festival.allArtists?.length || 0)
    : festival.lineup.reduce((acc, day) => {
        if (day.artists?.length) return acc + day.artists.length
        if (day.slots?.length) return acc + day.slots.length
        return acc
      }, 0)

  const openPlaylistHub = () => {
    setSelectedArtist(null)
    setShowMyLineupEditor(false)
    setBundleNotice(null)
    setPlaylistSheetOpen(true)
  }

  const openMyLineupEditor = () => {
    setSelectedArtist(null)
    setBundleNotice(null)
    setShowMyLineupEditor(true)
    setPlaylistSheetOpen(true)
  }

  const openMyLineupPlaylist = async () => {
    const onDayIds = filterMyLineupForDay(myLineup.artistIds, activeDay)
    const ids = onDayIds.filter((aid) => playlistReady.has(aid))
    if (ids.length === 0) return

    const orderedIds =
      festival.lineupStage === 'stage3_timetable' && activeDay?.slots?.length
        ? orderArtistIdsForDayBundle(ids, activeDay.slots)
        : orderArtistIdsForFestivalBundle(ids, festival.lineup)
    setBundleLoading('custom')
    setShowMyLineupEditor(true)
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
        setSelectedArtist(null)
        setPlaylistSheetOpen(true)
      } else {
        setBundleNotice(null)
      }

      window.open(url, '_blank', 'noopener,noreferrer')
    } finally {
      setBundleLoading(null)
    }
  }

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
    onOpenMyPlaylist: openMyLineupEditor,
    myLineupCount: myLineupOnDayCount,
    showMyLineupEditor,
    myLineupIds: myLineup.artistIds,
    onToggleMyLineup: myLineup.toggle,
    onClearMyLineup: () => {
      const onDay = artistIdsOnDay(activeDay)
      if (onDay.size === 0) return
      myLineup.setArtistIds(myLineup.artistIds.filter((id) => !onDay.has(id)))
    },
    onPlayMyLineup: openMyLineupPlaylist,
    onToggleMyLineupFromArtist: myLineup.toggle,
    isInMyLineup: myLineup.has,
    bundleNotice,
    onDismissBundleNotice: () => setBundleNotice(null),
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
              <img
                src={festival.logoUrl}
                alt=""
                className="festival-hero__mark"
              />
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

      <section className="festival-body">
        <div className="container festival-layout">
          <div className="festival-main">
            {festival.lineupStage === 'stage1_all' && (
              <div className="lineup-block">
                <div className="playlist-hub-slot playlist-hub-slot--mobile">
                  <PlaylistHubActions
                    festival={festival}
                    activeDay={activeDay}
                    playlistReady={playlistReady}
                    bundleLoading={bundleLoading}
                    onOpenBundled={openBundledPlaylist}
                    onOpenMyPlaylist={openMyLineupEditor}
                    myLineupCount={myLineupOnDayCount}
                    variant="bar"
                  />
                </div>
                <h3>공개된 아티스트 라인업 ({stage1Artists.length}팀)</h3>
                <p>아티스트를 선택하면 대표곡을 듣고, ☆로 내 라인업에 담을 수 있습니다.</p>
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
                          onClick={() => handleArtistSelect(artist.id)}
                          className={`artist-chip${isSelected ? ' is-selected' : ''}`}
                          style={{ opacity: ready ? 1 : 0.7 }}
                          title={ready ? '플레이리스트 준비됨' : '플레이리스트 준비 중'}
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
                <div className="playlist-hub-slot playlist-hub-slot--mobile">
                  <PlaylistHubActions
                    festival={festival}
                    activeDay={activeDay}
                    playlistReady={playlistReady}
                    bundleLoading={bundleLoading}
                    onOpenBundled={openBundledPlaylist}
                    onOpenMyPlaylist={openMyLineupEditor}
                    myLineupCount={myLineupOnDayCount}
                    variant="bar"
                  />
                </div>
                <h3 className="lineup-block__subhead">일별 라인업 아티스트</h3>
                <p className="lineup-block__hint">카드를 눌러 대표곡을 듣고, ☆로 내 라인업에 담을 수 있습니다.</p>
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
                          onClick={() => handleArtistSelect(artist.id)}
                          className={`artist-card${isSelected ? ' is-selected' : ''}`}
                        >
                          <span className="artist-card__name">{officialArtistName(artist)}</span>
                          {artist.country && (
                            <span className="artist-card__country">{artist.country}</span>
                          )}
                          <span className={`artist-card__status${ready ? ' is-ready' : ''}`}>
                            {ready ? '플레이리스트 준비됨' : '준비 중'}
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
                <div className="playlist-hub-slot playlist-hub-slot--mobile">
                  <PlaylistHubActions
                    festival={festival}
                    activeDay={activeDay}
                    playlistReady={playlistReady}
                    bundleLoading={bundleLoading}
                    onOpenBundled={openBundledPlaylist}
                    onOpenMyPlaylist={openMyLineupEditor}
                    myLineupCount={myLineupOnDayCount}
                    variant="bar"
                  />
                </div>
                {myLineupOnDayCount > 0 && (
                  <p className="lineup-block__lineup-status" role="status">
                    {activeDay?.dayLabel} 내 라인업 <strong>{myLineupOnDayCount}</strong>팀 · 타임테이블 ☆ 강조
                  </p>
                )}
                <p className="lineup-block__hint">슬롯을 눌러 대표곡을 듣고, ☆로 내 라인업에 담을 수 있습니다.</p>
                <div className="timetable-legend" aria-hidden="true">
                  <span className="timetable-legend__item">
                    <span className="timetable-legend__swatch timetable-legend__swatch--selected" />
                    지금 선택
                  </span>
                  <span className="timetable-legend__item">
                    <span className="timetable-legend__swatch timetable-legend__swatch--lineup" />
                    내 라인업
                  </span>
                </div>
                <div className="timetable-scroll">
                  <TimetableGrid
                    stages={activeDay?.stages || []}
                    slots={activeDay?.slots || []}
                    artists={artists}
                    stageStyles={festival.stageStyles}
                    selectedArtistId={selectedArtist?.id}
                    onSlotClick={handleArtistSelect}
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
              onCloseArtist={selectedArtist ? clearArtist : undefined}
            />
          </aside>
        </div>
      </section>

      <PlaylistMobileDock
        open={playlistSheetOpen}
        onOpen={openPlaylistHub}
        onClose={() => {
          setPlaylistSheetOpen(false)
          setShowMyLineupEditor(false)
          setBundleNotice(null)
        }}
        onCloseArtist={() => setSelectedArtist(null)}
        {...panelProps}
      />
    </div>
  )
}
