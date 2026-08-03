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
import FestivalMobileTabBar from '../components/FestivalMobileTabBar'
import FestivalListenMobilePanel from '../components/FestivalListenMobilePanel'
import PlaylistMobileHint from '../components/PlaylistMobileHint'
import ArtistMobileSheet from '../components/ArtistMobileSheet'
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
import { Button } from '@/components/ui/button'
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
  const [mobileFestivalTab, setMobileFestivalTab] = useState<'schedule' | 'listen'>('schedule')
  const [artistSheetOpen, setArtistSheetOpen] = useState(false)
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

  // 활성 일자 플레이리스트 프리페치 — 유휴 시간에 캐시를 채워 슬롯 선택 지연 제거
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

  if (!festival) {
    return (
      <div className="container festival-missing">
        <h2 className="text-title-lg">페스티벌을 찾을 수 없어요.</h2>
        <p className="text-body text-muted">주소가 잘못되었거나 아직 준비 중인 페스티벌이에요.</p>
        <Button render={<Link to="/" />} nativeButton={false}>홈으로 돌아가기</Button>
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

  const openArtistInSheet = (artistId: string) => {
    const artist = artistMap.get(artistId)
    if (!artist) return
    setSelectedArtist(artist)
    setArtistSheetOpen(true)
    setBundleNotice(null)
    blurAfterTap(document.activeElement)
  }

  const handleArtistSelect = (artistId: string) => {
    openArtistInSheet(artistId)
  }

  const handleArtistSelectFromLineup = (artistId: string) => {
    openArtistInSheet(artistId)
  }

  const clearSelectedArtist = () => {
    setSelectedArtist(null)
    setBundleNotice(null)
  }

  const closeArtistSheet = () => {
    clearSelectedArtist()
    setArtistSheetOpen(false)
  }

  const openMyLineupEditor = () => {
    setShowMyLineupEditor(true)
  }

  const changeMobileFestivalTab = (tab: 'schedule' | 'listen') => {
    setMobileFestivalTab(tab)
    if (tab === 'listen') {
      setArtistSheetOpen(false)
      setSelectedArtist(null)
    }
  }

  const openListenTabFromArtist = () => {
    closeArtistSheet()
    requestAnimationFrame(() => setMobileFestivalTab('listen'))
  }

  const changeDay = (idx: number) => {
    setActiveDayIndex(idx)
    setSelectedArtist(null)
    setShowMyLineupEditor(false)
    setBundleNotice(null)
    setArtistSheetOpen(false)
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
        setArtistSheetOpen(false)
        setMobileFestivalTab('listen')
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

  const openMyLineupPlaylist = async () => {
    const onDayIds = filterMyLineupForDay(myLineup.artistIds, activeDay)
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
        setSelectedArtist(null)
        setArtistSheetOpen(false)
        setMobileFestivalTab('listen')
      } else {
        setBundleNotice(null)
      }

      window.open(url, '_blank', 'noopener,noreferrer')
    } finally {
      setBundleLoading(null)
    }
  }

  const clearMyLineupOnDay = () => {
    const onDay = artistIdsOnDay(activeDay)
    if (onDay.size === 0) return
    myLineup.setArtistIds(myLineup.artistIds.filter((id) => !onDay.has(id)))
  }

  const listenPanelProps = {
    festival,
    activeDayIndex,
    onDayChange: changeDay,
    activeDay,
    artists,
    myLineupIds: myLineup.artistIds,
    playlistReady,
    bundleLoading,
    bundleNotice,
    onOpenBundled: openBundledPlaylist,
    onToggleArtist: myLineup.toggle,
    onSelectArtist: handleArtistSelectFromLineup,
    onClear: clearMyLineupOnDay,
    onPlayYouTube: openMyLineupPlaylist,
    onDismissBundleNotice: () => setBundleNotice(null),
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
    onSelectArtistFromLineup: handleArtistSelectFromLineup,
    onBackFromMyLineup: () => setShowMyLineupEditor(false),
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
          <div className={`festival-main festival-main--tab-${mobileFestivalTab}`}>
            {festival.lineupStage === 'stage1_all' && (
              <>
                <div className="festival-mobile-schedule-panel lineup-block">
                  <PlaylistMobileHint festival={festival} />
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
                          onClick={() => handleArtistSelect(artist.id)}
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
                <FestivalListenMobilePanel {...listenPanelProps} />
              </>
            )}

            {festival.lineupStage === 'stage2_daily' && (
              <>
                <div className="festival-mobile-schedule-panel">
                <DayTabs
                  days={festival.lineup}
                  activeIndex={activeDayIndex}
                  onChange={changeDay}
                />
                <PlaylistMobileHint festival={festival} />
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
                          onClick={() => handleArtistSelect(artist.id)}
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
                <FestivalListenMobilePanel {...listenPanelProps} />
              </>
            )}

            {festival.lineupStage === 'stage3_timetable' && (
              <>
                <div className="festival-mobile-schedule-panel">
                <DayTabs
                  days={festival.lineup}
                  activeIndex={activeDayIndex}
                  onChange={changeDay}
                />
                <PlaylistMobileHint festival={festival} />
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
                <FestivalListenMobilePanel {...listenPanelProps} />
              </>
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
      </section>

      <FestivalMobileTabBar
        active={mobileFestivalTab}
        onChange={changeMobileFestivalTab}
        hidden={artistSheetOpen}
        lineupCount={myLineupOnDayCount}
        dayLabel={activeDay?.dayLabel}
      />

      <ArtistMobileSheet
        open={artistSheetOpen && !!selectedArtist}
        onClose={closeArtistSheet}
        onOpenMyLineup={openListenTabFromArtist}
        myLineupCount={myLineupOnDayCount}
        festival={festival}
        activeDay={activeDay}
        artists={artists}
        selectedArtist={selectedArtist}
        artistPlaylist={artistPlaylist || null}
        playlistLoading={playlistLoading}
        playlistReady={playlistReady}
        bundleLoading={bundleLoading}
        headlinerIds={headlinerArtistIds(activeDay?.slots)}
        onToggleMyLineupFromArtist={myLineup.toggle}
        isInMyLineup={myLineup.has}
      />
    </div>
  )
}
