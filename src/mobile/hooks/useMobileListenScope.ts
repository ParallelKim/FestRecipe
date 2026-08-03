import { useCallback, useRef, useState } from 'react'

export type ListenScope = 'day' | 'festival' | 'custom'

export function listenScopeLabel(scope: ListenScope, dayLabel: string): string {
  switch (scope) {
    case 'day':
      return dayLabel || '이 날'
    case 'festival':
      return '페스티벌 전체'
    case 'custom':
      return '나만의 플레이리스트'
  }
}

/**
 * 듣기 스코프
 * - custom는 activeDay에 담은 팀만 — 요일 바뀔 때마다 문맥 재조정
 * - 쉐버론으로 festival 고른 경우만 요일 변경 시 유지
 * - 그 날 첫 담기 → custom (festival 고정 선택 시 제외)
 * - 비우기·라인업 전체 0 → day 복귀
 */
export function useMobileListenScope() {
  const [scope, setScope] = useState<ListenScope>('day')
  const userPickedRef = useRef(false)

  const pickScope = useCallback((next: ListenScope) => {
    userPickedRef.current = true
    setScope(next)
  }, [])

  /** 요일 전환 — 나만의 플레이리스트는 그날에만 적용 */
  const syncForActiveDay = useCallback((lineupOnDayCount: number) => {
    setScope((current) => {
      if (userPickedRef.current && current === 'festival') return current
      if (lineupOnDayCount > 0) return 'custom'
      return 'day'
    })
  }, [])

  /** 그 날 라인업이 비었을 때 첫 담기 */
  const applyContextualCustom = useCallback(() => {
    setScope((current) => {
      if (userPickedRef.current && current === 'festival') return current
      return 'custom'
    })
  }, [])

  const resetAfterStrongAction = useCallback(() => {
    userPickedRef.current = false
    setScope('day')
  }, [])

  const syncLineupEmpty = useCallback((totalLineupCount: number) => {
    if (totalLineupCount === 0) {
      userPickedRef.current = false
      setScope('day')
    }
  }, [])

  return {
    scope,
    pickScope,
    syncForActiveDay,
    applyContextualCustom,
    resetAfterStrongAction,
    syncLineupEmpty,
  }
}
