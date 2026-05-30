import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FestivalService } from '../services/festivals'
import type { Festival, Artist } from '../types'
import TimetableGrid from '../components/TimetableGrid'
import FestivalHelmet from '../components/seo/FestivalHelmet'

export default function FestivalDetail() {
  const { id } = useParams<{ id: string }>()
  
  const [festival, setFestival] = useState<Festival | null>(null)
  const [artists, setArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)
  
  const [activeDayIndex, setActiveDayIndex] = useState(0)
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null)
  const [expandedSongIdx, setExpandedSongIdx] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    if (!id) return

    Promise.all([
      FestivalService.getFestivalById(id),
      FestivalService.getArtists()
    ]).then(([festData, artistsData]) => {
      if (active) {
        if (festData) {
          setFestival(festData)
        }
        setArtists(artistsData)
        setLoading(false)
      }
    })

    return () => {
      active = false
    }
  }, [id])

  if (loading) {
    return (
      <div style={{ backgroundColor: 'var(--color-canvas)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--color-muted)' }}>
          <span style={{ fontSize: '32px', display: 'block', marginBottom: '16px', animation: 'spin 1s linear infinite' }}>⏳</span>
          <p className="text-title-sm">페스티벌 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!festival) {
    return (
      <div className="container" style={{ padding: '96px 48px', textAlign: 'center' }}>
        <span style={{ fontSize: '64px', display: 'block', marginBottom: '24px' }}>🏜️</span>
        <h2 className="text-title-lg" style={{ fontWeight: 700 }}>페스티벌을 찾을 수 없습니다.</h2>
        <p className="text-body text-muted" style={{ margin: '8px 0 24px' }}>요청하신 페스티벌 정보가 시스템에 존재하지 않거나 준비 중입니다.</p>
        <Link to="/" className="btn-primary" style={{ textDecoration: 'none' }}>홈으로 돌아가기</Link>
      </div>
    )
  }

  // Signature colors
  let sigColor = 'var(--color-sig-cream)'
  let sigTextColor = 'var(--color-ink)'
  let sigMutedColor = 'var(--color-muted)'
  let progressActiveColor = 'var(--color-ink)'

  if (festival.signatureColor === 'forest') {
    sigColor = 'var(--color-sig-forest)'
    sigTextColor = '#ffffff'
    sigMutedColor = 'rgba(255,255,255,0.7)'
    progressActiveColor = 'var(--color-sig-mint)'
  } else if (festival.signatureColor === 'coral') {
    sigColor = 'var(--color-sig-coral)'
    sigTextColor = '#ffffff'
    sigMutedColor = 'rgba(255,255,255,0.7)'
    progressActiveColor = 'var(--color-sig-peach)'
  }

  const activeDay = festival.lineup[activeDayIndex]
  const artistMap = new Map(artists.map(a => [a.id, a]))
  
  // Get all artists for Stage 1 (unsorted lineup)
  const stage1Artists = festival.allArtists
    .map(artistId => artistMap.get(artistId))
    .filter((a): a is Artist => !!a)

  // Get active day artists for Stage 2
  const activeDayArtists = (activeDay?.artists || [])
    .map(artistId => artistMap.get(artistId))
    .filter((a): a is Artist => !!a)

  // Handle slot/card click to select artist and load recipe
  const handleArtistSelect = (artistId: string) => {
    const artist = artistMap.get(artistId)
    if (artist) {
      setSelectedArtist(artist)
      // Scroll to Setlist recipe panel on mobile
      const panel = document.getElementById('setlist-recipe-panel')
      if (panel) {
        panel.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  const artistRecipe = selectedArtist ? FestivalService.getRecipeForArtist(selectedArtist.id) : null

  const artistCount = festival.lineupStage === 'stage1_all'
    ? festival.allArtists.length
    : festival.lineup.reduce((acc, day) => acc + (day.artists?.length || 0), 0)

  return (
    <div style={{ backgroundColor: 'var(--color-canvas)', minHeight: '100vh', paddingBottom: '96px' }}>
      <FestivalHelmet
        festivalId={festival.id}
        festivalName={festival.name}
        description={festival.description}
        startDate={festival.startDate}
        endDate={festival.endDate}
        location={festival.location}
        artistCount={artistCount}
      />
      
      {/* Festival Banner */}
      <section 
        style={{ 
          backgroundColor: sigColor, 
          color: sigTextColor, 
          padding: '56px 0', 
          borderBottom: festival.signatureColor === 'cream' ? '1px solid var(--color-hairline)' : 'none' 
        }}
      >
        <div className="container">
          <Link 
            to="/" 
            style={{ 
              color: sigTextColor, 
              textDecoration: 'none', 
              fontSize: '14px', 
              fontWeight: 600, 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px',
              marginBottom: '24px',
              opacity: 0.8
            }}
          >
            &larr; 페스티벌 목록
          </Link>
          <h1 className="text-display-lg" style={{ fontWeight: 800, margin: '0 0 16px', letterSpacing: '-1.2px' }}>
            {festival.name}
          </h1>
          <p className="text-body" style={{ color: sigMutedColor, margin: '0 0 24px', maxWidth: '750px', fontSize: '15px', lineHeight: 1.6 }}>
            {festival.description}
          </p>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '14px', fontWeight: 600 }}>
            <span>📍 {festival.location}</span>
            <span>📅 {festival.startDate} ~ {festival.endDate}</span>
          </div>
        </div>
      </section>

      {/* Lineup Stage Reveal Progress Bar */}
      <section style={{ backgroundColor: 'var(--color-surface-soft)', borderBottom: '1px solid var(--color-hairline)', padding: '16px 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>📢</span>
            <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-ink)' }}>공개 진행 상황</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', fontWeight: 600 }}>
            <span style={{ 
              color: festival.lineupStage === 'stage1_all' ? progressActiveColor : 'var(--color-muted)',
              borderBottom: festival.lineupStage === 'stage1_all' ? `2px solid ${progressActiveColor}` : 'none',
              paddingBottom: '2px'
            }}>
              1단계 전체 라인업 {festival.lineupStage === 'stage1_all' && '✓'}
            </span>
            <span style={{ color: 'var(--color-hairline)' }}>&rarr;</span>
            <span style={{ 
              color: festival.lineupStage === 'stage2_daily' ? progressActiveColor : 'var(--color-muted)',
              borderBottom: festival.lineupStage === 'stage2_daily' ? `2px solid ${progressActiveColor}` : 'none',
              paddingBottom: '2px'
            }}>
              2단계 일별 라인업 {festival.lineupStage === 'stage2_daily' && '✓'}
            </span>
            <span style={{ color: 'var(--color-hairline)' }}>&rarr;</span>
            <span style={{ 
              color: festival.lineupStage === 'stage3_timetable' ? progressActiveColor : 'var(--color-muted)',
              borderBottom: festival.lineupStage === 'stage3_timetable' ? `2px solid ${progressActiveColor}` : 'none',
              paddingBottom: '2px'
            }}>
              3단계 타임테이블 {festival.lineupStage === 'stage3_timetable' && '✨'}
            </span>
          </div>
        </div>
      </section>

      {/* Main Layout */}
      <section style={{ marginTop: '40px' }}>
        <div className="container">
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(0, 1fr))',
            gap: '40px',
            alignItems: 'start'
          }}>
            {/* Using flex layout to create a responsive split pane:
                On small screens they stack, on large screens they sit side-by-side. */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px' }}>
              
              {/* Left Column (Lineup/Timetable Content) */}
              <div style={{ flex: '1 1 500px', minWidth: 0 }}>

            {/* STAGE 1: Unsorted tag bubble list */}
            {festival.lineupStage === 'stage1_all' && (
              <div className="card-content" style={{ padding: '32px', backgroundColor: 'var(--color-surface-soft)' }}>
                <h3 className="text-title-md" style={{ color: 'var(--color-ink)', fontWeight: 700, margin: '0 0 8px' }}>
                  공개된 아티스트 라인업 ({stage1Artists.length}팀)
                </h3>
                <p className="text-body text-muted" style={{ margin: '0 0 24px' }}>
                  현재 요일 미구분 전체 라인업이 공개되었습니다. 아티스트를 선택해 최근 setlist 레시피를 구경해 보세요.
                </p>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {stage1Artists.map(artist => {
                    const isSelected = selectedArtist?.id === artist.id
                    return (
                      <button
                        key={artist.id}
                        onClick={() => handleArtistSelect(artist.id)}
                        style={{
                          padding: '10px 18px',
                          borderRadius: 'var(--radius-pill)',
                          border: isSelected ? '2px solid var(--color-ink)' : '1px solid var(--color-hairline)',
                          backgroundColor: isSelected ? 'var(--color-ink)' : 'var(--color-canvas)',
                          color: isSelected ? '#ffffff' : 'var(--color-ink)',
                          fontWeight: 600,
                          fontSize: '14px',
                          cursor: 'pointer',
                          transition: 'all 0.12s ease'
                        }}
                      >
                        {artist.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* STAGE 2: Day Tabs + Grid cards */}
            {festival.lineupStage === 'stage2_daily' && (
              <div>
                <div style={{ borderBottom: '1px solid var(--color-hairline)', display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '1px' }}>
                  {festival.lineup.map((day, idx) => (
                    <button
                      key={day.date}
                      onClick={() => {
                        setActiveDayIndex(idx)
                        setSelectedArtist(null)
                      }}
                      style={{
                        padding: '12px 24px',
                        fontSize: '15px',
                        fontWeight: 600,
                        backgroundColor: activeDayIndex === idx ? 'var(--color-ink)' : 'transparent',
                        color: activeDayIndex === idx ? 'var(--color-canvas)' : 'var(--color-muted)',
                        border: 'none',
                        borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {day.dayLabel}
                    </button>
                  ))}
                </div>

                <h3 className="text-title-sm" style={{ marginBottom: '16px', color: 'var(--color-ink)' }}>
                  일별 라인업 아티스트
                </h3>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
                  gap: '16px',
                  marginBottom: '40px'
                }}>
                  {activeDayArtists.map(artist => {
                    const isSelected = selectedArtist?.id === artist.id
                    const hasRecipe = !!FestivalService.getRecipeForArtist(artist.id)

                    return (
                      <button
                        key={artist.id}
                        onClick={() => handleArtistSelect(artist.id)}
                        className="card-content"
                        style={{
                          padding: '16px 20px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: '12px',
                          borderColor: isSelected ? 'var(--color-ink)' : 'var(--color-hairline)',
                          borderWidth: isSelected ? '2px' : '1px',
                          backgroundColor: isSelected ? 'var(--color-surface-soft)' : 'var(--color-canvas)',
                          margin: isSelected ? '-1px' : '0'
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 700, color: 'var(--color-ink)', fontSize: '15px', display: 'block', marginBottom: '2px' }}>
                            {artist.name}
                          </span>
                          {artist.country && (
                            <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: 600 }}>
                              🌍 {artist.country}
                            </span>
                          )}
                        </div>

                        <span 
                          className="badge" 
                          style={{ 
                            backgroundColor: hasRecipe ? 'var(--color-sig-mint)' : 'var(--color-surface-strong)', 
                            color: hasRecipe ? '#064e3b' : 'var(--color-muted)', 
                            fontSize: '11px',
                            fontWeight: 700
                          }}
                        >
                          {hasRecipe ? '레시피 준비 완료 ✨' : '레시피 준비 중'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* STAGE 3: Day Tabs + TimetableGrid */}
            {festival.lineupStage === 'stage3_timetable' && (
              <div>
                <div style={{ borderBottom: '1px solid var(--color-hairline)', display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '1px' }}>
                  {festival.lineup.map((day, idx) => (
                    <button
                      key={day.date}
                      onClick={() => {
                        setActiveDayIndex(idx)
                        setSelectedArtist(null)
                      }}
                      style={{
                        padding: '12px 24px',
                        fontSize: '15px',
                        fontWeight: 600,
                        backgroundColor: activeDayIndex === idx ? 'var(--color-ink)' : 'transparent',
                        color: activeDayIndex === idx ? 'var(--color-canvas)' : 'var(--color-muted)',
                        border: 'none',
                        borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {day.dayLabel}
                    </button>
                  ))}
                </div>

                <div style={{ overflowX: 'auto', paddingBottom: '16px', marginBottom: '40px' }}>
                  <div style={{ minWidth: 'min-content' }}>
                    <TimetableGrid
                      stages={activeDay?.stages || []}
                      slots={activeDay?.slots || []}
                      artists={artists}
                      selectedArtistId={selectedArtist?.id}
                      onSlotClick={handleArtistSelect}
                    />
                  </div>
                </div>
              </div>
            )}

              </div> {/* End Left Column */}

              {/* Right Column (Sticky Setlist Recipe Panel) */}
              <div style={{ flex: '1 1 350px', position: 'sticky', top: '80px', height: 'fit-content' }}>
                <div id="setlist-recipe-panel" className="card-content" style={{ padding: '28px', minHeight: '300px' }}>
                  {selectedArtist ? (
                    <div>
                      {/* Panel Header */}
                      <div style={{ marginBottom: '4px' }}>
                        <h3 style={{ color: 'var(--color-ink)', fontWeight: 800, margin: '0 0 4px', fontSize: '18px', letterSpacing: '-0.4px' }}>
                          {selectedArtist.name}
                        </h3>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)', lineHeight: 1.5 }}>
                          과거 공연 데이터 기반 예상 셋리스트 · 확률 수치 없음
                        </p>
                      </div>

                      {artistRecipe && artistRecipe.length > 0 && (
                        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {/* 1. 전체 재생목록 링크 (Official URLs if available) */}
                          {(() => {
                            const videoIds = artistRecipe
                              .map(s => {
                                if (!s.youtubeOfficialUrl) return null
                                const match = s.youtubeOfficialUrl.match(/[?&]v=([^&#]+)/)
                                return match ? match[1] : null
                              })
                              .filter((id): id is string => !!id)

                            if (videoIds.length > 0) {
                              const playlistUrl = `https://www.youtube.com/watch_videos?video_ids=${videoIds.join(',')}`
                              return (
                                <a
                                  href={playlistUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn-primary"
                                  style={{
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    textDecoration: 'none',
                                    textAlign: 'center',
                                    padding: '8px 12px',
                                    display: 'block'
                                  }}
                                >
                                  💿 예상 셋리스트 전체 재생 (유튜브)
                                </a>
                              )
                            }
                            return null
                          })()}

                          {/* 2. 각 곡에서 시작하는 재생목록 링크 */}
                          {(() => {
                            const videoIds = artistRecipe
                              .map(s => {
                                if (!s.youtubeOfficialUrl) return null
                                const match = s.youtubeOfficialUrl.match(/[?&]v=([^&#]+)/)
                                return match ? match[1] : null
                              })
                              .filter((id): id is string => !!id)

                            if (videoIds.length > 1) {
                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <p style={{ fontSize: '10px', color: 'var(--color-muted)', margin: '4px 0 2px', fontWeight: 600 }}>특정 곡부터 재생 시작하기:</p>
                                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                    {artistRecipe.map((s, idx) => {
                                      if (!s.youtubeOfficialUrl) return null
                                      const match = s.youtubeOfficialUrl.match(/[?&]v=([^&#]+)/)
                                      if (!match) return null
                                      const startVid = match[1]
                                      // Reorder list to start from this video
                                      const startIdx = videoIds.indexOf(startVid)
                                      const orderedIds = [...videoIds.slice(startIdx), ...videoIds.slice(0, startIdx)]
                                      const playlistUrl = `https://www.youtube.com/watch_videos?video_ids=${orderedIds.join(',')}`

                                      return (
                                        <a
                                          key={s.songTitle}
                                          href={playlistUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          style={{
                                            fontSize: '10px',
                                            fontWeight: 600,
                                            padding: '4px 8px',
                                            borderRadius: 'var(--radius-sm)',
                                            backgroundColor: 'var(--color-surface-soft)',
                                            border: '1px solid var(--color-hairline)',
                                            color: 'var(--color-ink)',
                                            textDecoration: 'none',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            transition: 'background 0.12s'
                                          }}
                                        >
                                          {idx + 1}. {s.songTitle.length > 8 ? `${s.songTitle.slice(0, 8)}…` : s.songTitle} ▶
                                        </a>
                                      )
                                    })}
                                  </div>
                                </div>
                              )
                            }
                            return null
                          })()}
                        </div>
                      )}

                      <hr className="divider" style={{ margin: '16px 0' }} />

                      {/* Official Music Link */}
                      {artistRecipe && artistRecipe.some(s => s.youtubeOfficialUrl) && (
                        <div style={{ marginBottom: '16px' }}>
                          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>공식 음원</p>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {artistRecipe.filter(s => s.youtubeOfficialUrl).map(s => (
                              <a
                                key={s.songTitle}
                                href={s.youtubeOfficialUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  fontSize: '12px', fontWeight: 600, padding: '4px 10px',
                                  borderRadius: 'var(--radius-pill)',
                                  backgroundColor: 'var(--color-surface-soft)',
                                  border: '1px solid var(--color-hairline)',
                                  color: 'var(--color-ink)',
                                  textDecoration: 'none',
                                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                                  transition: 'background 0.12s'
                                }}
                              >
                                ▶ {s.songTitle}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {artistRecipe && artistRecipe.length > 0 ? (
                        <div>
                          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 2px' }}>예상 셋리스트</p>
                          <p style={{ fontSize: '11px', color: 'var(--color-muted)', margin: '0 0 12px' }}>각 곡을 열어 지난 공연 영상을 바로 확인하세요</p>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {artistRecipe.map((song, idx) => {
                              const isExpanded = expandedSongIdx === idx
                              const hasPastLinks = song.pastConcertLinks && song.pastConcertLinks.length > 0
                              return (
                                <div key={song.songTitle} style={{ borderBottom: '1px solid var(--color-hairline)' }}>
                                  {/* Song Row */}
                                  <button
                                    onClick={() => setExpandedSongIdx(isExpanded ? null : idx)}
                                    style={{
                                      width: '100%', display: 'grid',
                                      gridTemplateColumns: '28px 1fr auto',
                                      alignItems: 'center', gap: '10px',
                                      padding: '12px 6px',
                                      background: 'none', border: 'none',
                                      cursor: hasPastLinks ? 'pointer' : 'default',
                                      textAlign: 'left', transition: 'background 0.1s',
                                      borderRadius: 'var(--radius-sm)'
                                    }}
                                  >
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', textAlign: 'right' }}>{idx + 1}</span>
                                    <div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                        <span style={{ fontWeight: 700, color: 'var(--color-ink)', fontSize: '14px' }}>{song.songTitle}</span>
                                        {song.originalArtist && (
                                          <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>커버 / {song.originalArtist}</span>
                                        )}
                                      </div>
                                      <div style={{ display: 'flex', gap: '5px', marginTop: '3px', flexWrap: 'wrap', alignItems: 'center' }}>
                                        <span className={`badge badge-${song.songType}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                                          {song.songType === 'released' && '발매곡'}
                                          {song.songType === 'unreleased' && '미발매곡'}
                                          {song.songType === 'cover' && '커버곡'}
                                        </span>
                                        {song.albumInfo && (
                                          <span className={`badge badge-${song.albumInfo.albumType}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                                            {song.albumInfo.albumType.toUpperCase()}
                                          </span>
                                        )}
                                        <span style={{ fontSize: '10px', color: 'var(--color-muted)', fontWeight: 500 }}>
                                          최근 {song.totalConcertCount}회 중 {song.appearanceCount}회
                                        </span>
                                      </div>
                                    </div>
                                    {hasPastLinks && (
                                      <span style={{ fontSize: '11px', color: 'var(--color-muted)', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'block' }}>▾</span>
                                    )}
                                  </button>

                                  {/* Expanded: Past Concert Links */}
                                  {isExpanded && hasPastLinks && (
                                    <div style={{ padding: '4px 6px 12px 44px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      {song.pastConcertLinks!.map(link => (
                                        <div key={link.concertLabel} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                          <span style={{ fontSize: '12px', color: 'var(--color-ink)', fontWeight: 600, minWidth: 0, flex: '1 1 100px' }}>{link.concertLabel}</span>
                                          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                            {link.youtubeFullcamUrl && (
                                              <a
                                                href={link.youtubeFullcamUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title="풀캠 타임스탬프로 바로 이동"
                                                style={{
                                                  fontSize: '11px', fontWeight: 700, padding: '3px 8px',
                                                  borderRadius: 'var(--radius-pill)',
                                                  backgroundColor: 'var(--color-ink)', color: '#fff',
                                                  textDecoration: 'none', whiteSpace: 'nowrap'
                                                }}
                                              >
                                                풀캠 ↗
                                              </a>
                                            )}
                                            {link.youtubeLiveClipUrl && (
                                              <a
                                                href={link.youtubeLiveClipUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title="팬 라이브 클립"
                                                style={{
                                                  fontSize: '11px', fontWeight: 700, padding: '3px 8px',
                                                  borderRadius: 'var(--radius-pill)',
                                                  border: '1px solid var(--color-hairline)',
                                                  backgroundColor: 'var(--color-canvas)', color: 'var(--color-ink)',
                                                  textDecoration: 'none', whiteSpace: 'nowrap'
                                                }}
                                              >
                                                클립 ↗
                                              </a>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-muted)' }}>
                          <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>🥣</span>
                          <h4 style={{ fontWeight: 700, color: 'var(--color-ink)', margin: '0 0 6px', fontSize: '15px' }}>셋리스트 준비 중</h4>
                          <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6 }}>
                            {selectedArtist.name}의 과거 공연 데이터를<br />정리하고 있습니다.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '48px 0', color: 'var(--color-muted)', textAlign: 'center' }}>
                      <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>🎸</span>
                      <h4 style={{ fontWeight: 700, color: 'var(--color-ink)', margin: '0 0 8px', fontSize: '16px' }}>아티스트를 선택하세요</h4>
                      <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6 }}>
                        {festival.lineupStage === 'stage3_timetable'
                          ? '타임테이블의 무대 카드를 클릭하면'
                          : '라인업에서 아티스트를 클릭하면'}<br />
                        예상 셋리스트와 지난 공연 영상 링크가 표시됩니다.
                      </p>
                    </div>
                  )}
                </div>
            </div> {/* End Right Column */}
            </div> {/* End Flex split layout */}

          </div>
        </div>
      </section>

    </div>
  )
}
