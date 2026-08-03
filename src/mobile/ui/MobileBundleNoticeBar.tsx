import type { MobileBundleNotice } from '../view/types'

export default function MobileBundleNoticeBar({
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
