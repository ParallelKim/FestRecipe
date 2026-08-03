import type { Artist, DayLineup, Festival } from '../types'
import type { BundledAnonymousPlaylist } from '../lib/bundlePlaylist'
import { bundleNoticeCopy } from '../lib/bundlePlaylist'
import DayTabs from './DayTabs'
import PlaylistHubActions from './PlaylistHubActions'
import MyLineupPanel from './MyLineupPanel'
import WallpaperMobileSection from './WallpaperMobileSection'
import { Button } from '@/components/ui/button'

interface FestivalListenMobilePanelProps {
  festival: Festival
  activeDayIndex: number
  onDayChange: (index: number) => void
  activeDay?: DayLineup
  artists: Artist[]
  myLineupIds: string[]
  playlistReady: Set<string>
  bundleLoading: 'day' | 'festival' | 'custom' | null
  bundleNotice: BundledAnonymousPlaylist | null
  onOpenBundled: (kind: 'day' | 'festival', artistIds: string[], title: string) => void
  onToggleArtist: (artistId: string) => void
  onSelectArtist?: (artistId: string) => void
  onClear: () => void
  onPlayYouTube: () => void
  onDismissBundleNotice?: () => void
}

/** 모바일 「듣기·라인업」 탭 본문 */
export default function FestivalListenMobilePanel({
  festival,
  activeDayIndex,
  onDayChange,
  activeDay,
  artists,
  myLineupIds,
  playlistReady,
  bundleLoading,
  bundleNotice,
  onOpenBundled,
  onToggleArtist,
  onSelectArtist,
  onClear,
  onPlayYouTube,
  onDismissBundleNotice,
}: FestivalListenMobilePanelProps) {
  const notice = bundleNotice ? bundleNoticeCopy(bundleNotice) : null
  const showDayTabs = festival.lineup.length > 1

  return (
    <div className="festival-mobile-listen-panel">
      <p className="festival-mobile-listen-panel__intro">
        날짜·전체 대표곡을 모아 들고, 담은 라인업과 배경화면을 여기서 관리해요.
      </p>

      {showDayTabs && (
        <DayTabs
          days={festival.lineup}
          activeIndex={activeDayIndex}
          onChange={onDayChange}
        />
      )}

      <PlaylistHubActions
        festival={festival}
        activeDay={activeDay}
        playlistReady={playlistReady}
        bundleLoading={bundleLoading}
        onOpenBundled={onOpenBundled}
        variant="stack"
        showMyPlaylist={false}
      />

      {notice && (
        <div
          className={`playlist-bundle-notice${bundleNotice?.truncated || bundleNotice?.thinCoverage ? ' is-warn' : ''}`}
          role="status"
        >
          <h4 className="playlist-bundle-notice__title">{notice.title}</h4>
          <p className="playlist-bundle-notice__body">{notice.body}</p>
          {onDismissBundleNotice && (
            <Button
              variant="outline"
              className="playlist-bundle-notice__dismiss"
              onClick={onDismissBundleNotice}
            >
              확인
            </Button>
          )}
        </div>
      )}

      <MyLineupPanel
        festival={festival}
        activeDay={activeDay}
        artists={artists}
        myLineupIds={myLineupIds}
        playlistReady={playlistReady}
        bundleLoading={bundleLoading === 'custom'}
        bundleNotice={null}
        onToggleArtist={onToggleArtist}
        onSelectArtist={onSelectArtist}
        onClear={onClear}
        onPlayYouTube={onPlayYouTube}
        showWallpaper={false}
      />

      <WallpaperMobileSection
        festival={festival}
        activeDay={activeDay}
        artists={artists}
        myLineupIds={myLineupIds}
        embedded
      />
    </div>
  )
}
