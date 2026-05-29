import { Link, useLocation } from 'react-router-dom'

const LINKS = [
  { to: '/', label: 'Dashboard', match: (p: string) => p === '/' },
  { to: '/kurse', label: 'Kurse', match: (p: string) => p.startsWith('/kurse') },
  { to: '/teilnehmer', label: 'Teilnehmer', match: (p: string) => p.startsWith('/teilnehmer') },
  { to: '/material', label: 'Material', match: (p: string) => p.startsWith('/material') },
  { to: '/blueprint', label: 'Blueprint', match: (p: string) => p === '/blueprint' },
]

export function Navigation() {
  const { pathname } = useLocation()

  return (
    <nav className="nav-bar">
      <Link to="/" className="nav-brand">
        Pilzkeramik
      </Link>
      <div className="nav-links">
        {LINKS.map((l) => (
          <Link key={l.to} to={l.to} className={l.match(pathname) ? 'nav-link active' : 'nav-link'}>
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
