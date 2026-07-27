import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FestivalService } from '../services/festivals'
import type { Festival, Artist, ArtistPlaylist } from '../types'
import TimetableGrid from '../components/TimetableGrid'
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
  const [bundleLoading, setBundleLoading] = useState<'day' | 'festival' | null>(null)
  const [playlistSheetOpen, setPlaylistSheetOpen] = useState(false)
  const [showMyPlaylistWarning, setShowMyPlaylistWarning] = useState(false)

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
    setShowMyPlaylistWarning(false)
    setPlaylistSheetOpen(true)
  }

  const clearArtist = () => {
    setSelectedArtist(null)
    setShowMyPlaylistWarning(false)
    setPlaylistSheetOpen(false)
  }

  const changeDay = (idx: number) => {
    setActiveDayIndex(idx)
    setSelectedArtist(null)
    setShowMyPlaylistWarning(false)
    setPlaylistSheetOpen(false)
  }

  const openBundledPlaylist = async (
    kind: 'day' | 'festival',
    artistIds: string[],
    title: string,
  ) => {
    const ids = artistIds.filter((aid) => playlistReady.has(aid))
    if (ids.length === 0) return

    setBundleLoading(kind)
    try {
      const playlists = await Promise.all(
        ids.map((aid) => FestivalService.getPlaylistForArtist(aid)),
      )
      const videoIds = playlists.flatMap((pl) => (pl?.tracks || []).map((t) => t.videoId))
      // TODO(day-playlist): 요일/전체는 watch_videos 50곡 캡에 걸린다.
      // 대표 YouTube 계정으로 Data API 플레이리스트를 미리 만들어 링크하는 방식으로 교체 예정.
      // 당분간 딥링크 현행 유지(앞 50곡만 재생).
      const url = buildWatchVideosUrl(videoIds, title)
      if (url) window.open(url, '_blank', 'noopener,noreferrer')
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
    setShowMyPlaylistWarning(false)
    setPlaylistSheetOpen(true)
  }

  const openMyPlaylistWithWarning = () => {
    setSelectedArtist(null)
    setShowMyPlaylistWarning(true)
    setPlaylistSheetOpen(true)
  }

  const panelProps = {
    festival,
    activeDay,
    selectedArtist,
    artistPlaylist: artistPlaylist || null,
    playlistLoading,
    playlistReady,
    bundleLoading,
    headlinerIds: headlinerArtistIds(activeDay?.slots),
    onOpenBundled: openBundledPlaylist,
    onOpenMyPlaylist: openMyPlaylistWithWarning,
    showMyPlaylistWarning,
    onDismissMyPlaylistWarning: () => setShowMyPlaylistWarning(false),
  }

  return (
    <div className="festival-detail">
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
          {(festival.websiteUrl || mapUrl) && (
            <div className="festival-hero__links">
              {festival.websiteUrl && (
                <a
                  href={festival.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="festival-hero__link"
                  style={{ color: sigTextColor, borderColor: 'currentColor' }}
                >
                  공식 홈페이지
                </a>
              )}
              {mapUrl && (
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="festival-hero__link"
                  style={{ color: sigTextColor, borderColor: 'currentColor' }}
                >
                  지도에서 보기
                </a>
              )}
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
                    onOpenMyPlaylist={openMyPlaylistWithWarning}
                    variant="bar"
                  />
                </div>
                <h3>공개된 아티스트 라인업 ({stage1Artists.length}팀)</h3>
                <p>아티스트를 선택하면 YouTube Music 인기 기반 대표곡 플레이리스트를 들을 수 있습니다.</p>
                <div className="artist-chip-row">
                  {stage1Artists.map((artist) => {
                    const isSelected = selectedArtist?.id === artist.id
                    const ready = playlistReady.has(artist.id)
                    return (
                      <button
                        key={artist.id}
                        type="button"
                        onClick={() => handleArtistSelect(artist.id)}
                        className={`artist-chip${isSelected ? ' is-selected' : ''}`}
                        style={{ opacity: ready ? 1 : 0.7 }}
                        title={ready ? '플레이리스트 준비됨' : '플레이리스트 준비 중'}
                      >
                        {officialArtistName(artist)}
                      </button>
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
                    onOpenMyPlaylist={openMyPlaylistWithWarning}
                    variant="bar"
                  />
                </div>
                <h3 className="lineup-block__subhead">일별 라인업 아티스트</h3>
                <div className="artist-card-grid">
                  {activeDayArtists.map((artist) => {
                    const isSelected = selectedArtist?.id === artist.id
                    const ready = playlistReady.has(artist.id)
                    return (
                      <button
                        key={artist.id}
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
                    onOpenMyPlaylist={openMyPlaylistWithWarning}
                    variant="bar"
                  />
                </div>
                <div className="timetable-scroll">
                  <TimetableGrid
                    stages={activeDay?.stages || []}
                    slots={activeDay?.slots || []}
                    artists={artists}
                    selectedArtistId={selectedArtist?.id}
                    onSlotClick={handleArtistSelect}
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
          setShowMyPlaylistWarning(false)
        }}
        onCloseArtist={() => setSelectedArtist(null)}
        {...panelProps}
      />
    </div>
  )
}
