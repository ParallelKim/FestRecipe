import { useEffect } from 'react'
import { HelmetProvider } from 'react-helmet-async'
import SiteHeader from './components/layout/SiteHeader'
import Home from './pages/Home'
import FestivalMobile from './pages/FestivalMobile'
import PastFestivals from './pages/PastFestivals'
import { Navigate, Routes, Route, useParams, useLocation } from 'react-router-dom'
import { usePageTracking } from './lib/analytics'
import { preloadPlaylists } from './data/playlistData'

function FestivalMobileLegacyRedirect() {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={`/festival/${id}`} replace />
}

/** SPA 라우트 전환 시 이전 페이지 스크롤 위치가 남지 않도록 초기화 */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])
  return null
}

export default function App() {
  usePageTracking()

  // 첫 페인트 이후 유휴 시점에 대표곡 전체 청크를 프리로드해 캐싱
  // → 이후 아티스트 선택·듣기 상호작용을 네트워크 왕복 없이 즉시 처리
  useEffect(() => {
    const schedule =
      window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 200))
    const cancel = window.cancelIdleCallback ?? window.clearTimeout
    const handle = schedule(() => preloadPlaylists())
    return () => cancel(handle as number)
  }, [])

  return (
    <HelmetProvider>
      <ScrollToTop />
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <SiteHeader />
        <main style={{ flexGrow: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/festivals/past" element={<PastFestivals />} />
            <Route path="/festival/:id/m" element={<FestivalMobileLegacyRedirect />} />
            <Route path="/festival/:id" element={<FestivalMobile />} />
          </Routes>
        </main>
      </div>
    </HelmetProvider>
  )
}
