import { useEffect, useState } from 'react'
import './App.css'

type Metric = {
  label: string
  value: string
  note: string
}

type RoleCard = {
  name: string
  focus: string
  permissions: string[]
}

type PageCard = {
  name: string
  purpose: string
  primary_actions: string[]
}

type ModuleCard = {
  slug: string
  title: string
  summary: string
  highlights: string[]
  entities: string[]
}

type AutomationCard = {
  name: string
  trigger: string
  outcome: string
}

type PhaseCard = {
  title: string
  goal: string
  deliverables: string[]
}

type StackLayer = {
  layer: string
  choice: string
  reason: string
}

type Blueprint = {
  name: string
  promise: string
  scope: string[]
  metrics: Metric[]
  roles: RoleCard[]
  pages: PageCard[]
  modules: ModuleCard[]
  automations: AutomationCard[]
  phases: PhaseCard[]
  stack: StackLayer[]
}

const fallbackBlueprint: Blueprint = {
  name: 'Pilzkeramik Werkstattboard',
  promise:
    'Self-hosted Organisations-Webapp für Werkstattabläufe, Buchungen, Brennplanung und Dokumente.',
  scope: [
    'Kund:innenverwaltung',
    'Auftrags- und Werkstückverwaltung',
    'Brenn- und Produktionsplanung',
    'Kurs- und Workshop-Buchungen',
    'Rechnungs- und Dokumentenablage',
  ],
  metrics: [
    {
      label: 'MVP-Module',
      value: '5',
      note: 'CRM, Werkstatt, Brennkalender, Buchungen, Dokumente',
    },
    {
      label: 'Rollen',
      value: '4',
      note: 'Admin, Werkstatt, Kursleitung, Buchhaltung',
    },
    {
      label: 'Betrieb',
      value: 'Self-hosted',
      note: 'Docker, PostgreSQL, lokales Storage, DSGVO-freundlich',
    },
  ],
  roles: [
    {
      name: 'Admin',
      focus: 'Mandanten-, Rollen- und Systemkonfiguration',
      permissions: ['Benutzer verwalten', 'Module freischalten', 'Backups prüfen'],
    },
    {
      name: 'Werkstatt',
      focus: 'Produktionsfluss vom Drehen bis zur Abholung',
      permissions: ['Werkstücke pflegen', 'Brennstatus ändern', 'Materialverbrauch erfassen'],
    },
    {
      name: 'Kursleitung',
      focus: 'Kursplanung und Teilnehmerverwaltung',
      permissions: ['Termine pflegen', 'Wartelisten steuern', 'Teilnahmen bestätigen'],
    },
    {
      name: 'Buchhaltung',
      focus: 'Rechnungen, Angebote und Belegablage',
      permissions: ['Dokumente ablegen', 'Rechnungsstatus setzen', 'Export vorbereiten'],
    },
  ],
  pages: [
    {
      name: 'Dashboard',
      purpose: 'Tages- und Wochenüberblick für Werkstattbetrieb',
      primary_actions: ['Offene Brennvorgänge prüfen', 'Abholungen sehen', 'Kurse im Blick behalten'],
    },
    {
      name: 'Kund:innen & Aufträge',
      purpose: 'CRM, Ansprechpartner und Auftragsstatus',
      primary_actions: ['Kontakt anlegen', 'Auftrag starten', 'Werkstücke zuordnen'],
    },
    {
      name: 'Brennkalender',
      purpose: 'Ofenkapazität, Temperaturen und Brennstatus steuern',
      primary_actions: ['Ofenlauf planen', 'Beladung prüfen', 'Status aktualisieren'],
    },
    {
      name: 'Kurse & Buchungen',
      purpose: 'Termine, Buchungen und Wartelisten verwalten',
      primary_actions: ['Kurs anlegen', 'Teilnehmer bestätigen', 'Freie Plätze prüfen'],
    },
    {
      name: 'Dokumente',
      purpose: 'Rechnungen, Angebote, Lieferscheine und Anhänge bündeln',
      primary_actions: ['Beleg hochladen', 'Rechnung markieren', 'OCR später anbinden'],
    },
  ],
  modules: [
    {
      slug: 'crm',
      title: 'CRM',
      summary: 'Kund:innen, Ansprechpartner, Notizen und Statushistorien an einem Ort.',
      highlights: ['Kontaktkarte', 'Auftragshistorie', 'Interne Notizen'],
      entities: ['Kund:in', 'Ansprechpartner', 'Auftrag', 'Statushistorie'],
    },
    {
      slug: 'werkstatt',
      title: 'Werkstattplanung',
      summary: 'Produktionsschritte von Drehen über Trocknen bis Glasieren und Abholung.',
      highlights: ['Werkstückboard', 'Produktionsstatus', 'Aufgaben je Station'],
      entities: ['Werkstück', 'Produktionsschritt', 'Aufgabe', 'Abholung'],
    },
    {
      slug: 'brennkalender',
      title: 'Brennkalender',
      summary: 'Brennpläne mit Kapazität, Temperaturprofil und Verantwortlichkeit.',
      highlights: ['Ofenbelegung', 'Kapazität', 'Schrüh-/Glasurbrand-Status'],
      entities: ['Ofen', 'Brennvorgang', 'Beladung', 'Temperaturprofil'],
    },
    {
      slug: 'buchungen',
      title: 'Buchungssystem',
      summary: 'Kurse, offene Werkstatt und Einzeltermine mit Wartelistenlogik.',
      highlights: ['Kursübersicht', 'Freie Plätze', 'Teilnahmebestätigung'],
      entities: ['Kurs', 'Buchung', 'Teilnahme', 'Wartelisteneintrag'],
    },
    {
      slug: 'dokumente',
      title: 'Dokumentenmodul',
      summary: 'Rechnungen, Angebote, Lieferscheine und Anhänge sauber ablegen.',
      highlights: ['Belegliste', 'Statusfilter', 'Dateiverknüpfung'],
      entities: ['Rechnung', 'Dokument', 'Datei', 'Angebot'],
    },
    {
      slug: 'inventar',
      title: 'Inventar',
      summary: 'Ton, Glasuren, Werkzeuge und Mindestbestände als nächste Ausbaustufe.',
      highlights: ['Bestände', 'Warnschwellen', 'Verbrauchsnotizen'],
      entities: ['Material', 'Bestand', 'Werkzeug', 'Lieferant'],
    },
  ],
  automations: [
    {
      name: 'Abholerinnerung',
      trigger: 'Werkstück wird als abholbereit markiert',
      outcome: 'Kontaktliste für Erinnerung wird erzeugt',
    },
    {
      name: 'Brennstatus-Update',
      trigger: 'Brennvorgang wechselt die Phase',
      outcome: 'Betroffene Werkstücke und Aufträge erhalten den neuen Status',
    },
    {
      name: 'Materialwarnung',
      trigger: 'Bestand fällt unter Mindestmenge',
      outcome: 'Warnhinweis im Dashboard und für Einkaufsliste',
    },
    {
      name: 'Buchungsbestätigung',
      trigger: 'Teilnahme wird bestätigt',
      outcome: 'Termin erscheint in Kursübersicht und Warteliste wird nachgezogen',
    },
  ],
  phases: [
    {
      title: 'Phase 1 — MVP',
      goal: 'Kernprozesse der Werkstatt sichtbar und planbar machen',
      deliverables: [
        'CRM-Grundlage',
        'Werkstück- und Auftragsboard',
        'Brennkalender',
        'Kursbuchungen',
        'Dokumentenablage',
      ],
    },
    {
      title: 'Phase 2 — Betriebstiefe',
      goal: 'Inventar, Medienarchiv und Tagessteuerung ergänzen',
      deliverables: ['Lagerlogik', 'Bild-/Objektarchiv', 'Tagesdashboard'],
    },
    {
      title: 'Phase 3 — Automationen',
      goal: 'Dokumente, Benachrichtigungen und Auswertungen ausbauen',
      deliverables: ['OCR/RAG-Anbindung', 'Nachrichtenkanäle', 'Auswertungen zu Umsatz und Auslastung'],
    },
  ],
  stack: [
    {
      layer: 'Frontend',
      choice: 'React + Vite',
      reason: 'Schneller MVP-Start, klare Komponentenstruktur, leicht self-hostbar.',
    },
    {
      layer: 'Backend',
      choice: 'FastAPI',
      reason: 'Klare API-Struktur, gute Typisierung und schnell erweiterbar.',
    },
    {
      layer: 'Datenbank',
      choice: 'PostgreSQL',
      reason: 'Robust für relationale Werkstatt-, Buchungs- und Dokumentendaten.',
    },
    {
      layer: 'Storage',
      choice: 'S3-kompatibel oder NAS',
      reason: 'Geeignet für Rechnungen, Fotos und Anhänge ohne SaaS-Zwang.',
    },
    {
      layer: 'Betrieb',
      choice: 'Docker Compose',
      reason: 'Einfacher self-hosted Einstieg mit sauberer Trennung der Dienste.',
    },
  ],
}

