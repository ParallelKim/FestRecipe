import { HelmetProvider } from 'react-helmet-async'
import TopNav from './components/TopNav'
import Home from './pages/Home'
import FestivalDetail from './pages/FestivalDetail'
import { Routes, Route } from 'react-router-dom'

export default function App() {
  return (
    <HelmetProvider>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <TopNav />
        <main style={{ flexGrow: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/festival/:id" element={<FestivalDetail />} />
          </Routes>
        </main>
      </div>
    </HelmetProvider>
  )
}
