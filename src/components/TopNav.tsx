import { Link } from 'react-router-dom'

export default function TopNav() {
  return (
    <nav className="top-nav">
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <Link
          to="/"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-title-md)',
            fontWeight: 700,
            color: 'var(--color-ink)',
            textDecoration: 'none',
            letterSpacing: '-0.015em',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: 'var(--color-ink)',
              color: 'var(--color-canvas)',
              fontWeight: 800,
              fontSize: '14px',
              fontFamily: 'var(--font-display)',
              letterSpacing: 0,
            }}
          >
            F
          </span>
          FestRecipe
        </Link>

        <Link
          to="/"
          style={{
            color: 'var(--color-muted)',
            textDecoration: 'none',
            fontSize: 'var(--text-body)',
            fontWeight: 600,
          }}
        >
          페스티벌
        </Link>
      </div>
    </nav>
  )
}
