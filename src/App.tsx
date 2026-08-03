import { HelmetProvider } from 'react-helmet-async'
import TopNav from './components/TopNav'
import Home from './pages/Home'
import FestivalDetail from './pages/FestivalDetail'
import FestivalMobile from './pages/FestivalMobile'
import { Routes, Route } from 'react-router-dom'
import { usePageTracking } from './lib/analytics'

export default function App() {
  usePageTracking()
  return (
    <HelmetProvider>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <TopNav />
        <main style={{ flexGrow: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/festival/:id/m" element={<FestivalMobile />} />
            <Route path="/festival/:id" element={<FestivalDetail />} />
          </Routes>
        </main>
      </div>
    </HelmetProvider>
  )
}
