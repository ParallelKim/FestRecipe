import { Link, useParams } from 'react-router-dom'
import FestivalHelmet from '../components/seo/FestivalHelmet'
import LoadingState from '../components/LoadingState'
import { Button } from '@/components/ui/button'
import { useMobileFestival } from '../mobile/hooks/useMobileFestival'
import MobileApp from '../mobile/ui/MobileApp'
import MobileFestivalHero from '../mobile/ui/MobileFestivalHero'
import type { MobileFestivalView } from '../mobile/view/types'

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

      <MobileFestivalHero festival={festival} festivalId={id} />

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
