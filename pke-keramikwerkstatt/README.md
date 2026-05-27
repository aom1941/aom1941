# pke-keramikwerkstatt — MVP-Setup

Self-hosted MVP für eine Keramikwerkstatt-Organisations-Webapp mit klarer Trennung von Werkstattabläufen, Buchung/Produktion und Dokumentenorganisation.

## Stack

- **Frontend:** React + Vite
- **Backend:** FastAPI
- **Datenbank:** PostgreSQL
- **Betrieb:** Docker Compose
- **Dateien/Bilder:** S3-kompatibel oder NAS/Lokalspeicher
- **Dokumente/OCR:** optional per Paperless-/OCR-Anbindung

## MVP-Scope

- Kundenverwaltung
- Auftrags- und Werkstückverwaltung
- Brennkalender
- Kurs- und Workshop-Buchungen
- Rechnungs- und Dokumentenablage

## Verzeichnis

```text
pke-keramikwerkstatt/
├── backend/              # FastAPI API + Blueprint-Daten
├── frontend/             # React UI für Rollen, Module, Seiten und Roadmap
├── .env.example          # Beispielkonfiguration
└── docker-compose.yml    # Lokaler self-hosted Start
```

## Schnellstart

```bash
cd /tmp/workspace/aom1941/aom1941/pke-keramikwerkstatt
cp .env.example .env
docker compose up --build
```

Danach:

- Frontend: `http://localhost:8080`
- Backend: `http://localhost:8000`
- API: `http://localhost:8000/api/blueprint`

## Lokal ohne Docker

### Backend

```bash
cd /tmp/workspace/aom1941/aom1941/pke-keramikwerkstatt/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd /tmp/workspace/aom1941/aom1941/pke-keramikwerkstatt/frontend
npm install
npm run dev
```

## Modulkern

- **CRM:** Kund:innen, Ansprechpartner, Status, Notizen
- **Werkstattplanung:** Drehen, Trocknen, Glasieren, Brennen, Abholung
- **Brennkalender:** Ofenkapazität, Temperatur, Status, Verantwortliche
- **Buchungen:** Kurse, offene Werkstatt, Einzeltermine, Warteliste
- **Dokumente:** Rechnungen, Angebote, Lieferscheine, Formulare
- **Inventar:** Ton, Glasuren, Werkzeuge, Mindestbestände
- **Medienarchiv:** Werkstückfotos, Referenzen, Zustandsdokumentation

## Nächste Ausbaustufen

- Lagerlogik mit Verbrauchsbuchungen
- Bild-/Objektarchiv mit Zustandsverlauf
- Auswertungen zu Umsatz, Materialverbrauch und Auslastung
- OCR/RAG für Rechnungen und Werkstattdokumente
- E-Mail-/Messenger-Benachrichtigungen
- Internes Tagesdashboard
