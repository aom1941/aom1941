# workflows/ — Rechnungs-/Skizzenscanner + RAG + Buchhaltungsbot

> Sicherheitsgegner Nr. 1 = Alltag → automatisieren.

Dieses Verzeichnis enthält die Workflow-Skripte für den CachyOS Self-Hosted Stack.
Kernidee: Während dem Aufsetzen des Rechnungs- und Skizzenscanners mit RAG werden
die Cloudflare-Tunnel **parallel** gelegt — und ein kleiner Buchhaltungsbot übernimmt
danach das lästige Cloudflare-Gedöns gleich mit.

---

## Übersicht

| Skript | Funktion |
|--------|----------|
| [`setup-scanner-rag.sh`](setup-scanner-rag.sh) | Einrichtung Scanner + RAG + Cloudflare-Tunnel (alles in einem Lauf) |
| [`buchhaltungsbot.sh`](buchhaltungsbot.sh) | Dauerlauf-Bot: Buchhaltung **und** Cloudflare-Tunnel-Verwaltung |
| [`cloudflare-tunnel-helper.sh`](cloudflare-tunnel-helper.sh) | Cloudflare-Tunnel Hilfsfunktionen (wird von beiden Skripten genutzt) |

---

## Architektur

```
┌──────────────────────────────────────────────────────────┐
│                    CachyOS i9 Mini-PC                    │
│                                                          │
│  ┌─────────────┐  ┌──────────┐  ┌──────────────────┐    │
│  │ Paperless-  │  │  Ollama   │  │    ChromaDB       │    │
│  │ ngx (OCR)   │  │  (LLM)   │  │  (Vektorspeicher) │    │
│  │  :8000      │  │  :11434  │  │    :8100          │    │
│  └──────┬──────┘  └────┬─────┘  └────────┬──────────┘    │
│         │              │                  │               │
│         └──────────────┼──────────────────┘               │
│                        │                                  │
│              ┌─────────┴──────────┐                       │
│              │  Buchhaltungsbot   │                       │
│              │    :8077 (health)  │                       │
│              │                    │                       │
│              │  📄 Rechnungen     │                       │
│              │  🔍 RAG-Index      │                       │
│              │  🤖 LLM-Zusammenf. │                       │
│              │  🔒 CF-Tunnel      │                       │
│              └─────────┬──────────┘                       │
│                        │                                  │
│              ┌─────────┴──────────┐                       │
│              │  Cloudflare Tunnel │                       │
│              │   (cloudflared)    │                       │
│              └─────────┬──────────┘                       │
└────────────────────────┼──────────────────────────────────┘
                         │
                    ─────┴─────
                    Internet / CF Edge
```

---

## Schnellstart

### 1. Scanner + RAG + Tunnel aufsetzen

```bash
# Umgebungsvariablen setzen
export CF_TUNNEL_TOKEN="<dein-cloudflare-token>"  # oder ohne für config-Modus
export CF_DOMAIN="meinedomain.de"
export PAPERLESS_DB_PASS="sicheres-passwort"

# Setup starten (Scanner + RAG + Tunnel parallel)
./workflows/setup-scanner-rag.sh
```

### 2. Buchhaltungsbot starten

```bash
# Bot im Hintergrund starten
./workflows/buchhaltungsbot.sh start

# Status prüfen
./workflows/buchhaltungsbot.sh status

# Stoppen
./workflows/buchhaltungsbot.sh stop
```

### 3. Cloudflare-Tunnel manuell verwalten

```bash
# Status prüfen
./workflows/cloudflare-tunnel-helper.sh status

# Neustart
./workflows/cloudflare-tunnel-helper.sh restart

# Health-Check (nutzt auch der Bot)
./workflows/cloudflare-tunnel-helper.sh healthcheck
```

---

## Kann der Bot das Cloudflare-Gedöns abnehmen?

**Ja.** Der Buchhaltungsbot überwacht den Cloudflare-Tunnel automatisch:

- **Alle 60 Sekunden**: Health-Check des Tunnels
- **Bei Ausfall**: Automatischer Neustart (bis zu 3 Versuche)
- **Logging**: Alle Tunnel-Ereignisse im Bot-Log
- **Health-Endpoint**: `http://localhost:8077` für Monitoring

Der Bot kombiniert Buchhaltung und Tunnel-Verwaltung in einer Schleife,
weil beides zum „Alltags-Autopilot" gehört — genau gegen den
Sicherheitsgegner Nr. 1.

---

## Services & Ports

| Service | Port | Beschreibung |
|---------|------|-------------|
| Paperless-ngx | 8000 | Dokumentenscanner, OCR (deu+eng) |
| Ollama | 11434 | LLM-Inferenz (lokal) |
| ChromaDB | 8100 | Vektorspeicher für RAG-Embeddings |
| PostgreSQL | 5432 | Paperless-Datenbank |
| Redis | 6379 | Paperless-Queue |
| Bot Health | 8077 | Buchhaltungsbot Health-Endpoint |

---

## RAG-Pipeline

```
Dokument → Paperless-ngx (OCR) → rag-indexer.py → Ollama Embedding → ChromaDB
                                                       ↓
                                              Buchhaltungsbot
                                                       ↓
                                              LLM-Zusammenfassung
```

**Modelle:**
- `nomic-embed-text` — Embedding für RAG-Vektoren
- `llama3.2:3b` — Zusammenfassungen und Klassifizierung

---

<sub>HRFR-v2 · sys-Domain · Stand 2025</sub>
