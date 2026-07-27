import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FestivalService } from '../services/festivals'
import type { Festival, Artist, ArtistPlaylist, RecognitionTier } from '../types'
import TimetableGrid from '../components/TimetableGrid'
import FestivalHelmet from '../components/seo/FestivalHelmet'
import {
  buildWatchVideosUrl,
  playlistTitleForArtist,
  playlistTitleForDay,
  playlistTitleForFestival,
} from '../lib/youtubePlaylist'

function tierLabel(tier: RecognitionTier): string {
  if (tier === 'high') return '헤드라이너급 · 대표곡 5'
  if (tier === 'mid') return '메인 타임 · 대표곡 4'
  return '라인업 · 대표곡 3'
}

export default function FestivalDetail() {
  const { id } = useParams<{ id: string }>()

  const [festival, setFestival] = useState<Festival | null>(null)
  const [artists, setArtists] = useState<Artist[]>([])
  const [playlistReady, setPlaylistReady] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const [activeDayIndex, setActiveDayIndex] = useState(0)
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null)
  const [artistPlaylist, setArtistPlaylist] = useState<ArtistPlaylist | null>(null)
  const [playlistLoading, setPlaylistLoading] = useState(false)
  const [bundleLoading, setBundleLoading] = useState<'day' | 'festival' | null>(null)

  useEffect(() => {
    let active = true
    if (!id) return

    Promise.all([
      FestivalService.getFestivalById(id),
      FestivalService.getArtists(),
      FestivalService.getPlaylistIndex(),
    ]).then(([festData, artistsData, playlistIndex]) => {
      if (active) {
        if (festData) setFestival(festData)
        setArtists(artistsData)
        setPlaylistReady(playlistIndex)
        setLoading(false)
      }
    })

    return () => {
      active = false
    }
  }, [id])

  useEffect(() => {
    let active = true
    if (!selectedArtist) {
      setArtistPlaylist(null)
      setPlaylistLoading(false)
      return
    }

    setPlaylistLoading(true)
    FestivalService.getPlaylistForArtist(selectedArtist.id).then((playlist) => {
      if (active) {
        setArtistPlaylist(playlist || null)
        setPlaylistLoading(false)
      }
    })

    return () => {
      active = false
    }
  }, [selectedArtist])

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

  let sigColor = 'var(--color-sig-cream)'
  let sigTextColor = 'var(--color-ink)'
  let sigMutedColor = 'var(--color-muted)'

  if (festival.signatureColor === 'forest') {
    sigColor = 'var(--color-sig-forest)'
    sigTextColor = '#ffffff'
    sigMutedColor = 'rgba(255,255,255,0.7)'
  } else if (festival.signatureColor === 'coral') {
    sigColor = 'var(--color-sig-coral)'
    sigTextColor = '#ffffff'
    sigMutedColor = 'rgba(255,255,255,0.7)'
  } else if (festival.signatureColor === 'dark') {
    sigColor = 'var(--color-surface-dark)'
    sigTextColor = '#ffffff'
    sigMutedColor = 'rgba(255,255,255,0.7)'
  }

  const activeDay = festival.lineup[activeDayIndex]
  const artistMap = new Map(artists.map(a => [a.id, a]))

  const stage1Artists = festival.allArtists
    .map(artistId => artistMap.get(artistId))
    .filter((a): a is Artist => !!a)

  const activeDayArtists = (activeDay?.artists || [])
    .map(artistId => artistMap.get(artistId))
    .filter((a): a is Artist => !!a)

  const handleArtistSelect = (artistId: string) => {
    const artist = artistMap.get(artistId)
    if (artist) {
      setSelectedArtist(artist)
      const panel = document.getElementById('artist-playlist-panel')
      if (panel) panel.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const openBundledPlaylist = async (
    kind: 'day' | 'festival',
    artistIds: string[],
    title: string,
  ) => {
    const ids = artistIds.filter((id) => playlistReady.has(id))
    if (ids.length === 0) return

    setBundleLoading(kind)
    try {
      const playlists = await Promise.all(
        ids.map((id) => FestivalService.getPlaylistForArtist(id)),
      )
      const videoIds = playlists.flatMap((pl) => (pl?.tracks || []).map((t) => t.videoId))
      const url = buildWatchVideosUrl(videoIds, title)
      if (url) window.open(url, '_blank', 'noopener,noreferrer')
    } finally {
      setBundleLoading(null)
    }
  }

  const artistPlaylistTitle = selectedArtist
    ? playlistTitleForArtist(festival.name, selectedArtist.name)
    : ''
  const artistPlaylistUrl = artistPlaylist
    ? buildWatchVideosUrl(
        artistPlaylist.tracks.map((t) => t.videoId),
        artistPlaylistTitle,
      )
    : null
  const dayPlaylistTitle = playlistTitleForDay(festival.name, activeDay?.dayLabel || '')
  const festivalPlaylistTitle = playlistTitleForFestival(festival.name)
  const dayArtistIds = activeDay?.artists?.length
    ? activeDay.artists
    : (activeDay?.slots || []).map((s) => s.artistId)
  const dayReadyCount = dayArtistIds.filter((id) => playlistReady.has(id)).length
  const festivalReadyCount = (festival.allArtists || []).filter((id) => playlistReady.has(id)).length

  const artistCount = festival.lineupStage === 'stage1_all'
    ? (festival.allArtists?.length || 0)
    : festival.lineup.reduce((acc, day) => {
        if (day.artists?.length) return acc + day.artists.length
        if (day.slots?.length) return acc + day.slots.length
        return acc
      }, 0)

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

      <section
        style={{
          backgroundColor: sigColor,
          color: sigTextColor,
          padding: '56px 0',
          borderBottom: festival.signatureColor === 'cream' ? '1px solid var(--color-hairline)' : 'none',
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
              opacity: 0.8,
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

      <section style={{ marginTop: '40px' }}>
        <div className="container">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px' }}>
            <div style={{ flex: '1 1 500px', minWidth: 0 }}>
              {festival.lineupStage === 'stage1_all' && (
                <div className="card-content" style={{ padding: '32px', backgroundColor: 'var(--color-surface-soft)' }}>
                  <h3 className="text-title-md" style={{ color: 'var(--color-ink)', fontWeight: 700, margin: '0 0 8px' }}>
                    공개된 아티스트 라인업 ({stage1Artists.length}팀)
                  </h3>
                  <p className="text-body text-muted" style={{ margin: '0 0 24px' }}>
                    아티스트를 선택하면 YouTube Music 인기 기반 대표곡 플레이리스트를 들을 수 있습니다.
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {stage1Artists.map(artist => {
                      const isSelected = selectedArtist?.id === artist.id
                      const ready = playlistReady.has(artist.id)
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
                            transition: 'all 0.12s ease',
                            opacity: ready ? 1 : 0.72,
                          }}
                          title={ready ? '플레이리스트 준비됨' : '플레이리스트 준비 중'}
                        >
                          {artist.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

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
                          whiteSpace: 'nowrap',
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
                    marginBottom: '40px',
                  }}>
                    {activeDayArtists.map(artist => {
                      const isSelected = selectedArtist?.id === artist.id
                      const ready = playlistReady.has(artist.id)

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
                            margin: isSelected ? '-1px' : '0',
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
                              backgroundColor: ready ? 'var(--color-sig-mint)' : 'var(--color-surface-strong)',
                              color: ready ? '#064e3b' : 'var(--color-muted)',
                              fontSize: '11px',
                              fontWeight: 700,
                            }}
                          >
                            {ready ? '플레이리스트 준비됨' : '준비 중'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

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
                          whiteSpace: 'nowrap',
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
            </div>

            <div style={{ flex: '1 1 350px', position: 'sticky', top: '80px', height: 'fit-content' }}>
              <div id="artist-playlist-panel" className="card-content" style={{ padding: '28px', minHeight: '300px' }}>
                {selectedArtist ? (
                  <div>
                    <div style={{ marginBottom: '4px' }}>
                      <h3 style={{ color: 'var(--color-ink)', fontWeight: 800, margin: '0 0 4px', fontSize: '18px', letterSpacing: '-0.4px' }}>
                        {selectedArtist.name}
                      </h3>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)', lineHeight: 1.5 }}>
                        {artistPlaylist
                          ? tierLabel(artistPlaylist.recognition.tier)
                          : 'YouTube Music 인기곡 기반 대표 플레이리스트'}
                      </p>
                      {artistPlaylist?.recognition.reason === 'no_timetable_default' && (
                        <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'var(--color-muted)' }}>
                          타임테이블 공개 전 · 기본 3곡 (늦은 슬롯일수록 4~5곡으로 확대)
                        </p>
                      )}
                      {artistPlaylist?.recognition.latestSlotLabel && (
                        <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'var(--color-muted)' }}>
                          기준 슬롯 {artistPlaylist.recognition.latestSlotLabel}
                        </p>
                      )}
                    </div>

                    {playlistLoading ? (
                      <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--color-muted)' }}>
                        <p style={{ margin: 0, fontSize: '13px' }}>플레이리스트 불러오는 중...</p>
                      </div>
                    ) : artistPlaylist && artistPlaylist.tracks.length > 0 ? (
                      <div style={{ marginTop: '16px' }}>
                        {artistPlaylistUrl && (
                          <a
                            href={artistPlaylistUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-primary"
                            style={{
                              fontSize: '12px',
                              fontWeight: 700,
                              textDecoration: 'none',
                              textAlign: 'center',
                              padding: '10px 12px',
                              display: 'block',
                              marginBottom: '16px',
                            }}
                          >
                            ▶ 대표곡 {artistPlaylist.songCount}곡 연속 재생
                          </a>
                        )}

                        <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px' }}>
                          대표곡 · {artistPlaylistTitle}
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          {artistPlaylist.tracks.map((track, idx) => {
                            const startIds = [
                              ...artistPlaylist.tracks.slice(idx).map(t => t.videoId),
                              ...artistPlaylist.tracks.slice(0, idx).map(t => t.videoId),
                            ]
                            const fromHereUrl = buildWatchVideosUrl(startIds, artistPlaylistTitle) || '#'

                            return (
                              <div key={track.videoId} style={{ borderBottom: '1px solid var(--color-hairline)', padding: '12px 0', display: 'grid', gridTemplateColumns: '28px 1fr auto', gap: '10px', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', textAlign: 'right' }}>{idx + 1}</span>
                                <div>
                                  <div style={{ fontWeight: 700, color: 'var(--color-ink)', fontSize: '14px' }}>{track.songTitle}</div>
                                  {track.albumTitle && (
                                    <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginTop: '2px' }}>
                                      {track.albumTitle}{track.year ? ` · ${track.year}` : ''}
                                    </div>
                                  )}
                                </div>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <a
                                    href={track.youtubeMusicUrl || track.youtubeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      padding: '4px 8px',
                                      borderRadius: 'var(--radius-pill)',
                                      border: '1px solid var(--color-hairline)',
                                      color: 'var(--color-ink)',
                                      textDecoration: 'none',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    곡 ▶
                                  </a>
                                  <a
                                    href={fromHereUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      padding: '4px 8px',
                                      borderRadius: 'var(--radius-pill)',
                                      backgroundColor: 'var(--color-ink)',
                                      color: '#fff',
                                      textDecoration: 'none',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    여기부터
                                  </a>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-muted)' }}>
                        <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>🎧</span>
                        <h4 style={{ fontWeight: 700, color: 'var(--color-ink)', margin: '0 0 6px', fontSize: '15px' }}>플레이리스트 준비 중</h4>
                        <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6 }}>
                          {selectedArtist.name}의 YouTube Music<br />대표곡을 모으고 있습니다.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'center', height: '100%', padding: '28px 0', color: 'var(--color-muted)', textAlign: 'center' }}>
                    <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>🎸</span>
                    <h4 style={{ fontWeight: 700, color: 'var(--color-ink)', margin: '0 0 8px', fontSize: '16px' }}>아티스트를 선택하세요</h4>
                    <p style={{ margin: '0 0 20px', fontSize: '13px', lineHeight: 1.6 }}>
                      {festival.lineupStage === 'stage3_timetable'
                        ? '타임테이블의 무대 카드를 클릭하면'
                        : '라인업에서 아티스트를 클릭하면'}
                      <br />
                      인지도에 맞는 대표곡 플레이리스트가 표시됩니다.
                    </p>

                    {(dayReadyCount > 0 || festivalReadyCount > 0) && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                        {dayReadyCount > 0 && activeDay && (
                          <button
                            type="button"
                            className="btn-primary"
                            disabled={bundleLoading !== null}
                            onClick={() => openBundledPlaylist('day', dayArtistIds, dayPlaylistTitle)}
                            style={{
                              fontSize: '12px',
                              fontWeight: 700,
                              padding: '10px 12px',
                              border: 'none',
                              cursor: bundleLoading ? 'wait' : 'pointer',
                              opacity: bundleLoading && bundleLoading !== 'day' ? 0.6 : 1,
                            }}
                          >
                            {bundleLoading === 'day' ? '여는 중…' : `▶ ${activeDay.dayLabel} 대표곡 듣기`}
                          </button>
                        )}
                        {festivalReadyCount > 0 && (
                          <button
                            type="button"
                            disabled={bundleLoading !== null}
                            onClick={() => openBundledPlaylist('festival', festival.allArtists || [], festivalPlaylistTitle)}
                            style={{
                              fontSize: '12px',
                              fontWeight: 700,
                              padding: '10px 12px',
                              borderRadius: 'var(--radius-pill)',
                              border: '1px solid var(--color-hairline)',
                              backgroundColor: 'var(--color-canvas)',
                              color: 'var(--color-ink)',
                              cursor: bundleLoading ? 'wait' : 'pointer',
                              opacity: bundleLoading && bundleLoading !== 'festival' ? 0.6 : 1,
                            }}
                          >
                            {bundleLoading === 'festival' ? '여는 중…' : '▶ 페스티벌 전체 대표곡 듣기'}
                          </button>
                        )}
                        <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--color-muted)', lineHeight: 1.5 }}>
                          YouTube에서 재생목록 이름으로 표시됩니다.
                          {dayReadyCount > 0 && activeDay ? ` · 요일: ${dayPlaylistTitle}` : ''}
                          {festivalReadyCount > 0 ? ` · 전체: ${festivalPlaylistTitle}` : ''}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
