import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, type KursCreate } from '../api'

const STATUS_OPTIONS = [
  { value: 'geplant', label: 'Geplant' },
  { value: 'aktiv', label: 'Aktiv' },
  { value: 'abgeschlossen', label: 'Abgeschlossen' },
  { value: 'abgesagt', label: 'Abgesagt' },
]

const EMPTY: KursCreate = {
  name: '',
  beschreibung: '',
  max_teilnehmer: 10,
  preis_eur: undefined,
  status: 'geplant',
}

export function KursForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const kursId = id ? Number(id) : null

  const [form, setForm] = useState<KursCreate>(EMPTY)
  const [loading, setLoading] = useState(isEdit)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!kursId) return
    api.kurse
      .get(kursId)
      .then((k) => {
        setForm({
          name: k.name,
          beschreibung: k.beschreibung ?? '',
          max_teilnehmer: k.max_teilnehmer,
          preis_eur: k.preis_eur ?? undefined,
          status: k.status,
        })
      })
      .catch(() => setError('Kurs konnte nicht geladen werden.'))
      .finally(() => setLoading(false))
  }, [kursId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const payload: KursCreate = {
      ...form,
      beschreibung: form.beschreibung || undefined,
    }
    try {
      if (isEdit && kursId) {
        await api.kurse.update(kursId, payload)
        navigate(`/kurse/${kursId}`)
      } else {
        const created = await api.kurse.create(payload)
        navigate(`/kurse/${created.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.')
    }
  }

  if (loading) return <div className="page-shell"><p className="notice">Lade Kurs…</p></div>

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">{isEdit ? 'Kurs bearbeiten' : 'Neuer Kurs'}</p>
          <h1 className="page-title">{isEdit ? form.name || 'Kurs bearbeiten' : 'Neuen Kurs anlegen'}</h1>
        </div>
      </div>

      {error && <p className="notice warning">{error}</p>}

      <article className="panel">
        <form className="kurs-form" onSubmit={(e) => void handleSubmit(e)}>
          <label className="form-field">
            Kursname *
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="z. B. Töpferkurs für Anfänger"
            />
          </label>

          <label className="form-field">
            Beschreibung
            <textarea
              rows={3}
              value={form.beschreibung ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, beschreibung: e.target.value }))}
              placeholder="Kurze Beschreibung des Kursinhalts…"
            />
          </label>

          <div className="form-row">
            <label className="form-field">
              Max. Teilnehmer *
              <input
                type="number"
                required
                min={1}
                max={100}
                value={form.max_teilnehmer}
                onChange={(e) => setForm((f) => ({ ...f, max_teilnehmer: Number(e.target.value) }))}
              />
            </label>

            <label className="form-field">
              Preis (€)
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.preis_eur ?? ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, preis_eur: e.target.value ? Number(e.target.value) : undefined }))
                }
                placeholder="0.00"
              />
            </label>

            <label className="form-field">
              Status
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="btn-group">
            <button type="submit" className="btn-primary">
              {isEdit ? 'Änderungen speichern' : 'Kurs anlegen'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate(kursId ? `/kurse/${kursId}` : '/')}
            >
              Abbrechen
            </button>
          </div>
        </form>
      </article>
    </div>
  )
}
