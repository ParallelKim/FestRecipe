import type { Festival } from '../types'

/** 모바일 메인 화면 — 시트 밖에서 듣기·대표곡 진입을 한 줄로 안내 */
export default function PlaylistMobileHint({ festival }: { festival: Festival }) {
  const text =
    festival.lineupStage === 'stage3_timetable'
      ? '아티스트를 누르면 대표곡이 열려요. 하단 내 라인업·듣기로 바로 열 수 있어요.'
      : '아티스트를 눌러 대표곡을 들어 보세요. 하단 내 라인업·듣기로 목록을 관리할 수 있어요.'

  return <p className="playlist-mobile-hint">{text}</p>
}
