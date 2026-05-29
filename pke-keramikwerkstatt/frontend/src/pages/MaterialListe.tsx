import { Fragment, useEffect, useState } from 'react'
import { api, type MaterialCreate, type MaterialResponse } from '../api'

const KATEGORIEN = ['Ton', 'Glasur', 'Werkzeug', 'Verbrauchsmaterial', 'Sonstiges']
const EINHEITEN = ['kg', 'g', 'Liter', 'ml', 'Stück', 'Rolle', 'Packung']

const EMPTY: MaterialCreate = {
  name: '',
  einheit: 'kg',
  bestand: 0,
  mindestbestand: undefined,
  preis_pro_einheit: undefined,
  kategorie: 'Sonstiges',
}

export function MaterialListe() {
  const [materialien, setMaterialien] = useState<MaterialResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<MaterialCreate>(EMPTY)
  const [showNeu, setShowNeu] = useState(false)
  const [neuForm, setNeuForm] = useState<MaterialCreate>(EMPTY)
  const [formError, setFormError] = useState<string | null>(null)

  function reload() {
    api.materialien
      .list()
      .then(setMaterialien)
      .catch(() => setError('Materialliste konnte nicht geladen werden.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { reload() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    try {
      await api.materialien.create({
        ...neuForm,
        bestand: Number(neuForm.bestand),
        mindestbestand: neuForm.mindestbestand != null ? Number(neuForm.mindestbestand) : undefined,
        preis_pro_einheit: neuForm.preis_pro_einheit != null ? Number(neuForm.preis_pro_einheit) : undefined,
      })
      setNeuForm(EMPTY)
      setShowNeu(false)
      reload()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Fehler beim Speichern.')
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!editId) return
    setFormError(null)
    try {
      await api.materialien.update(editId, {
        ...editForm,
        bestand: Number(editForm.bestand),
        mindestbestand: editForm.mindestbestand != null ? Number(editForm.mindestbestand) : undefined,
        preis_pro_einheit: editForm.preis_pro_einheit != null ? Number(editForm.preis_pro_einheit) : undefined,
      })
      setEditId(null)
      reload()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Fehler beim Speichern.')
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`„${name}" wirklich löschen?`)) return
    try {
      await api.materialien.delete(id)
      reload()
    } catch {
      setError('Löschen fehlgeschlagen.')
    }
  }

  function startEdit(m: MaterialResponse) {
    setEditId(m.id)
    setEditForm({
      name: m.name,
      einheit: m.einheit,
      bestand: m.bestand,
      mindestbestand: m.mindestbestand ?? undefined,
      preis_pro_einheit: m.preis_pro_einheit ?? undefined,
      kategorie: m.kategorie,
      notizen: m.notizen ?? undefined,
    })
    setShowNeu(false)
    setFormError(null)
  }

  const grouped = KATEGORIEN.map((kat) => ({
    kat,
    items: materialien.filter((m) => m.kategorie === kat),
  })).filter((g) => g.items.length > 0)

  // Also show items with unknown categories
  const unknownItems = materialien.filter((m) => !KATEGORIEN.includes(m.kategorie))
  if (unknownItems.length > 0) grouped.push({ kat: 'Weitere', items: unknownItems })

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">Material</h1>
          <p>Bestände, Mindestmengen und Preise im Überblick.</p>
        </div>
        <button className="btn-primary" type="button" onClick={() => { setShowNeu(!showNeu); setEditId(null); setFormError(null) }}>
          {showNeu ? 'Abbrechen' : '+ Neues Material'}
        </button>
      </div>

      {error && <p className="notice warning">{error}</p>}

      {showNeu && (
        <article className="panel">
          <h2>Neues Material</h2>
          {formError && <p className="notice warning">{formError}</p>}
          <MaterialFormFields
            form={neuForm}
            onChange={setNeuForm}
            onSubmit={(e) => void handleCreate(e)}
            submitLabel="Material anlegen"
            onCancel={() => setShowNeu(false)}
          />
        </article>
      )}

      {loading && <p className="notice">Lade Materialien…</p>}

      {!loading && materialien.length === 0 && !showNeu && (
        <p className="notice">
          Noch keine Materialien eingetragen.{' '}
          <button className="btn-copy" type="button" onClick={() => setShowNeu(true)}>Erstes Material anlegen</button>
        </p>
      )}

      {grouped.map(({ kat, items }) => (
        <article key={kat} className="panel">
          <div className="panel-heading"><h2>{kat}</h2></div>
          <table className="teilnehmer-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Bestand</th>
                <th>Mindest</th>
                <th>Preis/Einheit</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <Fragment key={m.id}>
                  <tr className={m.unter_mindestbestand ? 'row-warnung' : ''}>
                    <td><strong style={{ color: 'var(--text-h)' }}>{m.name}</strong></td>
                    <td>{m.bestand} {m.einheit}</td>
                    <td>{m.mindestbestand != null ? `${m.mindestbestand} ${m.einheit}` : '—'}</td>
                    <td>{m.preis_pro_einheit != null ? `${m.preis_pro_einheit.toFixed(2)} € / ${m.einheit}` : '—'}</td>
                    <td>
                      {m.unter_mindestbestand
                        ? <span className="status-badge status-abgesagt">⚠ Nachbestellen</span>
                        : <span className="status-badge status-aktiv">✓ OK</span>}
                    </td>
                    <td>
                      <div className="btn-group">
                        <button className="btn-copy" type="button" onClick={() => editId === m.id ? setEditId(null) : startEdit(m)}>
                          {editId === m.id ? 'Schließen' : 'Bearbeiten'}
                        </button>
                        <button className="btn-icon-danger" type="button" onClick={() => void handleDelete(m.id, m.name)}>✕</button>
                      </div>
                    </td>
                  </tr>
                  {editId === m.id && (
                    <tr>
                      <td colSpan={6}>
                        <div className="detail-row-inner">
                          {formError && <p className="notice warning">{formError}</p>}
                          <MaterialFormFields
                            form={editForm}
                            onChange={setEditForm}
                            onSubmit={(e) => void handleUpdate(e)}
                            submitLabel="Änderungen speichern"
                            onCancel={() => setEditId(null)}
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </article>
      ))}
    </div>
  )
}

function MaterialFormFields({
  form,
  onChange,
  onSubmit,
  submitLabel,
  onCancel,
}: {
  form: MaterialCreate
  onChange: (f: MaterialCreate) => void
  onSubmit: (e: React.FormEvent) => void
  submitLabel: string
  onCancel: () => void
}) {
  return (
    <form className="kurs-form" onSubmit={onSubmit}>
      <div className="form-row">
        <label className="form-field">
          Name *
          <input type="text" required value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} />
        </label>
        <label className="form-field">
          Kategorie
          <select value={form.kategorie} onChange={(e) => onChange({ ...form, kategorie: e.target.value })}>
            {KATEGORIEN.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </label>
        <label className="form-field">
          Einheit
          <select value={form.einheit} onChange={(e) => onChange({ ...form, einheit: e.target.value })}>
            {EINHEITEN.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </label>
      </div>
      <div className="form-row">
        <label className="form-field">
          Aktueller Bestand *
          <input type="number" required min={0} step="0.001" value={form.bestand}
            onChange={(e) => onChange({ ...form, bestand: Number(e.target.value) })} />
        </label>
        <label className="form-field">
          Mindestbestand
          <input type="number" min={0} step="0.001" value={form.mindestbestand ?? ''}
            onChange={(e) => onChange({ ...form, mindestbestand: e.target.value ? Number(e.target.value) : undefined })} />
        </label>
        <label className="form-field">
          Preis / Einheit (€)
          <input type="number" min={0} step="0.01" value={form.preis_pro_einheit ?? ''}
            onChange={(e) => onChange({ ...form, preis_pro_einheit: e.target.value ? Number(e.target.value) : undefined })} />
        </label>
      </div>
      <div className="btn-group">
        <button type="submit" className="btn-primary">{submitLabel}</button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Abbrechen</button>
      </div>
    </form>
  )
}
