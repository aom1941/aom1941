import { Fragment, useEffect, useState } from 'react'
import { api, type AnmeldungWithKurs, type TeilnehmerListItem, type TeilnehmerWithKurse } from '../api'

const ANMELDUNG_LABELS: Record<string, string> = {
  bestaetigt: 'Bestätigt',
  warteliste: 'Warteliste',
  abgesagt: 'Abgesagt',
}

function KursHistorie({ teilnehmerId }: { teilnehmerId: number }) {
  const [detail, setDetail] = useState<TeilnehmerWithKurse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.teilnehmer
      .get(teilnehmerId)
      .then(setDetail)
      .finally(() => setLoading(false))
  }, [teilnehmerId])

  if (loading) return <p className="muted-text">Lade Kurshistorie…</p>
  if (!detail || detail.anmeldungen.length === 0) return <p className="muted-text">Noch keine Kursanmeldungen.</p>

  return (
    <ul className="kurs-historie-list">
      {detail.anmeldungen
        .slice()
        .sort((a: AnmeldungWithKurs, b: AnmeldungWithKurs) => b.angemeldet_am.localeCompare(a.angemeldet_am))
        .map((a: AnmeldungWithKurs) => (
          <li key={a.id} className="kurs-historie-item">
            <span className="kurs-historie-name">{a.kurs.name}</span>
            <span className={`status-badge status-${a.status}`}>
              {ANMELDUNG_LABELS[a.status] ?? a.status}
            </span>
          </li>
        ))}
    </ul>
  )
}

export function TeilnehmerListe() {
  const [alle, setAlle] = useState<TeilnehmerListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [suche, setSuche] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)

  useEffect(() => {
    api.teilnehmer
      .list()
      .then(setAlle)
      .catch(() => setError('Teilnehmerliste konnte nicht geladen werden.'))
      .finally(() => setLoading(false))
  }, [])

  const gefiltert = suche.trim()
    ? alle.filter((t) => {
        const q = suche.toLowerCase()
        return (
          t.vorname.toLowerCase().includes(q) ||
          t.nachname.toLowerCase().includes(q) ||
          (t.telefon?.includes(q) ?? false) ||
          (t.email?.toLowerCase().includes(q) ?? false)
        )
      })
    : alle

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">Teilnehmer</h1>
          <p>Alle registrierten Kursteilnehmer.</p>
        </div>
      </div>

      {error && <p className="notice warning">{error}</p>}

      <div className="search-bar">
        <input
          type="search"
          placeholder="Nach Name, Telefon oder E-Mail suchen…"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
        />
      </div>

      {loading && <p className="notice">Lade Teilnehmer…</p>}

      {!loading && !error && gefiltert.length === 0 && (
        <p className="notice">
          {suche ? 'Keine Treffer für diese Suche.' : 'Noch keine Teilnehmer vorhanden.'}
        </p>
      )}

      {gefiltert.length > 0 && (
        <article className="panel" style={{ padding: 0 }}>
          <table className="teilnehmer-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Telefon</th>
                <th>E-Mail</th>
                <th>Kurse</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {gefiltert.map((t) => (
                <Fragment key={t.id}>
                  <tr
                    className={expanded === t.id ? 'row-expanded' : ''}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                  >
                    <td>
                      <strong style={{ color: 'var(--text-h)' }}>
                        {t.nachname}, {t.vorname}
                      </strong>
                    </td>
                    <td>{t.telefon || '—'}</td>
                    <td>{t.email || '—'}</td>
                    <td>
                      <span className="kurs-count-badge">{t.anmeldungen_count}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="expand-chevron">{expanded === t.id ? '▲' : '▼'}</span>
                    </td>
                  </tr>
                  {expanded === t.id && (
                    <tr className="detail-row">
                      <td colSpan={5}>
                        <div className="detail-row-inner">
                          <strong>Kurshistorie</strong>
                          <KursHistorie teilnehmerId={t.id} />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </article>
      )}
    </div>
  )
}
