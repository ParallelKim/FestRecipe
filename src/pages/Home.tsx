import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FestivalService } from '../services/festivals'
import type { Festival } from '../types'
import HomeHelmet from '../components/seo/HomeHelmet'
import { Container } from '../components/layout/Container'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  festivalDdayLabel,
  festivalStatusLabel,
  sortActiveFestivals,
  sortPastFestivals,
} from '../lib/festivalLifecycle'

function artistCount(festival: Festival): number {
  if (festival.lineupStage === 'stage1_all') return festival.allArtists.length
  return festival.lineup.reduce((acc, day) => {
    if (day.artists?.length) return acc + day.artists.length
    if (day.slots?.length) return acc + day.slots.length
    return acc
  }, 0)
}

function stageLabel(festival: Festival): string {
  if (festival.lineupStage === 'stage3_timetable') return '타임테이블'
  if (festival.lineupStage === 'stage2_daily') return '일별 라인업'
  return '전체 라인업'
}

function ctaLabel(festival: Festival): string {
  if (festival.lineupStage === 'stage3_timetable') {
    return '타임테이블과 대표곡 보기'
  }
  return '라인업과 대표곡 보기'
}

function formatDateRange(start: string, end: string): string {
  const fmt = (iso: string) => {
    const [, m, d] = iso.split('-')
    return `${Number(m)}.${Number(d)}`
  }
  return `${fmt(start)} – ${fmt(end)}`
}

function heroImageFor(festival: Festival): string | null {
  return festival.posterUrl || null
}

function festivalThumbnailUrl(festival: Festival, surface: 'on-dark' | 'on-light'): string | null {
  if (surface === 'on-dark') {
    return festival.logoLightUrl || festival.logoUrl || null
  }
  return festival.logoUrl || festival.logoLightUrl || null
}

