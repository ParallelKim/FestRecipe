import ListenActionSheet from './ListenActionSheet'

interface PlaylistMobileDockProps {
  listenOpen: boolean
  onListenOpen: () => void
  onListenClose: () => void
  anySheetOpen: boolean
  festival: import('../types').Festival
  activeDay?: import('../types').DayLineup
  playlistReady: Set<string>
  bundleLoading: 'day' | 'festival' | 'custom' | null
  myLineupCount?: number
  onOpenBundled: (kind: 'day' | 'festival', artistIds: string[], title: string) => void
  onPlayMyLineup?: () => void
  bundleNotice?: import('../lib/bundlePlaylist').BundledAnonymousPlaylist | null
  onDismissBundleNotice?: () => void
}

/** 모바일 FAB — 짧은 듣기 액션 시트만 열기 (A안) */
export default function PlaylistMobileDock({
  listenOpen,
  onListenOpen,
  onListenClose,
  anySheetOpen,
  ...listenProps
}: PlaylistMobileDockProps) {
  return (
    <div className="playlist-dock">
      {!anySheetOpen && (
        <button
          type="button"
          className="playlist-fab"
          aria-label="대표곡 듣기"
          aria-expanded={listenOpen}
          onClick={onListenOpen}
        >
          <svg
            className="playlist-fab__glyph"
            viewBox="0 0 24 24"
            width="22"
            height="22"
            aria-hidden="true"
            focusable="false"
          >
            <rect x="2.5" y="5.5" width="11" height="2.2" rx="1.1" fill="currentColor" />
            <rect x="2.5" y="10.9" width="11" height="2.2" rx="1.1" fill="currentColor" />
            <rect x="2.5" y="16.3" width="8" height="2.2" rx="1.1" fill="currentColor" />
            <circle cx="17.2" cy="17" r="2.6" fill="currentColor" />
            <rect x="19" y="5" width="1.7" height="12.2" rx="0.6" fill="currentColor" />
            <path
              fill="currentColor"
              d="M20.7 5c.1 2.4 1.6 3.6 3.1 4v1.9c-2-.6-3.8-2.1-4.6-4.4V5h1.5z"
            />
          </svg>
          <span className="playlist-fab__label">듣기</span>
        </button>
      )}

      <ListenActionSheet
        open={listenOpen}
        onClose={onListenClose}
        {...listenProps}
      />
    </div>
  )
}
