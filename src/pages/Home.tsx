import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FestivalService } from '../services/festivals'
import type { Festival } from '../types'

export default function Home() {
  const [festivals, setFestivals] = useState<Festival[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    FestivalService.getFestivals().then(data => {
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
    return (
      <div style={{ backgroundColor: 'var(--color-canvas)', minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--color-muted)' }}>
          <span style={{ fontSize: '32px', display: 'block', marginBottom: '16px', animation: 'spin 1s linear infinite' }}>⏳</span>
          <p className="text-title-sm">페스티벌 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: 'var(--color-canvas)', minHeight: 'calc(100vh - 64px)' }}>
      {/* Hero Section */}
      <section className="section" style={{ borderBottom: '1px solid var(--color-hairline)', backgroundColor: 'var(--color-surface-soft)', paddingBottom: '72px', paddingTop: '72px' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '800px' }}>
          <h1 className="text-display-xl" style={{ color: 'var(--color-ink)', fontWeight: 800, letterSpacing: '-1.5px', margin: '0 0 16px' }}>
            페스티벌 라인업 &amp; 예상 셋리스트
          </h1>
          <p className="text-display-md text-muted" style={{ margin: 0, fontSize: 'var(--text-title-md)', fontWeight: 400, lineHeight: 1.5 }}>
            당신의 다음 페스티벌을 완성할 음악 레시피. 아티스트의 셋리스트를 미리 만나고 감상해보세요.
          </p>
        </div>
      </section>

      {/* Festivals Grid */}
      <section className="section">
        <div className="container">
          <h2 className="text-title-lg" style={{ color: 'var(--color-ink)', fontWeight: 700, marginBottom: '32px' }}>
            다가오는 페스티벌
          </h2>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: '32px' 
          }}>
            {festivals.map(festival => {
              const totalArtists = festival.lineupStage === 'stage1_all' 
                ? festival.allArtists.length 
                : festival.lineup.reduce((acc, curr) => acc + (curr.artists?.length || 0), 0)
              
              // Custom style based on signature color
              let cardClass = 'card-cream'
              let textColor = 'var(--color-ink)'
              let mutedColor = 'var(--color-muted)'
              let btnClass = 'btn-primary'
              let btnStyle = {}

              if (festival.signatureColor === 'forest') {
                cardClass = 'card-forest'
                textColor = '#ffffff'
                mutedColor = 'rgba(255,255,255,0.7)'
                btnClass = 'btn-secondary'
                btnStyle = {
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.3)',
                  backdropFilter: 'blur(4px)'
                }
              } else if (festival.signatureColor === 'coral') {
                cardClass = 'card-coral'
                textColor = '#ffffff'
                mutedColor = 'rgba(255,255,255,0.7)'
                btnClass = 'btn-secondary'
                btnStyle = {
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.3)',
                  backdropFilter: 'blur(4px)'
                }
              }

              return (
                <div 
                  key={festival.id}
                  className={cardClass}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between',
                    minHeight: '400px',
                    boxShadow: 'var(--shadow-card)',
                    border: festival.signatureColor === 'cream' ? '1px solid var(--color-hairline)' : 'none',
                    borderRadius: 'var(--radius-lg)'
                  }}
                >
                  <div>
                    {/* Status Badge */}
                    <span 
                      className="badge" 
                      style={{ 
                        backgroundColor: festival.signatureColor === 'cream' ? 'var(--color-surface-strong)' : 'rgba(255,255,255,0.2)',
                        color: textColor,
                        marginBottom: '20px',
                        fontWeight: 600
                      }}
                    >
                      {festival.lineupStage === 'stage1_all' && '1단계: 전체 라인업'}
                      {festival.lineupStage === 'stage2_daily' && '2단계: 일별 라인업'}
                      {festival.lineupStage === 'stage3_timetable' && '3단계: 타임테이블'}
                    </span>

                    {/* Name */}
                    <h3 className="text-display-md" style={{ color: textColor, margin: '0 0 16px', fontWeight: 700, letterSpacing: '-0.8px' }}>
                      {festival.name}
                    </h3>

                    {/* Description */}
                    <p className="text-body" style={{ color: mutedColor, margin: '0 0 24px', fontSize: '15px' }}>
                      {festival.description}
                    </p>
                  </div>

                  {/* Meta / Action */}
                  <div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px', borderTop: festival.signatureColor === 'cream' ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.15)', paddingTop: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-caption)' }}>
                        <span style={{ color: mutedColor }}>일시</span>
                        <span style={{ color: textColor, fontWeight: 500 }}>
                          {festival.startDate} ~ {festival.endDate}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-caption)' }}>
                        <span style={{ color: mutedColor }}>장소</span>
                        <span style={{ color: textColor, fontWeight: 500, maxWidth: '200px', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={festival.location}>
                          {festival.location}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-caption)' }}>
                        <span style={{ color: mutedColor }}>출연진</span>
                        <span style={{ color: textColor, fontWeight: 500 }}>{totalArtists}팀 출연</span>
                      </div>
                    </div>

                    <Link 
                      to={`/festival/${festival.id}`} 
                      className={btnClass}
                      style={{ width: '100%', textDecoration: 'none', ...btnStyle }}
                    >
                      {festival.lineupStage === 'stage3_timetable' ? '타임테이블 & 레시피 보기' : '라인업 & 레시피 보기'}
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
