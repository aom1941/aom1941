import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type DashboardResponse } from '../api'

const STATUS_LABELS: Record<string, string> = {
  geplant: 'Geplant',
  aktiv: 'Aktiv',
  abgeschlossen: 'Abgeschlossen',
  abgesagt: 'Abgesagt',
}

function formatDatum(datum: string): string {
  return new Date(datum + 'T00:00:00').toLocaleDateString('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function AuslastungBar({ belegt, max }: { belegt: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((belegt / max) * 100)) : 0
  const color = pct >= 90 ? '#f87171' : pct >= 70 ? '#fbbf24' : '#6ee08d'
  return (
    <div className="auslastung-wrap">
      <div className="auslastung-bar">
        <div className="auslastung-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="auslastung-label">
        {belegt}/{max}
      </span>
    </div>
  )
}

export function Dashboard() {
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.dashboard
      .get()
      .then(setData)
      .catch(() => setError('Dashboard konnte nicht geladen werden. Ist das Backend erreichbar?'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="page-shell"><p className="notice">Lade Dashboard…</p></div>
  if (error || !data) return <div className="page-shell"><p className="notice warning">{error ?? 'Fehler beim Laden.'}</p></div>

  const { stats, naechste_termine } = data

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Pilzkeramik Werkstattboard</p>
          <h1 className="page-title">Dashboard</h1>
        </div>
        <Link to="/kurse/neu" className="btn-primary">+ Neuer Kurs</Link>
      </div>

      {/* Stats */}
      <section className="metrics-grid">
        <article className="metric-card">
          <span>Kurse gesamt</span>
          <strong>{stats.kurse_gesamt}</strong>
          <p>{stats.kurse_aktiv} aktiv</p>
        </article>
        <article className="metric-card">
          <span>Teilnehmer</span>
          <strong>{stats.teilnehmer_gesamt}</strong>
          <p>registriert</p>
        </article>
        <article className="metric-card">
          <span>Anmeldungen</span>
          <strong>{stats.anmeldungen_gesamt}</strong>
          <p>gesamt</p>
        </article>
      </section>

      {/* Upcoming dates */}
      <article className="panel">
        <div className="panel-heading">
          <h2>Nächste Termine</h2>
          <p>Kommende Kursdaten mit Auslastung.</p>
        </div>

        {naechste_termine.length === 0 ? (
          <p className="muted-text">
            Keine bevorstehenden Termine — <Link to="/kurse/neu">neuen Kurs anlegen</Link> oder Termine in bestehenden Kursen einplanen.
          </p>
        ) : (
          <table className="teilnehmer-table">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Uhrzeit</th>
                <th>Kurs</th>
                <th>Status</th>
                <th>Auslastung</th>
              </tr>
            </thead>
            <tbody>
              {naechste_termine.map((t) => (
                <tr key={t.termin_id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDatum(t.datum)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {t.start_uhrzeit ? t.start_uhrzeit.slice(0, 5) + ' Uhr' : '—'}
                  </td>
                  <td>
                    <Link to={`/kurse/${t.kurs_id}`} className="kurs-link">
                      {t.kurs_name}
                    </Link>
                  </td>
                  <td>
                    <span className={`status-badge status-${t.kurs_status}`}>
                      {STATUS_LABELS[t.kurs_status] ?? t.kurs_status}
                    </span>
                  </td>
                  <td>
                    <AuslastungBar belegt={t.anmeldungen} max={t.max_teilnehmer} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </article>

      {/* Quick links */}
      <div className="quick-links">
        <Link to="/kurse" className="quick-link-card">
          <strong>Alle Kurse</strong>
          <span>Kursliste öffnen</span>
        </Link>
        <Link to="/teilnehmer" className="quick-link-card">
          <strong>Alle Teilnehmer</strong>
          <span>Teilnehmerliste öffnen</span>
        </Link>
      </div>
    </div>
  )
}
