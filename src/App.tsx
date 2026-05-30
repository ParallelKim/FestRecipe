import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import TopNav from './components/TopNav'
import Home from './pages/Home'
import FestivalDetail from './pages/FestivalDetail'

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <TopNav />
          <main style={{ flexGrow: 1 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/festival/:id" element={<FestivalDetail />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </HelmetProvider>
  )
}