export default function Home() {
  const [festivals] = useState<Festival[]>(() => FestivalService.getFestivalsSync())

  const activeFestivals = sortActiveFestivals(festivals)
  const pastFestivals = sortPastFestivals(festivals)
  const featured = activeFestivals[0] ?? null
  const heroImage = featured ? heroImageFor(featured) : null
  const featuredThumb = featured ? festivalThumbnailUrl(featured, 'on-dark') : null
  const ddayLabel = featured ? festivalDdayLabel(featured) : null

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[var(--color-canvas)]">
      <HomeHelmet festivalCount={activeFestivals.length} />

      <section
        className="relative flex min-h-[min(88vh,760px)] items-end overflow-hidden text-white max-md:min-h-[78vh] bg-[radial-gradient(ellipse_80%_60%_at_20%_30%,rgba(168,216,196,0.22),transparent_55%),radial-gradient(ellipse_70%_50%_at_85%_20%,rgba(217,164,65,0.18),transparent_50%),linear-gradient(160deg,#0b1014_0%,#151b22_45%,#1c232c_100%)]"
      >
        {heroImage && (
          <div
            className="absolute inset-0 scale-[1.04] bg-cover bg-[center_20%] animate-[hero-drift_18s_ease-in-out_infinite_alternate]"
            style={{ backgroundImage: `url(${heroImage})` }}
            role="img"
            aria-label={featured ? `${featured.name} 포스터` : undefined}
          />
        )}
        <div
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,10,12,0.35)_0%,rgba(8,10,12,0.55)_40%,rgba(8,10,12,0.88)_100%),linear-gradient(90deg,rgba(8,10,12,0.55)_0%,transparent_55%)]"
          aria-hidden="true"
        />
        <Container className="relative z-10 max-w-[720px] pt-[72px] pb-16">
          <motion.p
            className="mb-5 font-[family-name:var(--font-display)] text-[clamp(36px,7.5vw,64px)] font-extrabold tracking-tight"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            FestRecipe
          </motion.p>
          <motion.h1
            className="mb-4 text-[clamp(28px,5.5vw,44px)] font-extrabold leading-tight tracking-tight"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: 'easeOut' }}
          >
            페스티벌 가기 전에
            <br />
            미리 듣는 대표곡
          </motion.h1>
          <motion.p
            className="mb-0 max-w-[36ch] text-base leading-relaxed text-white/78"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16, ease: 'easeOut' }}
          >
            라인업 아티스트의 대표곡을 YouTube에서 미리 들어 보세요.
          </motion.p>

          {featured && (
            <motion.div
              className="mt-7"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.24, ease: 'easeOut' }}
            >
              {ddayLabel && (
                <p
                  className="mb-2 text-xs font-extrabold tracking-[0.08em] text-white/72 uppercase"
                  aria-label={`디데이 ${ddayLabel}`}
                >
                  {ddayLabel}
                </p>
              )}
              <div className="rounded-xl border border-white/14 bg-white/8 p-4 backdrop-blur-sm">
                <div className="mb-3 flex items-center gap-3.5">
                  {featuredThumb && (
                    <img
                      src={featuredThumb}
                      alt=""
                      className="size-[52px] shrink-0 object-contain drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="m-0 mb-1 text-base font-bold leading-snug break-keep text-white">
                      {featured.name}
                    </p>
                    <p className="m-0 text-[13px] leading-snug text-white/72 break-keep">
                      {formatDateRange(featured.startDate, featured.endDate)}
                      <span aria-hidden="true"> · </span>
                      {featured.location}
                    </p>
                  </div>
                </div>
                <Button
                  render={<Link to={`/festival/${featured.id}`} />}
                  nativeButton={false}
                  className="w-full justify-center bg-white text-[var(--color-ink)] hover:bg-[#f2f2f2] hover:text-[var(--color-ink)]"
                >
                  {ctaLabel(featured)}
                </Button>
              </div>
            </motion.div>
          )}
        </Container>
      </section>

      {activeFestivals.length > 0 && (
        <section className="py-16 pb-10" id="festivals">
          <Container>
            <h2 className="mb-2 text-2xl font-bold tracking-tight">다가오는 페스티벌</h2>
            <p className="mb-7 text-sm text-muted-foreground">
              예정·진행 중{' '}
              <strong className="font-extrabold text-foreground">{activeFestivals.length}</strong>개
            </p>
            <div className="flex flex-col gap-5">
              {activeFestivals.map((festival, index) => {
                const thumb = festivalThumbnailUrl(festival, 'on-light')
                const listDday = festivalDdayLabel(festival)
                return (
                  <motion.article
                    key={festival.id}
                    className="grid gap-8 border-t border-[var(--color-hairline)] py-8 max-md:grid-cols-1 md:grid-cols-[1.4fr_1fr]"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.08 * index, ease: 'easeOut' }}
                  >
                    <div>
                      <p className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-bold tracking-[0.06em] text-muted-foreground uppercase">
                        {stageLabel(festival)}
                        <Badge
                          variant="outline"
                          className="text-[11px] font-extrabold tracking-normal normal-case"
                        >
                          {festivalStatusLabel(festival.status)}
                        </Badge>
                        {listDday && (
                          <Badge
                            variant="outline"
                            className="text-[11px] font-extrabold tracking-normal normal-case"
                            aria-label={`일정 ${listDday}`}
                          >
                            {listDday}
                          </Badge>
                        )}
                      </p>
                      {thumb ? (
                        <div className="mb-3 flex items-center gap-3">
                          <img
                            src={thumb}
                            alt=""
                            className="size-11 shrink-0 object-contain"
                          />
                          <h3 className="m-0 text-[clamp(20px,2.8vw,28px)] font-bold leading-snug tracking-tight break-keep">
                            {festival.name}
                          </h3>
                        </div>
                      ) : (
                        <h3 className="mb-3 text-[clamp(20px,2.8vw,28px)] font-bold leading-snug tracking-tight break-keep">
                          {festival.name}
                        </h3>
                      )}
                      <p className="m-0 max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
                        {festival.tagline || festival.description}
                      </p>
                    </div>
                    <div className="flex flex-col justify-center gap-2.5">
                      <p className="m-0 flex justify-between gap-4 text-[13px] font-medium">
                        <span className="text-muted-foreground">일시</span>
                        {festival.startDate} ~ {festival.endDate}
                      </p>
                      <p className="m-0 flex justify-between gap-4 text-[13px] font-medium">
                        <span className="text-muted-foreground">장소</span>
                        {festival.location}
                      </p>
                      <p className="m-0 flex justify-between gap-4 text-[13px] font-medium">
                        <span className="text-muted-foreground">출연</span>
                        {artistCount(festival)}팀
                      </p>
                      <Button
                        variant="outline"
                        render={<Link to={`/festival/${festival.id}`} />}
                        nativeButton={false}
                        className="mt-2 w-fit no-underline"
                      >
                        {ctaLabel(festival)}
                      </Button>
                    </div>
                  </motion.article>
                )
              })}
            </div>
          </Container>
        </section>
      )}

      {pastFestivals.length > 0 && (
        <section className="pb-24 pt-4">
          <Container>
            <div className="border-t border-[var(--color-hairline)] pt-10">
              <h2 className="mb-2 text-xl font-bold tracking-tight">지난 페스티벌</h2>
              <p className="mb-5 max-w-[42ch] text-sm text-muted-foreground">
                끝난 축제의 라인업과 대표곡도 그대로 들을 수 있어요.
              </p>
              <Button
                variant="outline"
                render={<Link to="/festivals/past" />}
                nativeButton={false}
                className="w-fit no-underline"
              >
                지난 페스티벌 보기
              </Button>
            </div>
          </Container>
        </section>
      )}
    </div>
  )
}
