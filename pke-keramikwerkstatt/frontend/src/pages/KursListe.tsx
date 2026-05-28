import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type KursResponse } from '../api'
import { KursCard } from '../components/KursCard'

export function KursListe() {
  const [kurse, setKurse] = useState<KursResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.kurse
      .list()
      .then(setKurse)
      .catch(() => setError('Kurse konnten nicht geladen werden. Ist das Backend erreichbar?'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">Kurse</h1>
          <p>Alle Kurse und Workshops im Überblick.</p>
        </div>
        <Link to="/kurse/neu" className="btn-primary">
          + Neuer Kurs
        </Link>
      </div>

      {error && <p className="notice warning">{error}</p>}
      {loading && <p className="notice">Lade Kurse…</p>}

      {!loading && !error && kurse.length === 0 && (
        <p className="notice">Noch keine Kurse angelegt. Lege den ersten Kurs an!</p>
      )}

      <div className="card-grid">
        {kurse.map((k) => (
          <KursCard key={k.id} kurs={k} />
        ))}
      </div>
    </div>
  )
}
