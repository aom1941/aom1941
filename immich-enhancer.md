# immich-enhancer — Konzept & Architektur

> Server-seitiger Enhancer für Immich: Automatisiertes Tagging, ML-Kuration,
> Service-Brücken und Lifecycle-Management.  
> Stand: 2025 · aom1941-Ökosystem

---

## Idee

Immich liefert eine solide Foto-/Video-Verwaltung. Was fehlt: die Anbindung an
den restlichen Self-Hosted-Stack. **immich-enhancer** schließt diese Lücke —
ein modularer Sidecar-Service, der Immich um ML-Kuration, LLM-Tagging und
Service-Brücken erweitert, ohne Immich selbst zu forken.

### Designprinzipien

- **Immich bleibt der Kern** — der Enhancer liest und schreibt ausschließlich über die Immich REST-API
- **Modular** — jedes Modul ist unabhängig aktivier-/deaktivierbar
- **Lokale Souveränität** — alle Daten bleiben on-premise, kein Cloud-Dienst
- **80/20** — zuerst die Module mit dem höchsten Hebel

---

## Architektur

```
┌─────────────────────────────────────────────────────────┐
│  CachyOS Docker-Host                                    │
│                                                         │
│  ┌───────────┐     ┌──────────────────────────┐         │
│  │  Immich    │◄───►│  immich-enhancer          │         │
│  │  (API)     │     │  (Python · FastAPI)       │         │
│  └───────────┘     │                            │         │
│                    │  ┌─ Event Listener ────────┤         │
│  ┌───────────┐     │  │  (Webhooks / Polling)   │         │
│  │ Paperless  │◄───│  ├─ PICAS Bridge           │         │
│  │   -ngx     │     │  ├─ Ollama Tagger         │         │
│  └───────────┘     │  ├─ Album Curator          │         │
│                    │  ├─ Paperless Router        │         │
│  ┌───────────┐     │  └─ Lifecycle Manager      │         │
│  │ PostgreSQL │◄───┘                            │         │
│  └───────────┘                                  │         │
│                                                 │         │
│  ┌───────────────────────────────┐              │         │
│  │  Mac Mini M1 (via Tailscale)  │              │         │
│  │  Ollama MLX · Vision-LLM     │◄─────────────┘         │
│  └───────────────────────────────┘                        │
│                                                           │
│  ┌───────────┐                                            │
│  │ Restic     │── WD NAS (verschlüsselt)                  │
│  └───────────┘                                            │
└───────────────────────────────────────────────────────────┘
```

---

## Module

### 1. Event Listener — Fundament

Lauscht auf neue Assets in Immich und verteilt Events an die Module.

| Mechanismus | Details |
|-------------|---------|
| **Immich Webhooks** | Bevorzugt; ab Immich v1.91+ |
| **Polling-Fallback** | Periodisches Abfragen der API (`/api/assets`) |

Jedes Modul registriert sich beim Event Listener und empfängt neue Assets.

### 2. PICAS Bridge — Foto-Kuration via ML

Verbindet die bestehende PICAS ML-Pipeline (aom-kre-picas) mit Immich.

```
Immich Asset (neu)
    → CLIP-Embedding berechnen
    → MobileNetV3 Punctum/Studium-Score
    → Score + Tags zurück in Immich schreiben
```

- Nutzt die bestehende PICAS FastAPI als Upstream
- Schreibt Ergebnisse als Immich-Tags und/oder in Alben
- Ermöglicht: „Zeige mir alle Fotos mit Punctum-Score > 0.8"

### 3. Ollama Vision Tagger — LLM-gestützte Bildbeschreibung

```
Immich Asset (neu)
    → Bild an Ollama Vision-Modell (LLaVA / Moondream)
    → Beschreibung + semantische Tags generieren
    → Als Immich-Beschreibung + Tags speichern
```

- Ollama läuft auf Mac Mini M1 (MLX), erreichbar via Tailscale
- Ergänzt die PICAS-Kuration um natürliche Sprache
- Konfigurierbar: Prompt-Templates, Tag-Whitelist, Sprache

### 4. Smart Album Curator — Automatische Alben

Erstellt und pflegt Alben basierend auf:

