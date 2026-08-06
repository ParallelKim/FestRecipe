import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { FestivalService } from '../services/festivals'
import type { Festival } from '../types'
import { Container } from '../components/layout/Container'
import { Button } from '@/components/ui/button'
import { sortPastFestivals } from '../lib/festivalLifecycle'

const BASE_URL = 'https://festrecipe.com'

function artistCount(festival: Festival): number {
  if (festival.lineupStage === 'stage1_all') return festival.allArtists.length
  return festival.lineup.reduce((acc, day) => {
    if (day.artists?.length) return acc + day.artists.length
    if (day.slots?.length) return acc + day.slots.length
    return acc
  }, 0)
}

function festivalThumbnailUrl(festival: Festival): string | null {
  return festival.logoUrl || festival.logoLightUrl || null
}

function PastFestivalsHelmet({ count }: { count: number }) {
  const title = '지난 페스티벌 — FestRecipe'
  const description =
    count > 0
      ? `끝난 페스티벌 ${count}개의 라인업과 대표곡을 다시 들어 보세요.`
      : '끝난 페스티벌의 라인업과 대표곡을 다시 들어 보세요.'
  const url = `${BASE_URL}/festivals/past`

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${BASE_URL}/og-default.jpg`} />
      <meta property="og:locale" content="ko_KR" />
      <link rel="canonical" href={url} />
    </Helmet>
  )
}

/** `/festivals/past` — 일정 종료된 페스티벌 아카이브 */
export default function PastFestivals() {
  const [festivals] = useState<Festival[]>(() => FestivalService.getFestivalsSync())
  const past = sortPastFestivals(festivals)

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[var(--color-canvas)]">
      <PastFestivalsHelmet count={past.length} />

      <section className="border-b border-[var(--color-hairline)] bg-[linear-gradient(165deg,#12161c_0%,#1a222c_55%,#222b36_100%)] text-white">
        <Container className="max-w-[720px] py-14 pt-12">
          <Link
            to="/"
            className="mb-6 inline-block text-[13px] font-semibold text-white/80 no-underline hover:text-white"
          >
            ← 홈
          </Link>
          <h1 className="m-0 mb-3 text-[clamp(28px,5vw,40px)] font-extrabold tracking-tight">
            지난 페스티벌
          </h1>
          <p className="m-0 max-w-[36ch] text-[15px] leading-relaxed text-white/75">
            끝난 축제의 라인업과 대표곡을 다시 들어 보세요.
          </p>
        </Container>
      </section>

      <section className="py-12 pb-24">
        <Container>
          {past.length === 0 ? (
            <div className="py-16 text-center">
              <p className="mb-2 text-lg font-semibold tracking-tight">아직 지난 페스티벌이 없어요.</p>
              <p className="mb-6 text-sm text-muted-foreground">
                예정된 페스티벌 라인업부터 살펴보세요.
              </p>
              <Button render={<Link to="/#festivals" />} nativeButton={false}>
                다가오는 페스티벌 보기
              </Button>
            </div>
          ) : (
            <>
              <p className="mb-8 text-sm text-muted-foreground">
                <strong className="font-extrabold text-foreground">{past.length}</strong>개
              </p>
              <div className="flex flex-col gap-5">
                {past.map((festival, index) => {
                  const thumb = festivalThumbnailUrl(festival)
                  return (
                    <motion.article
                      key={festival.id}
                      className="grid gap-8 border-t border-[var(--color-hairline)] py-8 max-md:grid-cols-1 md:grid-cols-[1.4fr_1fr]"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.06 * index, ease: 'easeOut' }}
                    >
                      <div>
                        <p className="mb-2 text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase">
                          {festival.editionYear}
                        </p>
                        {thumb ? (
                          <div className="mb-3 flex items-center gap-3">
                            <img
                              src={thumb}
                              alt=""
                              className="size-11 shrink-0 object-contain opacity-90"
                            />
                            <h2 className="m-0 text-[clamp(20px,2.8vw,28px)] font-bold leading-snug tracking-tight break-keep">
                              {festival.name}
                            </h2>
                          </div>
                        ) : (
                          <h2 className="mb-3 text-[clamp(20px,2.8vw,28px)] font-bold leading-snug tracking-tight break-keep">
                            {festival.name}
                          </h2>
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
                          그해 라인업 다시 듣기
                        </Button>
                      </div>
                    </motion.article>
                  )
                })}
              </div>
            </>
          )}
        </Container>
      </section>
    </div>
  )
}
