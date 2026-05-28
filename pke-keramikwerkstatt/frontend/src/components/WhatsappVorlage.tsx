import { useState } from 'react'
import type { TeilnehmerResponse, KursResponse, KursTerminResponse } from '../api'

interface Props {
  kurs: KursResponse
  teilnehmer: TeilnehmerResponse
  termine: KursTerminResponse[]
}

function formatDatum(datum: string): string {
  return new Date(datum + 'T00:00:00').toLocaleDateString('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function nextTermin(termine: KursTerminResponse[]): KursTerminResponse | undefined {
  const today = new Date().toISOString().slice(0, 10)
  return termine.filter((t) => t.datum >= today).sort((a, b) => a.datum.localeCompare(b.datum))[0]
}

export function WhatsappVorlage({ kurs, teilnehmer, termine }: Props) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const name = `${teilnehmer.vorname} ${teilnehmer.nachname}`
  const termin = nextTermin(termine)
  const datumStr = termin ? formatDatum(termin.datum) : '[Datum folgt]'
  const uhrzeitStr =
    termin?.start_uhrzeit
      ? termin.start_uhrzeit.slice(0, 5) + (termin.end_uhrzeit ? ` – ${termin.end_uhrzeit.slice(0, 5)}` : '')
      : '[Uhrzeit folgt]'

  const templates = [
    {
      label: 'Buchungsbestätigung',
      text: `Hallo ${name}, deine Anmeldung für „${kurs.name}" am ${datumStr} ist bestätigt. Bei Fragen melde dich gerne!`,
    },
    {
      label: 'Kurserinnerung',
      text: `Hallo ${name}, Erinnerung: „${kurs.name}" findet am ${datumStr} um ${uhrzeitStr} Uhr statt. Wir freuen uns auf dich!`,
    },
  ]

  function copyText(text: string, idx: number) {
    void navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx)
      setTimeout(() => setCopiedIdx(null), 2000)
    })
  }

  return (
    <div className="wa-vorlagen">
      {templates.map((t, idx) => (
        <div key={t.label} className="wa-vorlage">
          <div className="wa-vorlage-header">
            <span className="wa-label">{t.label}</span>
            <button
              className="btn-copy"
              onClick={() => copyText(t.text, idx)}
              type="button"
            >
              {copiedIdx === idx ? '✓ Kopiert' : 'Kopieren'}
            </button>
          </div>
          <p className="wa-text">{t.text}</p>
        </div>
      ))}
    </div>
  )
}
