/** 메인 페스티벌 화면 타임테이블과 동일한 렌더 너비(CSS px). */
export const MAIN_TIMETABLE_REF_WIDTH = 390

/**
 * 메인 타임테이블을 배경화면 안에 맞추기 위한 균등 축소 비율.
 */
export function computeWallpaperScale(
  sourceWidth: number,
  sourceHeight: number,
  maxWidth: number,
  maxHeight: number,
): number {
  if (sourceWidth <= 0 || sourceHeight <= 0 || maxWidth <= 0 || maxHeight <= 0) {
    return 1
  }
  const s = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight)
  return Math.min(1, Math.max(0.18, s))
}
