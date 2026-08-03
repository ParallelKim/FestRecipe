import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MobileLineupButtonProps {
  inLineup: boolean
  onToggle: () => void
  /** ☆/★만 표시 (리스트·타임테이블) */
  compact?: boolean
  className?: string
}

/** 내 라인업 담기 — 모바일 전역 동일 스타일·상태 표현 */
export function MobileLineupButton({
  inLineup,
  onToggle,
  compact,
  className,
}: MobileLineupButtonProps) {
  return (
    <Button
      type="button"
      variant={inLineup ? 'secondary' : 'outline'}
      size={compact ? 'icon-lg' : 'default'}
      className={cn(
        'shrink-0 font-bold',
        compact && 'text-lg',
        inLineup && 'border-primary bg-primary/10 text-foreground',
        className,
      )}
      aria-pressed={inLineup}
      aria-label={inLineup ? '내 라인업에서 빼기' : '내 라인업에 담기'}
      onClick={onToggle}
    >
      {compact ? (inLineup ? '★' : '☆') : inLineup ? '★ 담김' : '☆ 담기'}
    </Button>
  )
}
