import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FestivalService } from '../services/festivals'
import type { Festival } from '../types'
import HomeHelmet from '../components/seo/HomeHelmet'
import LoadingState from '../components/LoadingState'

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

/** Local calendar day as YYYY-MM-DD (no timezone shift surprises). */
function todayIso(now = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function daysBetween(fromIso: string, toIso: string): number {
  const from = Date.parse(`${fromIso}T12:00:00`)
  const to = Date.parse(`${toIso}T12:00:00`)
  return Math.round((to - from) / 86_400_000)
}

/** Nearest upcoming (or currently on) festival for the hero. */
function closestFestival(festivals: Festival[], today = todayIso()): Festival | null {
  if (festivals.length === 0) return null
  const ranked = [...festivals].sort((a, b) => {
    const aOngoing = a.startDate <= today && today <= a.endDate
    const bOngoing = b.startDate <= today && today <= b.endDate
    if (aOngoing !== bOngoing) return aOngoing ? -1 : 1
    const aFuture = a.startDate >= today
    const bFuture = b.startDate >= today
    if (aFuture !== bFuture) return aFuture ? -1 : 1
    if (aFuture) return a.startDate.localeCompare(b.startDate)
    // past: nearest end date first
    return b.endDate.localeCompare(a.endDate)
  })
  return ranked[0] ?? null
}

/** Hero eyebrow: D-day style countdown to festival start / during / after. */
function festivalDdayLabel(festival: Festival, today = todayIso()): string {
  if (today < festival.startDate) {
    const n = daysBetween(today, festival.startDate)
    return n === 0 ? 'D-DAY' : `D-${n}`
  }
  if (today <= festival.endDate) {
    const day = daysBetween(festival.startDate, today) + 1
    return `DAY ${day}`
  }
  const ago = daysBetween(festival.endDate, today)
  return ago <= 0 ? '종료' : `${ago}일 전 종료`
}

function heroImageFor(festival: Festival): string | null {
  return festival.posterUrl || null
}

export default function Home() {
  const [festivals, setFestivals] = useState<Festival[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    FestivalService.getFestivals().then((data) => {
      if (active) {
        setFestivals(data)
        setLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return <LoadingState label="페스티벌 정보를 불러오는 중..." />
  }

  const featured = closestFestival(festivals)
  const heroImage = featured ? heroImageFor(featured) : null
  const ddayLabel = featured ? festivalDdayLabel(featured) : null

  return (
    <div className="home-page">
      <HomeHelmet festivalCount={festivals.length} />

      <section className="home-hero">
        {heroImage && (
          <div
            className="home-hero__media"
            style={{ backgroundImage: `url(${heroImage})` }}
            role="img"
            aria-label={featured ? `${featured.name} 포스터` : undefined}
          />
        )}
        <div className="home-hero__wash" aria-hidden="true" />
        <div className="container home-hero__content">
          <motion.p
            className="home-hero__brand"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            FestRecipe
          </motion.p>
          <motion.h1
            className="home-hero__title"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: 'easeOut' }}
          >
            페스티벌 전에 듣는
            <br />
            대표곡 플레이리스트
          </motion.h1>
          <motion.p
            className="home-hero__lede"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16, ease: 'easeOut' }}
          >
            라인업 아티스트의 YouTube Music 인기곡을 모아 바로 들을 수 있습니다.
          </motion.p>

          {featured && (
            <motion.div
              className="home-hero__featured"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.24, ease: 'easeOut' }}
            >
              {ddayLabel && (
                <p className="home-hero__featured-label" aria-label={`디데이 ${ddayLabel}`}>
                  {ddayLabel}
                </p>
              )}
              <div className="home-hero__featured-brand">
                {(featured.posterUrl || featured.logoLightUrl || featured.logoUrl) && (
                  <img
                    src={featured.posterUrl || featured.logoLightUrl || featured.logoUrl}
                    alt=""
                    className={`home-hero__fest-mark${featured.posterUrl ? ' home-hero__fest-mark--poster' : ''}`}
                  />
                )}
                <div className="home-hero__featured-copy">
                  <p className="home-hero__fest-name">{featured.name}</p>
                  <p className="home-hero__fest-meta">
                    {formatDateRange(featured.startDate, featured.endDate)}
                    <span aria-hidden="true"> · </span>
                    {featured.location}
                  </p>
                </div>
              </div>
              <Link
                to={`/festival/${featured.id}`}
                className="btn-primary home-hero__cta"
              >
                {ctaLabel(featured)}
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      <section className="home-festivals" id="festivals">
        <div className="container">
          <h2 className="home-festivals__heading">다가오는 페스티벌</h2>
          <div className="home-festivals__list">
            {festivals.map((festival, index) => (
              <motion.article
                key={festival.id}
                className={`home-fest-row home-fest-row--${festival.signatureColor}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.08 * index, ease: 'easeOut' }}
              >
                <div className="home-fest-row__main">
                  <p className="home-fest-row__eyebrow">{stageLabel(festival)}</p>
                  {festival.posterUrl || festival.logoUrl ? (
                    <div className="home-fest-row__brand">
                      <img
                        src={festival.posterUrl || festival.logoUrl}
                        alt=""
                        className={`home-fest-row__mark${festival.posterUrl ? ' home-fest-row__mark--poster' : ''}`}
                      />
                      <h3 className="home-fest-row__name">{festival.name}</h3>
                    </div>
                  ) : (
                    <h3 className="home-fest-row__name">{festival.name}</h3>
                  )}
                  <p className="home-fest-row__desc">
                    {festival.tagline || festival.description}
                  </p>
                </div>
                <div className="home-fest-row__meta">
                  <p><span>일시</span>{festival.startDate} ~ {festival.endDate}</p>
                  <p><span>장소</span>{festival.location}</p>
                  <p><span>출연</span>{artistCount(festival)}팀</p>
                  <Link to={`/festival/${festival.id}`} className="btn-secondary home-fest-row__link">
                    {ctaLabel(festival)}
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
