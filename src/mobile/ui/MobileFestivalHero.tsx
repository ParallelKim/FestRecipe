import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { getFestivalSignatureTheme } from '@/lib/festivalSignature'
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
  festivalId: string
}

/**
 * `/m` 표준 상단 히어로 — 포스터는 cover 배경 + 그레디언트, 텍스트는 하단 스택.
 */
export default function MobileFestivalHero({
  festival,
  festivalId,
}: MobileFestivalHeroProps) {
  const sig = getFestivalSignatureTheme(festival.signatureColor)
  const hasPoster = Boolean(festival.posterUrl)
  const textOnImage = hasPoster

  return (
    <section
      className={cn(
        'mobile-festival-hero relative overflow-hidden border-b border-border',
        !hasPoster && 'mobile-festival-hero--flat',
      )}
      style={!hasPoster ? { backgroundColor: sig.bg, color: sig.text } : undefined}
    >
      {hasPoster && (
        <>
          <div
            className="mobile-festival-hero__bg"
            style={{ backgroundImage: `url(${festival.posterUrl})` }}
            role="img"
            aria-label={`${festival.name} 공식 포스터`}
          />
          <div className="mobile-festival-hero__shade" aria-hidden="true" />
        </>
      )}

      <div className="mobile-festival-hero__content container px-4">
        <div className="mobile-festival-hero__nav">
          <Link
            to="/"
            className="mobile-festival-hero__nav-link"
            style={textOnImage ? undefined : { color: sig.text }}
          >
            ← 목록
          </Link>
          <Link
            to={`/festival/${festivalId}`}
            className="mobile-festival-hero__nav-link mobile-festival-hero__nav-link--underline"
            style={textOnImage ? undefined : { color: sig.text }}
          >
            기존 화면
          </Link>
        </div>

        <div className="mobile-festival-hero__body">
          <div className="mobile-festival-hero__brand">
            {festival.logoUrl && (
              <img
                src={festival.logoUrl}
                alt=""
                className="mobile-festival-hero__mark"
              />
            )}
            <h1 className="mobile-festival-hero__title">{festival.name}</h1>
          </div>

          {(festival.tagline || festival.description) && (
            <p
              className="mobile-festival-hero__tagline"
              style={textOnImage ? undefined : { color: sig.text }}
            >
              {festival.tagline || festival.description}
            </p>
          )}
          {festival.tagline && festival.description && (
            <p
              className="mobile-festival-hero__desc"
              style={textOnImage ? undefined : { color: sig.muted }}
            >
              {festival.description}
            </p>
          )}

          <div
            className="mobile-festival-hero__meta"
            style={textOnImage ? undefined : { color: sig.muted }}
          >
            {festival.mapUrl ? (
              <a
                href={festival.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mobile-festival-hero__meta-link"
                style={textOnImage ? undefined : { color: sig.muted }}
              >
                {festival.location}
              </a>
            ) : (
              <span>{festival.location}</span>
            )}
            <span>{formatDateRange(festival.startDate, festival.endDate)}</span>
          </div>

          {festival.websiteUrl && (
            <div className="mobile-festival-hero__links">
              <a
                href={festival.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mobile-festival-hero__cta"
                style={
                  textOnImage
                    ? undefined
                    : { color: sig.text, borderColor: 'currentColor' }
                }
              >
                공식 홈페이지
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
