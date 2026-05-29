import { Link } from 'react-router-dom'

export default function TopNav() {
  return (
    <nav className="top-nav">
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <Link 
          to="/" 
          style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: 'var(--text-title-lg)', 
            fontWeight: 700, 
            color: 'var(--color-ink)', 
            textDecoration: 'none',
            letterSpacing: '-0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: '28px', 
            height: '28px', 
            borderRadius: '6px', 
            backgroundColor: 'var(--color-ink)', 
            color: 'var(--color-canvas)', 
            fontWeight: 800, 
            fontSize: '15px' 
          }}>
            F
          </span>
          FestRecipe
        </Link>
        
        <div style={{ display: 'flex', gap: '20px' }}>
          <Link 
            to="/" 
            style={{ 
              color: 'var(--color-muted)', 
              textDecoration: 'none', 
              fontSize: 'var(--text-body)',
              fontWeight: 500
            }}
          >
            Festivals
          </Link>
        </div>
      </div>
    </nav>
  )
}
