import { useEffect } from 'react'
import { HelmetProvider } from 'react-helmet-async'
import SiteHeader from './components/layout/SiteHeader'
import Home from './pages/Home'
import FestivalMobile from './pages/FestivalMobile'
import { Navigate, Routes, Route, useParams } from 'react-router-dom'
import { usePageTracking } from './lib/analytics'
import { preloadPlaylists } from './data/playlistData'

function FestivalMobileLegacyRedirect() {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={`/festival/${id}`} replace />
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
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <SiteHeader />
        <main style={{ flexGrow: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/festival/:id/m" element={<FestivalMobileLegacyRedirect />} />
            <Route path="/festival/:id" element={<FestivalMobile />} />
          </Routes>
        </main>
      </div>
    </HelmetProvider>
  )
}
