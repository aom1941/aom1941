export interface KursResponse {
  id: number
  name: string
  beschreibung: string | null
  max_teilnehmer: number
  preis_eur: number | null
  status: string
  erstellt_am: string
}

export interface KursTerminResponse {
  id: number
  kurs_id: number
  datum: string
  start_uhrzeit: string | null
  end_uhrzeit: string | null
  notizen: string | null
}

export interface TeilnehmerResponse {
  id: number
  vorname: string
  nachname: string
  telefon: string | null
  email: string | null
  notizen: string | null
  erstellt_am: string
}

export interface AnmeldungWithTeilnehmer {
  id: number
  kurs_id: number
  teilnehmer_id: number
  status: string
  angemeldet_am: string
  teilnehmer: TeilnehmerResponse
}

export interface KursDetail extends KursResponse {
  termine: KursTerminResponse[]
  anmeldungen: AnmeldungWithTeilnehmer[]
}

export interface KursCreate {
  name: string
  beschreibung?: string
  max_teilnehmer: number
  preis_eur?: number
  status: string
}

export interface KursTerminCreate {
  datum: string
  start_uhrzeit?: string
  end_uhrzeit?: string
  notizen?: string
}

export interface TeilnehmerCreate {
  vorname: string
  nachname: string
  telefon?: string
  email?: string
}

export interface TeilnehmerListItem {
  id: number
  vorname: string
  nachname: string
  telefon: string | null
  email: string | null
  erstellt_am: string
  anmeldungen_count: number
}

export interface AnmeldungWithKurs {
  id: number
  kurs_id: number
  status: string
  angemeldet_am: string
  kurs: KursResponse
}

export interface TeilnehmerWithKurse {
  id: number
  vorname: string
  nachname: string
  telefon: string | null
  email: string | null
  notizen: string | null
  erstellt_am: string
  anmeldungen: AnmeldungWithKurs[]
}

export interface DashboardStats {
  kurse_gesamt: number
  kurse_aktiv: number
  teilnehmer_gesamt: number
  anmeldungen_gesamt: number
}

export interface NaechsterTermin {
  termin_id: number
  datum: string
  start_uhrzeit: string | null
  kurs_id: number
  kurs_name: string
  kurs_status: string
  anmeldungen: number
  max_teilnehmer: number
}

export interface DashboardResponse {
  stats: DashboardStats
  naechste_termine: NaechsterTermin[]
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(detail || `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  kurse: {
    list: () => apiFetch<KursResponse[]>('/api/kurse'),
    get: (id: number) => apiFetch<KursDetail>(`/api/kurse/${id}`),
    create: (data: KursCreate) =>
      apiFetch<KursResponse>('/api/kurse', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<KursCreate>) =>
      apiFetch<KursResponse>(`/api/kurse/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch<void>(`/api/kurse/${id}`, { method: 'DELETE' }),
    addTermin: (kursId: number, data: KursTerminCreate) =>
      apiFetch<KursTerminResponse>(`/api/kurse/${kursId}/termine`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    deleteTermin: (kursId: number, terminId: number) =>
      apiFetch<void>(`/api/kurse/${kursId}/termine/${terminId}`, { method: 'DELETE' }),
    anmelden: (kursId: number, teilnehmerId: number, status: string) =>
      apiFetch<AnmeldungWithTeilnehmer>(`/api/kurse/${kursId}/anmeldungen`, {
        method: 'POST',
        body: JSON.stringify({ teilnehmer_id: teilnehmerId, status }),
      }),
  },
  teilnehmer: {
    list: () => apiFetch<TeilnehmerListItem[]>('/api/teilnehmer'),
    get: (id: number) => apiFetch<TeilnehmerWithKurse>(`/api/teilnehmer/${id}`),
    create: (data: TeilnehmerCreate) =>
      apiFetch<TeilnehmerResponse>('/api/teilnehmer', { method: 'POST', body: JSON.stringify(data) }),
  },
  dashboard: {
    get: () => apiFetch<DashboardResponse>('/api/dashboard'),
  },
}
