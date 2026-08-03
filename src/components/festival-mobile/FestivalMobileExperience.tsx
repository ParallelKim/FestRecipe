import { useEffect, useState } from 'react'
import type { Artist, ArtistPlaylist, Festival } from '../../types'
import type { BundledAnonymousPlaylist } from '../../lib/bundlePlaylist'
import { bundleNoticeCopy } from '../../lib/bundlePlaylist'
import { blurAfterTap } from '../../lib/blurAfterTap'
import { filterMyLineupForDay } from '../../lib/lineupDay'
import { headlinerArtistIds } from '../../lib/headliners'
import { officialArtistName } from '../../lib/artistOfficialName'
import { FestivalService } from '../../services/festivals'
import DayTabs from '../DayTabs'
import TimetableGrid from '../TimetableGrid'
import MyLineupPickButton from '../MyLineupPickButton'
import PlaylistHubActions from '../PlaylistHubActions'
import MyLineupPanel from '../MyLineupPanel'
import WallpaperMobileSection from '../WallpaperMobileSection'
import { Button } from '@/components/ui/button'
import FestivalMobileArtistSheet from './FestivalMobileArtistSheet'
import './festival-mobile.css'

type MobileTab = 'schedule' | 'plan'

interface FestivalMobileExperienceProps {
  /** `/festival/:id/m` 전용 페이지 — 미디어쿼리 숨김 없이 항상 표시 */
  standalone?: boolean
  festival: Festival
  artists: Artist[]
  activeDayIndex: number
  onDayChange: (index: number) => void
  playlistReady: Set<string>
  bundleLoading: 'day' | 'festival' | 'custom' | null
  bundleNotice: BundledAnonymousPlaylist | null
  onOpenBundled: (kind: 'day' | 'festival', artistIds: string[], title: string) => void
  onPlayMyLineup: () => void
  onDismissBundleNotice: () => void
  myLineupIds: string[]
  onToggleLineup: (artistId: string) => void
  onClearLineupOnDay: () => void
}

/**
 * 모바일 페스티벌 본문 — 하단 탭 2개 + 아티스트 시트만.
 */
