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
 * 듣기 스코프 — 쉐버론 선택은 userPicked까지 유지.
 * 강한 트리거(비우기 등) 또는 라인업 전체 비움 시 day로 복귀.
 * 첫 담기 1회만 문맥적으로 custom 전환 (userPicked 전).
 */
export function useMobileListenScope() {
  const [scope, setScope] = useState<ListenScope>('day')
  const userPickedRef = useRef(false)
  const contextualCustomDoneRef = useRef(false)

  const pickScope = useCallback((next: ListenScope) => {
    userPickedRef.current = true
    setScope(next)
  }, [])

  const applyContextualCustom = useCallback(() => {
    if (userPickedRef.current || contextualCustomDoneRef.current) return
    setScope('custom')
    contextualCustomDoneRef.current = true
  }, [])

  const resetAfterStrongAction = useCallback(() => {
    userPickedRef.current = false
    setScope('day')
  }, [])

  const syncLineupEmpty = useCallback((totalLineupCount: number) => {
    if (totalLineupCount === 0) {
      userPickedRef.current = false
      contextualCustomDoneRef.current = false
      setScope('day')
    }
  }, [])

  return {
    scope,
    pickScope,
    applyContextualCustom,
    resetAfterStrongAction,
    syncLineupEmpty,
  }
}
