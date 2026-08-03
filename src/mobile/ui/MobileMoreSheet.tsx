import type { MobileBundleNotice } from '../view/types'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'

interface MobileMoreSheetProps {
  open: boolean
  dayReady: boolean
  festivalReady: boolean
  wallpaperAvailable: boolean
  loadingDay: boolean
  loadingFestival: boolean
  onClose: () => void
  onListenDay: () => void
  onListenFestival: () => void
  onWallpaper: () => void
}

export default function MobileMoreSheet({
  open,
  dayReady,
  festivalReady,
  wallpaperAvailable,
  loadingDay,
  loadingFestival,
  onClose,
  onListenDay,
  onListenFestival,
  onWallpaper,
}: MobileMoreSheetProps) {
  return (
    <Sheet open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="m-sheet mx-auto gap-0 data-[side=bottom]:border-t-0"
      >
        <SheetTitle className="sr-only">더보기</SheetTitle>
        <div className="m-sheet__handle" aria-hidden="true" />

        <div className="m-sheet__toolbar">
          <button type="button" className="m-sheet__ghost" onClick={onClose}>
            닫기
          </button>
        </div>

        <h2 className="m-sheet__title">모아 듣기</h2>
        <p className="m-sheet__meta">선택한 날짜나 페스티벌 전체 대표곡을 YouTube로 열어요.</p>

        <div className="m-action-list">
          <button
            type="button"
            className="m-action-list__btn"
            disabled={!dayReady || loadingDay || loadingFestival}
            onClick={onListenDay}
          >
            <span className="m-action-list__label">이 날</span>
            <span className="m-action-list__hint">
              {loadingDay ? '여는 중…' : dayReady ? '대표곡 묶음' : '준비 중'}
            </span>
          </button>
          <button
            type="button"
            className="m-action-list__btn"
            disabled={!festivalReady || loadingDay || loadingFestival}
            onClick={onListenFestival}
          >
            <span className="m-action-list__label">페스티벌 전체</span>
            <span className="m-action-list__hint">
              {loadingFestival ? '여는 중…' : festivalReady ? '전체 라인업' : '준비 중'}
            </span>
          </button>
        </div>

        {wallpaperAvailable && (
          <>
            <h3 className="m-sheet__subtitle">배경화면</h3>
            <button type="button" className="m-action-list__btn" onClick={onWallpaper}>
              <span className="m-action-list__label">배경화면 만들기</span>
              <span className="m-action-list__hint">타임테이블 PNG</span>
            </button>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

export function MobileBundleNoticeBar({
  notice,
  onDismiss,
}: {
  notice: MobileBundleNotice
  onDismiss: () => void
}) {
  return (
    <div className={`m-notice${notice.warn ? ' is-warn' : ''}`} role="status">
      <p className="m-notice__title">{notice.title}</p>
      <p className="m-notice__body">{notice.body}</p>
      <button type="button" className="m-notice__dismiss" onClick={onDismiss}>
        확인
      </button>
    </div>
  )
}
