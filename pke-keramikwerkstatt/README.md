# 🏺 pke-keramikwerkstatt

> Self-hosted Werkstattboard für **Pilzkeramik** — Kursverwaltung, Teilnehmer, Terminplanung und mehr.  
> DSGVO-konform, kein Vendor Lock-in, ein `docker compose up` entfernt.

---

## Architektur

```
┌─────────────────┐       ┌─────────────────┐       ┌────────────────┐
│  React 19 + TS  │──────▶│     Nginx        │──────▶│   FastAPI       │
│  Vite · SPA     │  :80  │  Reverse Proxy   │ /api  │  SQLAlchemy 2   │
└─────────────────┘       └─────────────────┘       └───────┬────────┘
                                                            │
                                                    ┌───────▼────────┐
                                                    │  PostgreSQL 16 │
                                                    │    (Alpine)    │
                                                    └────────────────┘
                          ── alles via Docker Compose ──
```

| Schicht | Technologie |
|---------|-------------|
| Frontend | React 19, TypeScript, Vite 8, React Router 7 |
| Backend | FastAPI 0.116, Pydantic, Uvicorn |
| ORM | SQLAlchemy 2 + psycopg2 |
| Datenbank | PostgreSQL 16 (Alpine) |
| Reverse Proxy | Nginx 1.29 (SPA-Fallback + `/api` Proxy) |
| Container | Docker Compose, Multi-Stage Builds |

---

## Schnellstart

```bash
cd pke-keramikwerkstatt
cp .env.example .env        # Standardwerte reichen für Entwicklung
docker compose up --build
```

