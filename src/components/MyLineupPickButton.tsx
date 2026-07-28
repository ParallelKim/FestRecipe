import { blurAfterTap } from '../lib/blurAfterTap'

interface MyLineupPickButtonProps {
  active: boolean
  onToggle: () => void
  className?: string
  disabled?: boolean
}

/** 라인업·타임테이블에서 내 라인업 담기 (클릭 전파 차단) */
export default function MyLineupPickButton({
  active,
  onToggle,
  className = '',
  disabled = false,
}: MyLineupPickButtonProps) {
  return (
    <button
      type="button"
      className={`lineup-pick-btn${active ? ' is-on' : ''}${className ? ` ${className}` : ''}`}
      aria-pressed={active}
      aria-label={active ? '내 라인업에서 빼기' : '내 라인업에 담기'}
      title={active ? '내 라인업에서 빼기' : '내 라인업에 담기'}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
        blurAfterTap(e.currentTarget)
      }}
    >
      <span className="lineup-pick-btn__icon" aria-hidden="true">
        {active ? '★' : '☆'}
      </span>
    </button>
  )
}
