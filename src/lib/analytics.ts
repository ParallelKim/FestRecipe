import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { logEvent } from 'firebase/analytics'
import { getFirebaseAnalytics } from './firebase'

/** SPA 라우트 변경을 GA4 page_view로 전송 (페이지별 집계용) */
export function usePageTracking() {
  const location = useLocation()

  useEffect(() => {
    let cancelled = false
    getFirebaseAnalytics().then((analytics) => {
      if (!analytics || cancelled) return
      logEvent(analytics, 'page_view', {
        page_location: window.location.href,
        page_path: location.pathname + location.search,
        page_title: document.title,
      })
    })
    return () => {
      cancelled = true
    }
  }, [location.pathname, location.search])
}
