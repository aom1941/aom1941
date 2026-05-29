# pke-keramikwerkstatt

Self-hosted Organisations-Webapp für ein Keramik-Atelier — Kursverwaltung, Teilnehmerkommunikation, Materialplanung und Dashboard.

## Features

### Dashboard
- Tagesüberblick mit nächsten Kursterminen und Auslastungsbalken
- Statistiken: Kurse, Teilnehmer, Anmeldungen auf einen Blick
- Materialwarnungen wenn Bestände unter Mindestmenge fallen
- Schnellzugriff auf alle Module

### Kursverwaltung
- Kurse anlegen mit Name, Beschreibung, Kapazität, Preis und Status
- Termine (Datum, Uhrzeit) pro Kurs verwalten
- Status: Geplant → Aktiv → Abgeschlossen / Abgesagt

### Teilnehmerverwaltung
- Teilnehmer direkt bei der Anmeldung erfassen (Vorname, Nachname, Telefon, E-Mail)
- Status: Bestätigt oder Warteliste
- Suchfunktion mit aufklappbarer Kurshistorie pro Person

### WhatsApp-Vorlagen
- Buchungsbestätigung und Kurserinnerung als kopierfertige Nachrichten
- Automatisch mit Kursname, Datum und Uhrzeit befüllt

### Materialplanung (Wirtschaften)
- Material anlegen: Ton, Glasuren, Werkzeuge mit Bestand, Mindestmenge und Preis
- Materialplan pro Kurs: Menge pro Teilnehmer → Gesamtbedarf automatisch berechnet
- Materialkosten pro Teilnehmer und für den gesamten Kurs
- Statusanzeige: Bestand ausreichend / Nachbestellen nötig

## Stack

| Schicht | Technologie |
|--------|------------|
| Frontend | React 19 + Vite + TypeScript + React Router v7 |
| Backend | FastAPI + SQLAlchemy 2.0 + Pydantic v2 |
| Datenbank | PostgreSQL 16 |
| Betrieb | Docker Compose |
| Proxy | nginx |

DSGVO-freundlich: läuft vollständig self-hosted, keine Drittanbieter-Dienste.

## Schnellstart

```bash
git clone https://github.com/pilzkeramik/pke-keramikwerkstatt.git
cd pke-keramikwerkstatt
cp .env.example .env
docker compose up --build
```

Danach:
- **App:** [http://localhost:8080](http://localhost:8080)
- **API-Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

Die Datenbanktabellen werden beim ersten Start automatisch angelegt.

## Lokal entwickeln (ohne Docker)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
DATABASE_URL=postgresql://keramik:keramik@localhost:5432/keramikwerkstatt \
  uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev   # läuft auf http://localhost:5173, proxied /api → localhost:8000
```

## Verzeichnis

```
pke-keramikwerkstatt/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI-App, CORS, Lifespan
│   │   ├── models.py        # SQLAlchemy-Modelle
│   │   ├── schemas.py       # Pydantic v2 Schemas
│   │   ├── database.py      # Engine + Session
│   │   ├── catalog.py       # Blueprint-Daten
│   │   └── routers/
│   │       ├── kurse.py     # Kurse, Termine, Anmeldungen, Kursmaterialien
│   │       ├── teilnehmer.py
│   │       ├── materialien.py
│   │       └── dashboard.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/           # Dashboard, Kurse, Teilnehmer, Material
│   │   ├── components/      # Navigation, KursCard, WhatsappVorlage
│   │   ├── api.ts           # typisierter API-Client
│   │   ├── App.tsx          # Router + Routes
│   │   └── App.css          # Design-System
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
└── .env.example
```

## Roadmap

- [ ] Brennkalender (Ofenbelegung, Temperaturprofile, Status)
- [ ] Inventarbuchungen (Materialverbrauch automatisch abziehen nach Kurs)
- [ ] Rechnungs- und Dokumentenablage
- [ ] Tagesprotokoll / Schichtnotizen
- [ ] E-Mail- oder Messenger-Benachrichtigungen

## Umgebungsvariablen

Siehe `.env.example`. Die wichtigsten:

| Variable | Standard | Beschreibung |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://keramik:keramik@postgres:5432/keramikwerkstatt` | PostgreSQL-Verbindung |
| `POSTGRES_USER` | `keramik` | DB-Benutzer |
| `POSTGRES_PASSWORD` | `keramik` | DB-Passwort (in Produktion ändern!) |
| `POSTGRES_DB` | `keramikwerkstatt` | Datenbankname |
| `ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:8080` | CORS-Ursprünge |

---

Gebaut für den echten Werkstattalltag — klein, schnell, self-hosted.
