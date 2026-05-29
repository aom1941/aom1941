import { Link } from 'react-router-dom'
import type { KursResponse } from '../api'

const STATUS_LABELS: Record<string, string> = {
  geplant: 'Geplant',
  aktiv: 'Aktiv',
  abgeschlossen: 'Abgeschlossen',
  abgesagt: 'Abgesagt',
}

interface Props {
  kurs: KursResponse
  teilnehmerCount?: number
}

export function KursCard({ kurs, teilnehmerCount }: Props) {
  return (
    <article className="detail-card kurs-card">
      <div className="kurs-card-header">
        <h3>{kurs.name}</h3>
        <span className={`status-badge status-${kurs.status}`}>
          {STATUS_LABELS[kurs.status] ?? kurs.status}
        </span>
      </div>
      {kurs.beschreibung && <p className="kurs-beschreibung">{kurs.beschreibung}</p>}
      <div className="kurs-meta">
        <span>{kurs.max_teilnehmer} Plätze</span>
        {teilnehmerCount !== undefined && (
          <span>
            {teilnehmerCount} / {kurs.max_teilnehmer} belegt
          </span>
        )}
        {kurs.preis_eur != null && <span>{kurs.preis_eur.toFixed(2)} €</span>}
      </div>
      <Link to={`/kurse/${kurs.id}`} className="btn-primary">
        Details
      </Link>
    </article>
  )
}