| Kriterium | Beispiel |
|-----------|---------|
| PICAS Punctum-Score | „Best of 2025" (Score > 0.8) |
| Zeitliche Cluster | „Wochenende Freiburg Mai 2025" |
| Geo-Cluster | „Schwarzwald", „Stuttgart" |
| Semantische Ähnlichkeit | Themen-Cluster via CLIP-Embeddings |

### 5. Paperless Router — Dokument-Erkennung

```
Immich Asset (neu)
    → Klassifikation: Foto vs. Dokument/Rechnung
    → Wenn Dokument: an Paperless-ngx API weiterleiten
    → Optional: aus Immich entfernen oder taggen
```

Passt zum bestehenden Rechnungsscanner-Workflow (workflows/).

### 6. Lifecycle Manager — Backup & Speicher

- **Restic-Integration:** Immich-Bibliothek → WD NAS (verschlüsselt, dedupliziert)
- **Storage-Policies:** RAW-Dateien nach X Tagen archivieren/komprimieren
- **Monitoring:** Speicherplatz-Alerts, Upload-Statistiken

---

## Tech-Stack

| Komponente | Technologie | Begründung |
|------------|-------------|------------|
| Runtime | Python · FastAPI | Konsistent mit PICAS und Paperless-Ökosystem |
| Event-System | Immich Webhooks + Polling | Robuster Dual-Mode |
| ML-Inference | PICAS (MobileNetV3 · CLIP) + Ollama API | Bereits vorhanden |
| Datenbank | PostgreSQL | Bereits im Stack; für Caching und Zustandsspeicher |
| Deployment | Docker Compose | Konsistent mit restlichem Stack |
| Scheduling | APScheduler | Für periodische Tasks (Curator, Lifecycle) |
| Config | Pydantic Settings (.env) | Typsicher, validiert |

---

## Geplante Repo-Struktur

```
immich-enhancer/
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── README.md
├── src/
│   ├── main.py                  # FastAPI Entry
│   ├── config.py                # Pydantic Settings
│   ├── immich_client.py         # Immich API Wrapper
│   ├── modules/
│   │   ├── picas_bridge.py      # PICAS ↔ Immich
│   │   ├── ollama_tagger.py     # Vision-LLM Tagging
│   │   ├── album_curator.py     # Smart Album Logic
│   │   ├── paperless_router.py  # Dokument → Paperless-ngx
│   │   └── lifecycle.py         # Backup & Archiv-Policies
│   └── events/
│       ├── webhook_handler.py   # Immich Webhook Receiver
│       └── poller.py            # Fallback Polling
└── tests/
```

---

## Priorisierung

| Phase | Modul | Aufwand | Impact | Status |
|-------|-------|---------|--------|--------|
| **1** | Event Listener + Immich API Client | Klein | Fundament | ⬜ |
| **2** | PICAS Bridge | Mittel | ⭐ Höchster Hebel | ⬜ |
| **3** | Ollama Vision Tagger | Klein | Sofort nutzbar | ⬜ |
| **4** | Smart Album Curator | Mittel | Automatische Kuration | ⬜ |
| **5** | Paperless Router | Klein | Brücke zu bestehendem Workflow | ⬜ |
| **6** | Lifecycle Manager | Optional | Nice-to-have | ⬜ |

---

## Abhängigkeiten im Ökosystem

```
immich-enhancer
    ├── Immich           (REST API, Webhooks)
    ├── aom-kre-picas    (FastAPI, CLIP, MobileNetV3)
    ├── Ollama           (Vision-LLM auf Mac Mini M1)
    ├── Paperless-ngx    (REST API)
    ├── PostgreSQL       (shared oder eigene Instanz)
    ├── Restic           (Backup CLI)
    └── Tailscale        (Netzwerk zwischen Docker-Host und Mac Mini)
```

---

## Offene Fragen

- [ ] Eigene PostgreSQL-Instanz oder Immich-DB mitnutzen?
- [ ] PICAS als importiertes Python-Paket oder über HTTP-API ansprechen?
- [ ] Webhook-Secret-Management: wie Immich Webhooks absichern?
- [ ] ProCamera (iPhone) Upload-Workflow: iOS Shortcuts → Immich API direkt?
- [ ] Album-Curator: regelbasiert (Config) oder ML-gestützt (Clustering)?

---

<sub>immich-enhancer.md · aom1941 · Konzeptdokument · 2025</sub>
