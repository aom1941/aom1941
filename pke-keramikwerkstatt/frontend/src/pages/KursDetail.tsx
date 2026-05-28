import { Fragment, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  api,
  type KursDetail as KursDetailType,
  type KursTerminCreate,
  type TeilnehmerCreate,
} from '../api'
import { WhatsappVorlage } from '../components/WhatsappVorlage'

const STATUS_LABELS: Record<string, string> = {
  geplant: 'Geplant',
  aktiv: 'Aktiv',
  abgeschlossen: 'Abgeschlossen',
  abgesagt: 'Abgesagt',
}

const ANMELDUNG_LABELS: Record<string, string> = {
  bestaetigt: 'Bestätigt',
  warteliste: 'Warteliste',
  abgesagt: 'Abgesagt',
}

type AnmeldungForm = TeilnehmerCreate & { anmeldungStatus: string }

const EMPTY_ANMELDUNG: AnmeldungForm = {
  vorname: '',
  nachname: '',
  telefon: '',
  email: '',
  anmeldungStatus: 'bestaetigt',
}

export function KursDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const kursId = Number(id)

  const [kurs, setKurs] = useState<KursDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [terminForm, setTerminForm] = useState<KursTerminCreate>({ datum: '' })
  const [terminError, setTerminError] = useState<string | null>(null)
  const [anmeldungForm, setAnmeldungForm] = useState<AnmeldungForm>(EMPTY_ANMELDUNG)
  const [anmeldungError, setAnmeldungError] = useState<string | null>(null)
  const [waOpen, setWaOpen] = useState<number | null>(null)

  function reload() {
    api.kurse
      .get(kursId)
      .then(setKurs)
      .catch(() => setError('Kurs konnte nicht geladen werden.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    reload()
  }, [kursId])

  async function handleDeleteKurs() {
    if (!confirm('Kurs wirklich löschen?')) return
    try {
      await api.kurse.delete(kursId)
      navigate('/')
    } catch {
      setError('Löschen fehlgeschlagen.')
    }
  }

  async function handleAddTermin(e: React.FormEvent) {
    e.preventDefault()
    setTerminError(null)
    try {
      await api.kurse.addTermin(kursId, terminForm)
      setTerminForm({ datum: '' })
      reload()
    } catch {
      setTerminError('Termin konnte nicht gespeichert werden.')
    }
  }

  async function handleDeleteTermin(terminId: number) {
    try {
      await api.kurse.deleteTermin(kursId, terminId)
      reload()
    } catch {
      setTerminError('Termin konnte nicht gelöscht werden.')
    }
  }

  async function handleAnmelden(e: React.FormEvent) {
    e.preventDefault()
    setAnmeldungError(null)
    try {
      const { anmeldungStatus, vorname, nachname, telefon, email } = anmeldungForm
      const tn = await api.teilnehmer.create({
        vorname,
        nachname,
        telefon: telefon || undefined,
        email: email || undefined,
      })
      await api.kurse.anmelden(kursId, tn.id, anmeldungStatus)
      setAnmeldungForm(EMPTY_ANMELDUNG)
      reload()
    } catch (err) {
      setAnmeldungError(err instanceof Error ? err.message : 'Anmeldung fehlgeschlagen.')
    }
  }

  if (loading) return <div className="page-shell"><p className="notice">Lade Kurs…</p></div>
  if (error || !kurs) return <div className="page-shell"><p className="notice warning">{error ?? 'Kurs nicht gefunden.'}</p></div>

  const confirmed = kurs.anmeldungen.filter((a) => a.status === 'bestaetigt').length
  const freie = Math.max(0, kurs.max_teilnehmer - confirmed)

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Kursdetails</p>
          <h1 className="page-title">{kurs.name}</h1>
        </div>
        <div className="btn-group">
          <Link to={`/kurse/${kursId}/bearbeiten`} className="btn-secondary">
            Bearbeiten
          </Link>
          <button className="btn-danger" onClick={() => void handleDeleteKurs()} type="button">
            Löschen
          </button>
        </div>
      </div>

      <div className="content-grid">
        {/* Kursinfo */}
        <article className="panel">
          <div className="panel-heading"><h2>Info</h2></div>
          <div className="kurs-info-grid">
            <span>Status</span>
            <span className={`status-badge status-${kurs.status}`}>{STATUS_LABELS[kurs.status] ?? kurs.status}</span>
            <span>Max. Teilnehmer</span>
            <span>{kurs.max_teilnehmer}</span>
            <span>Freie Plätze</span>
            <span>{freie}</span>
            {kurs.preis_eur != null && (
              <>
                <span>Preis</span>
                <span>{kurs.preis_eur.toFixed(2)} €</span>
              </>
            )}
            {kurs.beschreibung && (
              <>
                <span>Beschreibung</span>
                <span>{kurs.beschreibung}</span>
              </>
            )}
          </div>
        </article>

        {/* Termine */}
        <article className="panel">
          <div className="panel-heading"><h2>Termine</h2></div>
          {kurs.termine.length === 0
            ? <p className="muted-text">Noch keine Termine eingetragen.</p>
            : (
              <ul className="termine-list">
                {kurs.termine
                  .slice()
                  .sort((a, b) => a.datum.localeCompare(b.datum))
                  .map((t) => (
                    <li key={t.id} className="termin-row">
                      <span>
                        {new Date(t.datum + 'T00:00:00').toLocaleDateString('de-DE', {
                          weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
                        })}
                        {t.start_uhrzeit ? ` · ${t.start_uhrzeit.slice(0, 5)}` : ''}
                        {t.end_uhrzeit ? ` – ${t.end_uhrzeit.slice(0, 5)}` : ''}
                      </span>
                      {t.notizen && <span className="muted-text">{t.notizen}</span>}
                      <button
                        className="btn-icon-danger"
                        onClick={() => void handleDeleteTermin(t.id)}
                        type="button"
                        title="Termin löschen"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
              </ul>
            )}

          {terminError && <p className="notice warning">{terminError}</p>}
          <form className="inline-form" onSubmit={(e) => void handleAddTermin(e)}>
            <h3>Termin hinzufügen</h3>
            <div className="form-row">
              <label>
                Datum *
                <input
                  type="date"
                  required
                  value={terminForm.datum}
                  onChange={(e) => setTerminForm((f) => ({ ...f, datum: e.target.value }))}
                />
              </label>
              <label>
                Von
                <input
                  type="time"
                  value={terminForm.start_uhrzeit ?? ''}
                  onChange={(e) => setTerminForm((f) => ({ ...f, start_uhrzeit: e.target.value || undefined }))}
                />
              </label>
              <label>
                Bis
                <input
                  type="time"
                  value={terminForm.end_uhrzeit ?? ''}
                  onChange={(e) => setTerminForm((f) => ({ ...f, end_uhrzeit: e.target.value || undefined }))}
                />
              </label>
            </div>
            <button type="submit" className="btn-primary">Termin speichern</button>
          </form>
        </article>
      </div>

      {/* Teilnehmer */}
      <article className="panel">
        <div className="panel-heading">
          <h2>Teilnehmer ({kurs.anmeldungen.length})</h2>
        </div>

        {kurs.anmeldungen.length > 0
          ? (
            <table className="teilnehmer-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Telefon</th>
                  <th>Status</th>
                  <th>WhatsApp</th>
                </tr>
              </thead>
              <tbody>
                {kurs.anmeldungen.map((a) => (
                  <Fragment key={a.id}>
                    <tr>
                      <td>{a.teilnehmer.vorname} {a.teilnehmer.nachname}</td>
                      <td>{a.teilnehmer.telefon || '—'}</td>
                      <td>
                        <span className={`status-badge status-${a.status}`}>
                          {ANMELDUNG_LABELS[a.status] ?? a.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-copy"
                          type="button"
                          onClick={() => setWaOpen(waOpen === a.id ? null : a.id)}
                        >
                          {waOpen === a.id ? 'Schließen' : 'Vorlagen'}
                        </button>
                      </td>
                    </tr>
                    {waOpen === a.id && (
                      <tr>
                        <td colSpan={4}>
                          <WhatsappVorlage kurs={kurs} teilnehmer={a.teilnehmer} termine={kurs.termine} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          )
          : <p className="muted-text">Noch keine Anmeldungen.</p>}

        {anmeldungError && <p className="notice warning">{anmeldungError}</p>}
        <form className="inline-form" onSubmit={(e) => void handleAnmelden(e)}>
          <h3>Teilnehmer anmelden</h3>
          <div className="form-row">
            <label>
              Vorname *
              <input
                type="text"
                required
                value={anmeldungForm.vorname}
                onChange={(e) => setAnmeldungForm((f) => ({ ...f, vorname: e.target.value }))}
              />
            </label>
            <label>
              Nachname *
              <input
                type="text"
                required
                value={anmeldungForm.nachname}
                onChange={(e) => setAnmeldungForm((f) => ({ ...f, nachname: e.target.value }))}
              />
            </label>
            <label>
              Telefon
              <input
                type="tel"
                value={anmeldungForm.telefon ?? ''}
                onChange={(e) => setAnmeldungForm((f) => ({ ...f, telefon: e.target.value || undefined }))}
              />
            </label>
            <label>
              E-Mail
              <input
                type="email"
                value={anmeldungForm.email ?? ''}
                onChange={(e) => setAnmeldungForm((f) => ({ ...f, email: e.target.value || undefined }))}
              />
            </label>
            <label>
              Status
              <select
                value={anmeldungForm.anmeldungStatus}
                onChange={(e) => setAnmeldungForm((f) => ({ ...f, anmeldungStatus: e.target.value }))}
              >
                <option value="bestaetigt">Bestätigt</option>
                <option value="warteliste">Warteliste</option>
              </select>
            </label>
          </div>
          <button type="submit" className="btn-primary">Anmelden</button>
        </form>
      </article>

      <div>
        <Link to="/" className="btn-secondary">← Zurück zur Kursliste</Link>
      </div>
    </div>
  )
}
