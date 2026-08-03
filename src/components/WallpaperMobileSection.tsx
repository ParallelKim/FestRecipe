import { useState } from 'react'
import type { Artist, DayLineup, Festival } from '../types'
import TimetableWallpaperStudio, { TimetableWallpaperEntry } from './TimetableWallpaperStudio'

interface WallpaperMobileSectionProps {
  festival: Festival
  activeDay?: DayLineup
  artists: Artist[]
  myLineupIds: string[]
}

/** 모바일 메인 — 내 라인업과 분리된 배경화면 타임테이블 */
export default function WallpaperMobileSection({
  festival,
  activeDay,
  artists,
  myLineupIds,
}: WallpaperMobileSectionProps) {
  const [studioOpen, setStudioOpen] = useState(false)

  if (festival.lineupStage !== 'stage3_timetable') return null

  return (
    <section id="wallpaper-mobile" className="festival-mobile-block festival-mobile-block--wallpaper">
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
