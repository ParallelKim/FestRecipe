/**
 * 스마트폰 세로 배경화면 프로필.
 *
 * 참고 (2025–2026 일반론):
 * - 최근 iPhone·안드로이드 플래그십: 세로 약 19.5:9 ~ 20:9
 * - iOS 잠금화면: 상단 시계·다이내믹 아일랜드(~12–15%), 하단 홈 인디케이터·독(~22–25%)에 UI가 겹침
 * - Android 홈: 상단 위젯·하단 독/제스처 바가 타임테이블을 가리기 쉬움 → 콘텐츠는 가운데 밴드에
 * - 보내기는 기기 물리 픽셀(또는 프리셋)과 **같은 비율·목표 너비**로 저장해야 시스템 자르기에서 레터박스가 없다
 */

export type WallpaperProfileSource = 'device' | 'preset'

export interface WallpaperProfile {
  id: string
  label: string
  /** 짧은 칩 라벨 */
  shortLabel: string
  width: number
  height: number
  /** width / height */
  ratio: number
  /** 잠금·홈 상단 UI(시계·위젯) — 프레임 높이 대비, 콘텐츠를 이 아래로 */
  safeTopRatio: number
  /** 하단 독·제스처·홈 인디케이터 */
  safeBottomRatio: number
  source: WallpaperProfileSource
}

/** 잠금 시계 + 홈 위젯을 피하기 위한 콘텐츠 밴드 (미리보기·실제 배치 공통) */
const SAFE_TOP_IOS = 0.18
const SAFE_BOTTOM_IOS = 0.24
const SAFE_TOP_ANDROID = 0.26
const SAFE_BOTTOM_ANDROID = 0.22

export const WALLPAPER_PRESET_PROFILES: WallpaperProfile[] = [
  {
    id: 'iphone-universal',
    label: 'iPhone 범용 (1290×2796)',
    shortLabel: 'iPhone',
    width: 1290,
    height: 2796,
    ratio: 1290 / 2796,
    safeTopRatio: SAFE_TOP_IOS,
    safeBottomRatio: SAFE_BOTTOM_IOS,
    source: 'preset',
  },
  {
    id: 'iphone-14',
    label: 'iPhone 14 / 13 (1170×2532)',
    shortLabel: 'iPhone 14',
    width: 1170,
    height: 2532,
    ratio: 1170 / 2532,
    safeTopRatio: SAFE_TOP_IOS,
    safeBottomRatio: SAFE_BOTTOM_IOS,
    source: 'preset',
  },
  {
    id: 'android-fhd',
    label: 'Android FHD+ (1080×2400)',
    shortLabel: 'FHD+',
    width: 1080,
    height: 2400,
    ratio: 1080 / 2400,
    safeTopRatio: SAFE_TOP_ANDROID,
    safeBottomRatio: SAFE_BOTTOM_ANDROID,
    source: 'preset',
  },
  {
    id: 'android-qhd',
    label: 'Android QHD+ (1440×3200)',
    shortLabel: 'QHD+',
    width: 1440,
    height: 3200,
    ratio: 1440 / 3200,
    safeTopRatio: SAFE_TOP_ANDROID,
    safeBottomRatio: SAFE_BOTTOM_ANDROID,
    source: 'preset',
  },
]

/**
 * CSS 뷰포트·DPR 기반 이 기기 추정.
 * screen이 이미 물리 픽셀로 보고되는 브라우저(일부 Android)는 dpr을 한 번만 쓴다.
 */
export function detectDeviceWallpaperProfile(): WallpaperProfile {
  const rawW = window.screen.width || window.innerWidth
  const rawH = window.screen.height || window.innerHeight
  const cssW = Math.min(rawW, rawH)
  const cssH = Math.max(rawW, rawH)
  const dpr = window.devicePixelRatio || 1

  // screen 값이 CSS 픽셀 범위(≤ ~600)면 dpr 곱, 이미 물리 픽셀대(≥ ~700)면 그대로
  const looksLikeCssPixels = cssW <= 600
  const width = Math.round(looksLikeCssPixels ? cssW * dpr : cssW)
  const height = Math.round(looksLikeCssPixels ? cssH * dpr : cssH)

  const isAndroid = /Android/i.test(navigator.userAgent)
  return {
    id: 'device',
    label: `이 기기 (${width}×${height}px)`,
    shortLabel: '이 기기',
    width,
    height,
    ratio: width / height,
    safeTopRatio: isAndroid ? SAFE_TOP_ANDROID : SAFE_TOP_IOS,
    safeBottomRatio: isAndroid ? SAFE_BOTTOM_ANDROID : SAFE_BOTTOM_IOS,
    source: 'device',
  }
}

export function resolveWallpaperProfile(profileId: string): WallpaperProfile {
  if (profileId === 'device') return detectDeviceWallpaperProfile()
  return (
    WALLPAPER_PRESET_PROFILES.find((p) => p.id === profileId) ??
    WALLPAPER_PRESET_PROFILES[0]
  )
}

/** 스튜디오 미리보기 프레임 크기 (px, CSS). */
export function computeWallpaperPreviewSize(
  profile: WallpaperProfile,
  stageMaxWidth: number,
  stageMaxHeight: number,
): { width: number; height: number } {
  const pad = 8
  const maxW = Math.max(120, stageMaxWidth - pad)
  const maxH = Math.max(200, stageMaxHeight - pad)
  let height = maxH
  let width = height * profile.ratio
  if (width > maxW) {
    width = maxW
    height = width / profile.ratio
  }
  return {
    width: Math.floor(width),
    height: Math.floor(height),
  }
}

/**
 * PNG 저장 시 html-to-image pixelRatio — 프레임 CSS 너비 → 프로필 물리 너비.
 * 상한을 넉넉히 두어 작은 미리보기에서도 목표 해상도에 도달한다.
 */
export function exportPixelRatioForFrame(
  profile: WallpaperProfile,
  frameCssWidth: number,
): number {
  if (frameCssWidth < 1) return 2
  return Math.min(16, Math.max(1, profile.width / frameCssWidth))
}
