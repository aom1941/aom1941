import { Link, useLocation } from 'react-router-dom'

export function Navigation() {
  const { pathname } = useLocation()

  return (
    <nav className="nav-bar">
      <Link to="/" className="nav-brand">
        Pilzkeramik Werkstattboard
      </Link>
      <div className="nav-links">
        <Link to="/" className={pathname === '/' || pathname.startsWith('/kurse') ? 'nav-link active' : 'nav-link'}>
          Kurse
        </Link>
        <Link to="/blueprint" className={pathname === '/blueprint' ? 'nav-link active' : 'nav-link'}>
          Blueprint
        </Link>
      </div>
    </nav>
  )
}
