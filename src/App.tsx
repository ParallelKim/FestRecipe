import { HelmetProvider } from 'react-helmet-async'
import SiteHeader from './components/layout/SiteHeader'
import Home from './pages/Home'
import FestivalMobile from './pages/FestivalMobile'
import { Navigate, Routes, Route, useParams } from 'react-router-dom'
import { usePageTracking } from './lib/analytics'

function FestivalMobileLegacyRedirect() {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={`/festival/${id}`} replace />
}

export default function App() {
  usePageTracking()
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
