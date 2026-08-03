import { Link, useParams } from 'react-router-dom'
import FestivalHelmet from '../components/seo/FestivalHelmet'
import LoadingState from '../components/LoadingState'
import { Button } from '@/components/ui/button'
import { getFestivalSignatureTheme } from '../lib/festivalSignature'
import { useMobileFestival } from '../mobile/hooks/useMobileFestival'
import MobileApp from '../mobile/ui/MobileApp'
import type { MobileFestivalView } from '../mobile/view/types'

function formatDateRange(start: string, end: string): string {
  const fmt = (iso: string) => {
    const [, m, d] = iso.split('-')
    return `${Number(m)}.${Number(d)}`
  }
  return `${fmt(start)} – ${fmt(end)}`
}

function artistCount(festival: MobileFestivalView): number {
  if (festival.layoutKind === 'all') return festival.allArtistIds.length
  return festival.days.reduce((acc, day) => acc + day.artistIds.length, 0)
}

/** `/festival/:id/m` — timetable-first 모바일 UI */
export default function FestivalMobile() {
  const { id } = useParams<{ id: string }>()
  const { state, loading, error } = useMobileFestival(id)

  if (loading) {
    return <LoadingState label="페스티벌 정보를 불러오는 중…" minHeight="100vh" />
  }

  if (error || !state || !id) {
    return (
      <div className="container festival-missing">
        <h2 className="text-title-lg">페스티벌을 찾을 수 없어요.</h2>
        <p className="text-body text-muted">
          {error
            ? '정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'
            : '주소가 잘못되었거나 아직 준비 중인 페스티벌이에요.'}
        </p>
        <Button render={<Link to="/" />} nativeButton={false}>홈으로 돌아가기</Button>
      </div>
    )
  }

  const { festival, artistMap, playlistReady } = state
  const count = artistCount(festival)
  const sig = getFestivalSignatureTheme(festival.signatureColor)

  return (
    <div className="min-h-screen bg-[var(--color-canvas,#f4f3f0)]">
      <FestivalHelmet
        festivalId={festival.id}
        festivalName={festival.name}
        description={festival.description ?? ''}
        startDate={festival.startDate}
        endDate={festival.endDate}
        location={festival.location}
        artistCount={count}
      />

      <p className="hidden m-0 border-b border-border bg-muted/30 px-4 py-2.5 text-center text-[13px] text-muted-foreground min-[900px]:block">
        모바일에 맞춘 화면이에요. 넓은 화면에서는{' '}
        <Link to={`/festival/${id}`} className="text-inherit underline underline-offset-2">
          기존 페스티벌 화면
        </Link>
        을 써 보세요.
      </p>

      <section
        className="festival-hero festival-hero--mobile"
        style={{ backgroundColor: sig.bg, color: sig.text }}
      >
        <div className="container px-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <Link
              to="/"
              className="festival-hero__back m-0 text-[13px] opacity-90"
              style={{ color: sig.text }}
            >
              ← 목록
            </Link>
            <Link
              to={`/festival/${id}`}
              className="text-[13px] font-semibold underline underline-offset-2 opacity-90"
              style={{ color: sig.text }}
            >
              기존 화면
            </Link>
          </div>

          {festival.posterUrl && (
            <div className="festival-hero__poster-wrap festival-hero__poster-wrap--mobile">
              <img
                src={festival.posterUrl}
                alt={`${festival.name} 공식 포스터`}
                className="festival-hero__poster"
              />
            </div>
          )}

          <div className="festival-hero__brand">
            {!festival.posterUrl && festival.logoUrl && (
              <img src={festival.logoUrl} alt="" className="festival-hero__mark" />
            )}
            <h1 className="festival-hero__name festival-hero__name--mobile">
              {festival.name}
            </h1>
          </div>

          {(festival.tagline || festival.description) && (
            <p className="festival-hero__tagline festival-hero__tagline--mobile" style={{ color: sig.text }}>
              {festival.tagline || festival.description}
            </p>
          )}
          {festival.tagline && festival.description && (
            <p className="festival-hero__desc festival-hero__desc--mobile" style={{ color: sig.muted }}>
              {festival.description}
            </p>
          )}

          <div className="festival-hero__meta" style={{ color: sig.muted }}>
            {festival.mapUrl ? (
              <a
                href={festival.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="festival-hero__meta-link"
                style={{ color: sig.muted }}
              >
                {festival.location}
              </a>
            ) : (
              <span>{festival.location}</span>
            )}
            <span>{formatDateRange(festival.startDate, festival.endDate)}</span>
          </div>

          {festival.websiteUrl && (
            <div className="festival-hero__links">
              <a
                href={festival.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="festival-hero__link"
                style={{ color: sig.text, borderColor: 'currentColor' }}
              >
                공식 홈페이지
              </a>
            </div>
          )}
        </div>
      </section>

      <div className="min-[900px]:mx-auto min-[900px]:max-w-[440px]">
        <MobileApp
          festival={festival}
          artistMap={artistMap}
          playlistReady={playlistReady}
        />
      </div>
    </div>
  )
}