| Dienst | URL |
|--------|-----|
| Frontend | [`http://localhost:8080`](http://localhost:8080) |
| Backend API | [`http://localhost:8000`](http://localhost:8000) |
| Swagger Docs | [`http://localhost:8000/docs`](http://localhost:8000/docs) |
| Health Check | [`http://localhost:8000/healthz`](http://localhost:8000/healthz) |

### Lokal ohne Docker

**Backend:**

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev          # → http://localhost:5173
```

---

## Features (Phase 1)

### Kursverwaltung

- Kurse anlegen, bearbeiten, löschen — mit Status-Workflow (`geplant` → `aktiv` → `abgeschlossen` / `abgesagt`)
- Preis, Kapazität und Beschreibung je Kurs
- Farbcodierte Status-Badges in der Kursübersicht

### Terminplanung

- Mehrere Termine pro Kurs mit optionaler Start-/Endzeit
- Interne Notizen je Termin
- Termine direkt in der Kursdetailseite hinzufügen/entfernen

### Teilnehmerverwaltung

- Teilnehmer:innen mit Kontaktdaten (Telefon, E-Mail) erfassen
- Anmeldung zu Kursen mit Status: **bestätigt**, **Warteliste**, **abgesagt**
- Duplikatschutz — eine Anmeldung pro Person und Kurs
- Freie Plätze werden automatisch berechnet

### WhatsApp-Vorlagen

- Vorgefertigte Nachrichtenvorlagen: **Buchungsbestätigung** und **Kurserinnerung**
- Platzhalter werden automatisch befüllt (Name, Kurs, Termin, Uhrzeit)
- Ein-Klick-Kopieren in die Zwischenablage

---

## Datenmodell

```
Kurs ──┬── 1:N ── KursTermin
       └── 1:N ── Anmeldung ── N:1 ── Teilnehmer
```

| Tabelle | Beschreibung | Wichtige Felder |
|---------|-------------|-----------------|
| **Kurs** | Kursangebot | name, beschreibung, max_teilnehmer, preis_eur, status |
| **KursTermin** | Einzeltermin eines Kurses | datum, start_uhrzeit, end_uhrzeit, notizen |
| **Teilnehmer** | Kursteilnehmer:in | vorname, nachname, telefon, email |
| **Anmeldung** | Zuordnung Kurs ↔ Teilnehmer | status (bestaetigt / warteliste / abgesagt) |

---

## API-Endpunkte

### Kurse — `/api/kurse`

| Methode | Pfad | Beschreibung |
|---------|------|-------------|
| `GET` | `/api/kurse` | Alle Kurse auflisten |
| `POST` | `/api/kurse` | Neuen Kurs anlegen |
| `GET` | `/api/kurse/{id}` | Kursdetails inkl. Termine & Anmeldungen |
| `PUT` | `/api/kurse/{id}` | Kurs aktualisieren |
| `DELETE` | `/api/kurse/{id}` | Kurs löschen (kaskadierend) |

### Termine — `/api/kurse/{id}/termine`

| Methode | Pfad | Beschreibung |
|---------|------|-------------|
| `POST` | `/api/kurse/{id}/termine` | Termin hinzufügen |
| `DELETE` | `/api/kurse/{id}/termine/{terminId}` | Termin entfernen |

### Anmeldungen — `/api/kurse/{id}/anmeldungen`

| Methode | Pfad | Beschreibung |
|---------|------|-------------|
| `GET` | `/api/kurse/{id}/anmeldungen` | Anmeldungen auflisten |
| `POST` | `/api/kurse/{id}/anmeldungen` | Teilnehmer:in anmelden |

### Teilnehmer — `/api/teilnehmer`

| Methode | Pfad | Beschreibung |
|---------|------|-------------|
| `GET` | `/api/teilnehmer` | Alle Teilnehmer:innen |
| `POST` | `/api/teilnehmer` | Neue:n Teilnehmer:in anlegen |
| `GET` | `/api/teilnehmer/{id}` | Einzelne:n Teilnehmer:in abrufen |

> 📖 Vollständige interaktive API-Dokumentation unter `/docs` (Swagger UI).

---

## Verzeichnisstruktur

```text
pke-keramikwerkstatt/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI App, CORS, Startup
│   │   ├── database.py          # SQLAlchemy Engine + Session
│   │   ├── models.py            # ORM-Modelle (Kurs, Termin, Teilnehmer, Anmeldung)
│   │   ├── schemas.py           # Pydantic-Schemas + Blueprint
│   │   └── routers/
│   │       ├── kurse.py         # CRUD Kurse, Termine, Anmeldungen
│   │       └── teilnehmer.py    # CRUD Teilnehmer
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Router-Setup
│   │   ├── api.ts               # Axios/Fetch API-Client
│   │   ├── pages/
│   │   │   ├── KursListe.tsx    # Kursübersicht (Grid)
│   │   │   ├── KursDetail.tsx   # Detailseite + Termine + Anmeldungen
│   │   │   └── KursForm.tsx     # Kurs anlegen / bearbeiten
│   │   └── components/
│   │       ├── Navigation.tsx   # Top-Navbar
│   │       ├── KursCard.tsx     # Kurskarte für Übersicht
│   │       └── WhatsappVorlage.tsx  # Nachrichtenvorlagen
│   ├── nginx.conf               # Reverse Proxy Konfiguration
│   ├── package.json
│   └── Dockerfile               # Multi-Stage Build (Node → Nginx)
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Konfiguration

Umgebungsvariablen in `.env` (siehe `.env.example`):

| Variable | Standard | Beschreibung |
|----------|----------|-------------|
| `POSTGRES_DB` | `keramikwerkstatt` | Datenbankname |
| `POSTGRES_USER` | `keramik` | DB-Benutzer |
| `POSTGRES_PASSWORD` | `keramik` | DB-Passwort |
| `DATABASE_URL` | `******postgres:5432/keramikwerkstatt` | SQLAlchemy Connection String |
| `ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:8080` | CORS Origins |

---

## Modulübersicht (Gesamtvision)

Phase 1 deckt das **Buchungssystem** ab. Die vollständige Vision umfasst fünf Kernmodule:

| Modul | Beschreibung | Status |
|-------|-------------|--------|
| **Buchungssystem** | Kurse, Termine, Teilnehmer, Warteliste | ✅ Phase 1 |
| **CRM** | Kund:innen, Ansprechpartner, Auftragshistorie | 🔜 geplant |
| **Werkstattplanung** | Drehen → Trocknen → Glasieren → Brennen → Abholung | 🔜 geplant |
| **Brennkalender** | Ofenkapazität, Temperatur, Verantwortliche | 🔜 geplant |
| **Dokumentenmodul** | Rechnungen, Angebote, Lieferscheine | 🔜 geplant |

---

## Nächste Ausbaustufen

- 📦 Lagerlogik mit Verbrauchsbuchungen (Ton, Glasuren, Werkzeuge)
- 🖼️ Bild-/Objektarchiv mit Zustandsverlauf
- 📊 Auswertungen zu Umsatz, Materialverbrauch und Auslastung
- 🔍 OCR/RAG für Rechnungen und Werkstattdokumente
- 📬 E-Mail-/Messenger-Benachrichtigungen
- 📋 Internes Tagesdashboard

---

## Designprinzipien

```
Lokale Souveränität   — Self-hosted, kein Cloud-Zwang
DSGVO-Konformität     — alle Daten on-premise
Type Safety           — TypeScript im Frontend, Pydantic im Backend
API-first             — Swagger Docs, RESTful Endpunkte
Containerisiert       — reproduzierbare Deployments via Docker
Dokumentation as Code — Struktur ist Bedeutung
```

---

<sub>Pilzkeramik · pke-keramikwerkstatt · Phase 1 · Stand: Mai 2025</sub>