function App() {
  const [blueprint, setBlueprint] = useState<Blueprint>(fallbackBlueprint)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadBlueprint() {
      try {
        const response = await fetch('/api/blueprint', { signal: controller.signal })
        if (!response.ok) {
          throw new Error(`API antwortet mit ${response.status}`)
        }

        const data = (await response.json()) as Blueprint
        setBlueprint(data)
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === 'AbortError') {
          return
        }

        setError('API nicht erreichbar — Fallback-Blueprint wird angezeigt.')
      } finally {
        setLoading(false)
      }
    }

    void loadBlueprint()

    return () => controller.abort()
  }, [])

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">pke-domain · MVP</p>
          <h1>{blueprint.name}</h1>
          <p className="hero-copy">{blueprint.promise}</p>
        </div>
        <div className="hero-card">
          <h2>Fokus</h2>
          <ul>
            {blueprint.scope.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      {error ? <p className="notice warning">{error}</p> : null}
      {loading ? <p className="notice">Lade Blueprint…</p> : null}

      <section className="metrics-grid">
        {blueprint.metrics.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <p>{metric.note}</p>
          </article>
        ))}
      </section>

      <section className="content-grid">
        <article className="panel">
          <div className="panel-heading">
            <h2>Kernmodule</h2>
            <p>Saubere Trennung zwischen Werkstatt, Buchungen und Dokumenten.</p>
          </div>
          <div className="card-grid">
            {blueprint.modules.map((module) => (
              <article className="detail-card" key={module.slug}>
                <h3>{module.title}</h3>
                <p>{module.summary}</p>
                <strong>Highlights</strong>
                <ul>
                  {module.highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
                <strong>Entitäten</strong>
                <div className="tag-list">
                  {module.entities.map((entity) => (
                    <span key={entity}>{entity}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h2>Rollenmodell</h2>
            <p>Rollenbasiert für Werkstattbetrieb und Verwaltung.</p>
          </div>
          <div className="stack-list">
            {blueprint.roles.map((role) => (
              <article className="stack-row" key={role.name}>
                <div>
                  <h3>{role.name}</h3>
                  <p>{role.focus}</p>
                </div>
                <ul>
                  {role.permissions.map((permission) => (
                    <li key={permission}>{permission}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="content-grid">
        <article className="panel">
          <div className="panel-heading">
            <h2>Seitenstruktur</h2>
            <p>Aus der MVP-Priorisierung direkt in Oberflächen übersetzt.</p>
          </div>
          <div className="card-grid">
            {blueprint.pages.map((page) => (
              <article className="detail-card" key={page.name}>
                <h3>{page.name}</h3>
                <p>{page.purpose}</p>
                <ul>
                  {page.primary_actions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h2>Automationen</h2>
            <p>Die ersten Alltagserleichterungen für einen echten Werkstattbetrieb.</p>
          </div>
          <div className="card-grid">
            {blueprint.automations.map((automation) => (
              <article className="detail-card" key={automation.name}>
                <h3>{automation.name}</h3>
                <p>
                  <strong>Trigger:</strong> {automation.trigger}
                </p>
                <p>
                  <strong>Ergebnis:</strong> {automation.outcome}
                </p>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="content-grid">
        <article className="panel">
          <div className="panel-heading">
            <h2>Technischer Stack</h2>
            <p>Self-hosted, DSGVO-freundlich und modular erweiterbar.</p>
          </div>
          <div className="stack-list">
            {blueprint.stack.map((entry) => (
              <article className="stack-row" key={entry.layer}>
                <div>
                  <h3>{entry.layer}</h3>
                  <p>{entry.choice}</p>
                </div>
                <p>{entry.reason}</p>
              </article>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h2>Roadmap</h2>
            <p>MVP zuerst, dann Betriebstiefe und Automationen.</p>
          </div>
          <div className="stack-list">
            {blueprint.phases.map((phase) => (
              <article className="stack-row" key={phase.title}>
                <div>
                  <h3>{phase.title}</h3>
                  <p>{phase.goal}</p>
                </div>
                <ul>
                  {phase.deliverables.map((deliverable) => (
                    <li key={deliverable}>{deliverable}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </article>
      </section>
    </main>
  )
}

export default App
