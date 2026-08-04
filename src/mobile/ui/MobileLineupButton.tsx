import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type LineupButtonTone = 'default' | 'on-accent' | 'on-primary'

interface MobileLineupButtonProps {
  inLineup: boolean
  onToggle: () => void
  /** ☆/★만 표시 (리스트·타임테이블) */
  compact?: boolean
  /** ButtonGroup 내 인접 버튼 — 모서리·테두리 통일 */
  grouped?: boolean
  /** 배경 맥락에 맞는 색 (타임테이블 액센트 / primary 행) */
  tone?: LineupButtonTone
  className?: string
}

function toneClass(tone: LineupButtonTone, inLineup: boolean): string {
  switch (tone) {
    case 'on-accent':
      return inLineup
        ? 'border-white/40 bg-white/20 text-white hover:bg-white/30 hover:text-white'
        : 'border-border/70 bg-white/95 text-muted-foreground shadow-sm hover:bg-white'
    case 'on-primary':
      return cn(
        'border-0 border-l border-primary-foreground/25 bg-transparent text-primary-foreground shadow-none hover:bg-primary/90 active:bg-primary/90',
        inLineup && 'bg-primary-foreground/15',
      )
    default:
      return inLineup ? 'border-primary bg-primary/10 text-foreground' : ''
  }
}

/** 내 라인업 담기 — 모바일 전역 동일 스타일·상태 표현 */
export function MobileLineupButton({
  inLineup,
  onToggle,
  compact,
  grouped,
  tone = 'default',
  className,
}: MobileLineupButtonProps) {
  const onPrimary = tone === 'on-primary'

  return (
    <Button
      type="button"
      variant={
        onPrimary ? 'default' : inLineup ? 'secondary' : 'outline'
      }
      size={compact ? 'icon-lg' : 'default'}
      className={cn(
        'shrink-0 font-bold',
        compact && 'text-lg',
        grouped && 'rounded-none',
        toneClass(tone, inLineup),
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