export default function FestivalMobileExperience({
  standalone = false,
  festival,
  artists,
  activeDayIndex,
  onDayChange,
  playlistReady,
  bundleLoading,
  bundleNotice,
  onOpenBundled,
  onPlayMyLineup,
  onDismissBundleNotice,
  myLineupIds,
  onToggleLineup,
  onClearLineupOnDay,
}: FestivalMobileExperienceProps) {
  const [tab, setTab] = useState<MobileTab>('schedule')
  const [sheetArtist, setSheetArtist] = useState<Artist | null>(null)
  const [artistPlaylist, setArtistPlaylist] = useState<ArtistPlaylist | null>(null)
  const [playlistLoading, setPlaylistLoading] = useState(false)

  const activeDay = festival.lineup[activeDayIndex]
  const artistMap = new Map(artists.map((a) => [a.id, a]))
  const myLineupOnDayCount = filterMyLineupForDay(myLineupIds, activeDay).length
  const sheetOpen = !!sheetArtist

  useEffect(() => {
    if (bundleNotice) setTab('plan')
  }, [bundleNotice])

  useEffect(() => {
    let active = true
    if (!sheetArtist) {
      setArtistPlaylist(null)
      setPlaylistLoading(false)
      return
    }

    setPlaylistLoading(true)
    FestivalService.getPlaylistForArtist(sheetArtist.id).then((playlist) => {
      if (active) {
        setArtistPlaylist(playlist || null)
        setPlaylistLoading(false)
      }
    })

    return () => {
      active = false
    }
  }, [sheetArtist])

  const openArtist = (artistId: string) => {
    const artist = artistMap.get(artistId)
    if (!artist) return
    setSheetArtist(artist)
    blurAfterTap(document.activeElement)
  }

  const closeArtist = () => setSheetArtist(null)

  const goToPlan = () => {
    closeArtist()
    requestAnimationFrame(() => setTab('plan'))
  }

  const changeTab = (next: MobileTab) => {
    setTab(next)
    if (next === 'plan') closeArtist()
  }

  const changeDay = (idx: number) => {
    onDayChange(idx)
    closeArtist()
  }

  const stage1Artists = festival.allArtists
    .map((id) => artistMap.get(id))
    .filter((a): a is Artist => !!a)

  const activeDayArtists = (activeDay?.artists || [])
    .map((id) => artistMap.get(id))
    .filter((a): a is Artist => !!a)

  const notice = bundleNotice ? bundleNoticeCopy(bundleNotice) : null
  const showDayTabs = festival.lineup.length > 1
  const dayLabel = activeDay?.dayLabel ?? '오늘'

  return (
    <div className={`fm-root${standalone ? ' fm-root--standalone' : ''}`}>
      <div className="fm-panel">
        {tab === 'schedule' && (
          <>
            {showDayTabs && (
              <DayTabs
                days={festival.lineup}
                activeIndex={activeDayIndex}
                onChange={changeDay}
              />
            )}

            {festival.lineupStage === 'stage3_timetable' && (
              <>
                <p className="fm-hint">
                  슬롯을 누르면 대표곡이 열려요. ☆로 담은 뒤 듣기·라인업 탭에서 모아 들을 수 있어요.
                </p>
                <div className="timetable-scroll">
                  <TimetableGrid
                    stages={activeDay?.stages || []}
                    slots={activeDay?.slots || []}
                    artists={artists}
                    stageStyles={festival.stageStyles}
                    selectedArtistId={sheetArtist?.id}
                    onSlotClick={openArtist}
                    myLineupArtistIds={filterMyLineupForDay(myLineupIds, activeDay)}
                    isInMyLineup={(id) => myLineupIds.includes(id)}
                    onToggleMyLineup={onToggleLineup}
                  />
                </div>
              </>
            )}

            {festival.lineupStage === 'stage1_all' && (
              <>
                <p className="fm-hint">아티스트를 눌러 대표곡을 들어 보세요. ☆로 내 라인업에 담을 수 있어요.</p>
                <h3 className="fm-section__title">공개 라인업 ({stage1Artists.length}팀)</h3>
                <div className="artist-chip-row">
                  {stage1Artists.map((artist) => {
                    const ready = playlistReady.has(artist.id)
                    const inLineup = myLineupIds.includes(artist.id)
                    return (
                      <div
                        key={artist.id}
                        className={`artist-chip-group${sheetArtist?.id === artist.id ? ' is-selected' : ''}${inLineup ? ' is-in-lineup' : ''}`}
                      >
                        <button
                          type="button"
                          onClick={() => openArtist(artist.id)}
                          className={`artist-chip${sheetArtist?.id === artist.id ? ' is-selected' : ''}`}
                          style={{ opacity: ready ? 1 : 0.7 }}
                          title={ready ? '대표곡 준비 완료' : '대표곡 준비 중'}
                        >
                          {officialArtistName(artist)}
                        </button>
                        <MyLineupPickButton
                          active={inLineup}
                          className="lineup-pick-btn--chip"
                          onToggle={() => onToggleLineup(artist.id)}
                        />
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {festival.lineupStage === 'stage2_daily' && (
              <>
                <p className="fm-hint">아티스트를 눌러 대표곡을 들어 보세요. ☆로 내 라인업에 담을 수 있어요.</p>
                <h3 className="fm-section__title">일별 라인업</h3>
                <div className="artist-card-grid">
                  {activeDayArtists.map((artist) => {
                    const ready = playlistReady.has(artist.id)
                    const inLineup = myLineupIds.includes(artist.id)
                    return (
                      <div
                        key={artist.id}
                        className={`artist-card-wrap${sheetArtist?.id === artist.id ? ' is-selected' : ''}${inLineup ? ' is-in-lineup' : ''}`}
                      >
                        <button
                          type="button"
                          onClick={() => openArtist(artist.id)}
                          className={`artist-card${sheetArtist?.id === artist.id ? ' is-selected' : ''}`}
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
                          onToggle={() => onToggleLineup(artist.id)}
                        />
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </>
        )}

        {tab === 'plan' && (
          <div className="fm-plan">
            {showDayTabs && (
              <DayTabs
                days={festival.lineup}
                activeIndex={activeDayIndex}
                onChange={changeDay}
              />
            )}

            <section className="fm-section">
              <h2 className="fm-section__title">대표곡 듣기</h2>
              <p className="fm-section__desc">선택한 날짜나 페스티벌 전체 대표곡을 YouTube로 모아 들어요.</p>
              <PlaylistHubActions
                festival={festival}
                activeDay={activeDay}
                playlistReady={playlistReady}
                bundleLoading={bundleLoading}
                onOpenBundled={onOpenBundled}
                variant="stack"
                showLabel={false}
                showMyPlaylist={false}
              />
            </section>

            {notice && (
              <div
                className={`playlist-bundle-notice fm-section${bundleNotice?.truncated || bundleNotice?.thinCoverage ? ' is-warn' : ''}`}
                role="status"
              >
                <h4 className="playlist-bundle-notice__title">{notice.title}</h4>
                <p className="playlist-bundle-notice__body">{notice.body}</p>
                <Button
                  variant="outline"
                  className="playlist-bundle-notice__dismiss"
                  onClick={onDismissBundleNotice}
                >
                  확인
                </Button>
              </div>
            )}

            <section className="fm-section">
              <MyLineupPanel
                festival={festival}
                activeDay={activeDay}
                artists={artists}
                myLineupIds={myLineupIds}
                playlistReady={playlistReady}
                bundleLoading={bundleLoading === 'custom'}
                bundleNotice={null}
                onToggleArtist={onToggleLineup}
                onSelectArtist={openArtist}
                onClear={onClearLineupOnDay}
                onPlayYouTube={onPlayMyLineup}
                showWallpaper={false}
              />
            </section>

            <section className="fm-section">
              <WallpaperMobileSection
                festival={festival}
                activeDay={activeDay}
                artists={artists}
                myLineupIds={myLineupIds}
                embedded
              />
            </section>
          </div>
        )}
      </div>

      {!sheetOpen && (
        <nav className="fm-tabs" aria-label="페스티벌 화면">
          <button
            type="button"
            className="fm-tabs__btn"
            aria-current={tab === 'schedule' ? 'page' : undefined}
            onClick={() => changeTab('schedule')}
          >
            <span className="fm-tabs__label">타임테이블</span>
            <span className="fm-tabs__meta">☆ 담기</span>
          </button>
          <button
            type="button"
            className="fm-tabs__btn"
            aria-current={tab === 'plan' ? 'page' : undefined}
            onClick={() => changeTab('plan')}
          >
            <span className="fm-tabs__label">듣기·라인업</span>
            <span className="fm-tabs__meta">
              {myLineupOnDayCount > 0 ? `${dayLabel} ${myLineupOnDayCount}팀` : '대표곡·목록'}
            </span>
          </button>
        </nav>
      )}

      <FestivalMobileArtistSheet
        open={sheetOpen}
        onClose={closeArtist}
        onOpenPlanTab={goToPlan}
        myLineupCount={myLineupOnDayCount}
        festival={festival}
        activeDay={activeDay}
        artists={artists}
        artist={sheetArtist}
        artistPlaylist={artistPlaylist}
        playlistLoading={playlistLoading}
        playlistReady={playlistReady}
        bundleLoading={bundleLoading}
        headlinerIds={headlinerArtistIds(activeDay?.slots)}
        onToggleLineup={onToggleLineup}
        isInLineup={(id) => myLineupIds.includes(id)}
      />
    </div>
  )
}
