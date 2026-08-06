import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/layout/Container'
import { cn } from '@/lib/utils'
import { getFestivalSignatureTheme } from '@/lib/festivalSignature'
import type { FestivalEditionNeighbor } from '@/lib/festivalLifecycle'
import type { FestivalLifecycle } from '@/types'
import type { MobileFestivalView } from '../view/types'

function formatDateRange(start: string, end: string): string {
  const fmt = (iso: string) => {
    const [, m, d] = iso.split('-')
    return `${Number(m)}.${Number(d)}`
  }
  return `${fmt(start)} – ${fmt(end)}`
}

interface MobileFestivalHeroProps {
  festival: MobileFestivalView
  lifecycle: FestivalLifecycle
  previousEdition?: FestivalEditionNeighbor | null
  nextEdition?: FestivalEditionNeighbor | null
}

/**
 * 표준 상단 히어로 — 포스터는 cover 배경 + 그레디언트, 텍스트는 하단 스택.
 */
export default function MobileFestivalHero({
  festival,
  lifecycle,
  previousEdition = null,
  nextEdition = null,
}: MobileFestivalHeroProps) {
  const sig = getFestivalSignatureTheme(festival.signatureColor)
  const hasPoster = Boolean(festival.posterUrl)
  const isPast = lifecycle === 'past'
  const hasEditionNav = Boolean(previousEdition || nextEdition)

  return (
    <section
      className={cn(
        'relative overflow-hidden border-b border-border',
        hasPoster
          ? 'min-h-[min(38vh,280px)] max-h-[320px] text-white'
          : 'text-inherit',
      )}
      style={!hasPoster ? { backgroundColor: sig.bg, color: sig.text } : undefined}
    >
      {hasPoster && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${festival.posterUrl})` }}
            role="img"
            aria-label={`${festival.name} 공식 포스터`}
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-[rgba(8,10,14,0.78)] via-[rgba(8,10,14,0.52)] to-[rgba(8,10,14,0.92)]"
            aria-hidden="true"
          />
        </>
      )}

      <Container
        className={cn(
          'relative z-10 flex flex-col',
          hasPoster
            ? 'min-h-[min(38vh,280px)] pt-2.5 pb-4'
            : 'py-3 pb-5',
        )}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <Link
            to={isPast ? '/festivals/past' : '/'}
            className={cn(
              'text-[13px] font-semibold no-underline',
              hasPoster ? 'text-white/90' : 'text-inherit opacity-90',
            )}
          >
            ← {isPast ? '지난 페스티벌' : '목록'}
          </Link>
          {isPast && (
            <span
              className={cn(
                'text-[11px] font-extrabold tracking-[0.06em] uppercase',
                hasPoster ? 'text-white/70' : 'opacity-70',
              )}
            >
              종료
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-end">
          <div className="mb-2 flex items-center gap-2.5">
            {festival.logoUrl && (
              <img
                src={festival.logoUrl}
                alt=""
                className="size-10 shrink-0 rounded-[10px] object-cover object-center shadow-[0_2px_12px_rgba(0,0,0,0.28)]"
              />
            )}
            <h1
              className={cn(
                'm-0 text-[clamp(20px,5vw,26px)] font-extrabold leading-tight tracking-tight break-keep',
                !hasPoster && 'text-inherit',
              )}
            >
              {festival.name}
            </h1>
          </div>

          {(festival.tagline || festival.description) && (
            <p
              className={cn(
                'm-0 mb-1 text-[15px] font-semibold leading-snug break-keep',
                hasPoster ? 'text-white' : 'text-inherit',
              )}
            >
              {festival.tagline || festival.description}
            </p>
          )}
          {festival.tagline && festival.description && (
            <p
              className="m-0 mb-2 text-[13px] leading-relaxed opacity-90"
              style={!hasPoster ? { color: sig.muted } : undefined}
            >
              {festival.description}
            </p>
          )}

          <div
            className={cn(
              'flex flex-wrap gap-x-5 gap-y-1 text-[13px] font-bold',
              hasPoster ? 'text-white/85' : 'opacity-90',
            )}
            style={!hasPoster ? { color: sig.muted } : undefined}
          >
            {festival.mapUrl ? (
              <a
                href={festival.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
                style={!hasPoster ? { color: sig.muted } : undefined}
              >
                {festival.location}
              </a>
            ) : (
              <span>{festival.location}</span>
            )}
            <span>{formatDateRange(festival.startDate, festival.endDate)}</span>
          </div>

          {festival.websiteUrl && (
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={
                  <a
                    href={festival.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      hasPoster &&
                        'border-white/70 bg-transparent text-white hover:bg-white/10 hover:text-white',
                    )}
                    style={
                      !hasPoster
                        ? { color: sig.text, borderColor: 'currentColor' }
                        : undefined
                    }
                  />
                }
              >
                공식 홈페이지
              </Button>
            </div>
          )}

          {hasEditionNav && (
            <nav
              className={cn(
                'mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-3 text-[13px] font-semibold',
                hasPoster ? 'border-white/20 text-white/85' : 'border-black/15 opacity-90',
              )}
              aria-label="다른 해 에디션"
            >
              {previousEdition ? (
                <Link
                  to={`/festival/${previousEdition.id}`}
                  className="no-underline underline-offset-2 hover:underline"
                >
                  ← {previousEdition.editionYear}
                  {previousEdition.shortName ? ` ${previousEdition.shortName}` : ''}
                </Link>
              ) : (
                <span className="opacity-40">← 이전 해</span>
              )}
              {nextEdition ? (
                <Link
                  to={`/festival/${nextEdition.id}`}
                  className="no-underline underline-offset-2 hover:underline"
                >
                  {nextEdition.editionYear}
                  {nextEdition.shortName ? ` ${nextEdition.shortName}` : ''} →
                </Link>
              ) : (
                <span className="opacity-40">다음 해 →</span>
              )}
            </nav>
          )}
        </div>
      </Container>
    </section>
  )
}
