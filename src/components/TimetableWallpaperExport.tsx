import { useMemo, useState } from 'react'
import type { Artist, DayLineup, Festival } from '../types'
import { officialArtistName } from '../lib/artistOfficialName'
import {
  TIMETABLE_WALLPAPER_PRESETS,
  type TimetableWallpaperPresetId,
  downloadTimetableWallpaper,
  resolveWallpaperPixelSize,
} from '../lib/exportTimetableWallpaper'

interface TimetableWallpaperExportProps {
  festival: Festival
  activeDay?: DayLineup
  artists: Artist[]
  myLineupIds: string[]
}

export default function TimetableWallpaperExport({
  festival,
  activeDay,
  artists,
  myLineupIds,
}: TimetableWallpaperExportProps) {
  const [presetId, setPresetId] = useState<TimetableWallpaperPresetId>('1080x2400')
  const [scalePercent, setScalePercent] = useState(100)
  const [status, setStatus] = useState<string | null>(null)

  const canExport =
    festival.lineupStage === 'stage3_timetable' &&
    !!activeDay?.slots?.length &&
    !!activeDay.stages?.length

  const highlightOnDay = useMemo(() => {
    const ids = new Set(myLineupIds)
    const onDay = new Set<string>()
    for (const slot of activeDay?.slots || []) {
      if (ids.has(slot.artistId)) onDay.add(slot.artistId)
    }
    return onDay
  }, [activeDay?.slots, myLineupIds])

  const artistNames = useMemo(() => {
    const map: Record<string, string> = {}
    for (const a of artists) {
      map[a.id] = officialArtistName(a)
    }
    return map
  }, [artists])

  const pixelSize = resolveWallpaperPixelSize(presetId, scalePercent)

  const handleDownload = () => {
    if (!canExport || !activeDay?.stages || !activeDay.slots) {
      setStatus('타임테이블이 준비되면 저장할 수 있습니다.')
      return
    }
    if (myLineupIds.length === 0) {
      setStatus('먼저 볼 아티스트를 담아 주세요.')
      return
    }
    if (highlightOnDay.size === 0) {
      setStatus('이 날짜 타임테이블에 담은 아티스트가 없습니다. 다른 일자를 선택해 보세요.')
      return
    }

    const ok = downloadTimetableWallpaper({
      festivalName: festival.name,
      dayLabel: activeDay.dayLabel,
      stages: activeDay.stages,
      slots: activeDay.slots,
      highlightArtistIds: new Set(myLineupIds),
      artistNames,
      stageStyles: festival.stageStyles,
      width: pixelSize.width,
      height: pixelSize.height,
    })
    setStatus(ok ? `${pixelSize.width}×${pixelSize.height} PNG를 저장했습니다.` : '저장에 실패했습니다.')
  }

  if (!canExport) {
    return (
      <div className="wallpaper-export wallpaper-export--disabled">
        <h5 className="wallpaper-export__title">배경화면 타임테이블</h5>
        <p className="wallpaper-export__hint">
          타임테이블이 공개되면, 내 라인업이 강조된 일정표를 휴대폰 배경화면 크기로 저장할 수 있습니다.
        </p>
      </div>
    )
  }

  return (
    <div className="wallpaper-export">
      <h5 className="wallpaper-export__title">배경화면 타임테이블</h5>
      <p className="wallpaper-export__hint">
        <strong>{activeDay?.dayLabel}</strong> 일정에서 담은 아티스트({highlightOnDay.size}팀)가 강조된
        이미지를 저장합니다.
      </p>

      <label className="wallpaper-export__field">
        <span className="wallpaper-export__label">화면 크기</span>
        <select
          className="wallpaper-export__select"
          value={presetId}
          onChange={(e) => setPresetId(e.target.value as TimetableWallpaperPresetId)}
        >
          {TIMETABLE_WALLPAPER_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </label>

      <label className="wallpaper-export__field">
        <span className="wallpaper-export__label">
          해상도 배율 <strong>{scalePercent}%</strong>
          <span className="wallpaper-export__pixels">
            → {pixelSize.width} × {pixelSize.height}px
          </span>
        </span>
        <input
          type="range"
          className="wallpaper-export__range"
          min={50}
          max={200}
          step={5}
          value={scalePercent}
          onChange={(e) => setScalePercent(Number(e.target.value))}
        />
      </label>

      <button
        type="button"
        className="btn-secondary wallpaper-export__btn"
        disabled={myLineupIds.length === 0}
        onClick={handleDownload}
      >
        배경화면 PNG 저장
      </button>

      {status && (
        <p className="wallpaper-export__status" role="status">
          {status}
        </p>
      )}
    </div>
  )
}
