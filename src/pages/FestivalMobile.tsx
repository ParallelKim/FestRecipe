import { Link, useParams } from 'react-router-dom'
import FestivalHelmet from '../components/seo/FestivalHelmet'
import LoadingState from '../components/LoadingState'
import { Button } from '@/components/ui/button'
import { useMobileFestival } from '../mobile/hooks/useMobileFestival'
import MobileApp from '../mobile/ui/MobileApp'
import type { MobileFestivalView } from '../mobile/view/types'
import '../mobile/mobile.css'

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

  return (
    <div className="m-page">
      <FestivalHelmet
        festivalId={festival.id}
        festivalName={festival.name}
        description={festival.description ?? ''}
        startDate={festival.startDate}
        endDate={festival.endDate}
        location={festival.location}
        artistCount={count}
      />

      <p className="m-page__desktop-hint">
        모바일에 맞춘 화면이에요. 넓은 화면에서는{' '}
        <Link to={`/festival/${id}`}>기존 페스티벌 화면</Link>을 써 보세요.
      </p>

      <header className="m-page__header">
        <div className="m-page__header-row">
          <Link to="/" className="m-page__back">← 목록</Link>
          <Link to={`/festival/${id}`} className="m-page__classic">기존 화면</Link>
        </div>
        <div className="m-page__brand">
          {festival.logoUrl && (
            <img src={festival.logoUrl} alt="" className="m-page__mark" />
          )}
          <div>
            <h1 className="m-page__title">{festival.name}</h1>
            <p className="m-page__meta">
              {formatDateRange(festival.startDate, festival.endDate)}
              <span aria-hidden="true"> · </span>
              {festival.mapUrl ? (
                <a href={festival.mapUrl} target="_blank" rel="noopener noreferrer">
                  {festival.location}
                </a>
              ) : (
                festival.location
              )}
            </p>
          </div>
        </div>
      </header>

      <div className="m-page__body">
        <MobileApp
          festival={festival}
          artistMap={artistMap}
          playlistReady={playlistReady}
        />
      </div>
    </div>
  )
}
