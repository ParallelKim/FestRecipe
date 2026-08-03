import { useState } from 'react'
import type { Artist, DayLineup, Festival } from '../types'
import TimetableWallpaperStudio, { TimetableWallpaperEntry } from './TimetableWallpaperStudio'

interface WallpaperMobileSectionProps {
  festival: Festival
  activeDay?: DayLineup
  artists: Artist[]
  myLineupIds: string[]
  /** 라인업 시트 안에 넣을 때 */
  embedded?: boolean
}

/** 배경화면 타임테이블 — 라인업 시트 또는 메인(레거시) */
export default function WallpaperMobileSection({
  festival,
  activeDay,
  artists,
  myLineupIds,
  embedded = false,
}: WallpaperMobileSectionProps) {
  const [studioOpen, setStudioOpen] = useState(false)

  if (festival.lineupStage !== 'stage3_timetable') return null

  return (
    <section
      id={embedded ? undefined : 'wallpaper-mobile'}
      className={
        embedded
          ? 'wallpaper-mobile-embedded'
          : 'festival-mobile-block festival-mobile-block--wallpaper'
      }
    >
      <TimetableWallpaperEntry
        festival={festival}
        activeDay={activeDay}
        onOpenStudio={() => setStudioOpen(true)}
      />
      <TimetableWallpaperStudio
        open={studioOpen}
        onClose={() => setStudioOpen(false)}
        festival={festival}
        activeDay={activeDay}
        artists={artists}
        myLineupIds={myLineupIds}
      />
    </section>
  )
}
