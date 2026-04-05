#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# setup-scanner-rag.sh
# Einrichtung Rechnungs- & Skizzenscanner mit RAG auf CachyOS
#
# Dieses Skript richtet in einem Durchlauf ein:
#   1. Paperless-ngx   → OCR-basierter Dokumentenscanner
#   2. Ollama           → Lokale LLM-Inferenz für RAG
#   3. RAG-Pipeline     → Embedding + Vektorspeicher (ChromaDB)
#   4. Cloudflare Tunnel→ Zero-Trust Zugang (parallel zum Setup)
#
# Idee: Während des Aufbaus der Scanner-Infrastruktur werden
# die Cloudflare-Tunnel schon „gelegt", damit beides gleichzeitig
# fertig ist.  Sicherheitsgegner Nr. 1 = Alltag → automatisieren.
#
# Voraussetzungen:
#   - CachyOS / Arch-basiert
#   - Docker + Docker Compose installiert
#   - Internetzugang (für Container-Images)
#
# HRFR-v2 · sys-Domain · Stand 2025
# ──────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="${PROJECT_DIR:-$HOME/aom-sys-scanner-rag}"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.yml"
LOG_FILE="${LOG_FILE:-/var/log/aom-scanner-setup.log}"

# Cloudflare-Helper einbinden
# shellcheck source=./cloudflare-tunnel-helper.sh
source "$SCRIPT_DIR/cloudflare-tunnel-helper.sh"

# ── Hilfsfunktionen ─────────────────────────────────────────
banner() {
  printf '\n══════════════════════════════════════════════════\n'
  printf '  %s\n' "$*"
  printf '══════════════════════════════════════════════════\n\n'
}

check_prerequisites() {
  banner "Prüfe Voraussetzungen"
  local missing=()
  for cmd in docker; do
    command -v "$cmd" >/dev/null 2>&1 || missing+=("$cmd")
  done
  if (( ${#missing[@]} > 0 )); then
    die "Fehlende Pakete: ${missing[*]}. Bitte installieren."
  fi
  # Docker Compose (Plugin oder standalone)
  if ! docker compose version >/dev/null 2>&1 && ! command -v docker-compose >/dev/null 2>&1; then
    die "Docker Compose nicht gefunden. Bitte installieren: pacman -S docker-compose"
  fi
  log "Alle Voraussetzungen erfüllt ✓"
}

# ── Docker-Compose für Scanner + RAG ────────────────────────
generate_compose() {
  banner "Generiere Docker-Compose"
  mkdir -p "$PROJECT_DIR"

  cat > "$COMPOSE_FILE" <<'YAML'
# ─────────────────────────────────────────────────
# Rechnungs- & Skizzenscanner + RAG Pipeline
# Generiert von setup-scanner-rag.sh
# ─────────────────────────────────────────────────
services:

  # ── Paperless-ngx: Dokumentenscanner + OCR ───
  paperless-web:
    image: ghcr.io/paperless-ngx/paperless-ngx:latest
    container_name: aom-paperless
    restart: unless-stopped
    ports:
      - "8000:8000"
    volumes:
      - paperless-data:/usr/src/paperless/data
      - paperless-media:/usr/src/paperless/media
      - ./consume:/usr/src/paperless/consume   # Eingangsordner
      - ./export:/usr/src/paperless/export
    environment:
      PAPERLESS_OCR_LANGUAGE: deu+eng
      PAPERLESS_TIME_ZONE: Europe/Berlin
      PAPERLESS_CONSUMER_POLLING: 10
      PAPERLESS_CONSUMER_RECURSIVE: "true"
      PAPERLESS_FILENAME_FORMAT: "{created_year}/{correspondent}/{title}"
      PAPERLESS_REDIS: redis://redis:6379
      PAPERLESS_DBHOST: postgres
    depends_on:
      - redis
      - postgres

  redis:
    image: redis:7-alpine
    container_name: aom-paperless-redis
    restart: unless-stopped
    volumes:
      - redis-data:/data

  postgres:
    image: postgres:16-alpine
    container_name: aom-paperless-db
    restart: unless-stopped
    volumes:
      - postgres-data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: paperless
      POSTGRES_USER: paperless
      POSTGRES_PASSWORD: "${PAPERLESS_DB_PASS:-paperless}"

  # ── Ollama: Lokale LLM-Inferenz ─────────────
  ollama:
    image: ollama/ollama:latest
    container_name: aom-ollama
    restart: unless-stopped
    ports:
      - "11434:11434"
    volumes:
      - ollama-data:/root/.ollama

  # ── ChromaDB: Vektorspeicher für RAG ─────────
  chromadb:
    image: chromadb/chroma:latest
    container_name: aom-chromadb
    restart: unless-stopped
    ports:
      - "8100:8000"
    volumes:
      - chroma-data:/chroma/chroma
    environment:
      ANONYMIZED_TELEMETRY: "false"

volumes:
  paperless-data:
  paperless-media:
  redis-data:
  postgres-data:
  ollama-data:
  chroma-data:
YAML

  log "Docker-Compose geschrieben → $COMPOSE_FILE"
}

# ── Verzeichnisse vorbereiten ────────────────────────────────
prepare_dirs() {
  banner "Erstelle Verzeichnisse"
  mkdir -p "$PROJECT_DIR"/{consume/rechnungen,consume/skizzen,export,scripts}
  log "Verzeichnisse erstellt:"
  log "  $PROJECT_DIR/consume/rechnungen  ← Rechnungen hier ablegen"
  log "  $PROJECT_DIR/consume/skizzen     ← Skizzen hier ablegen"
  log "  $PROJECT_DIR/export              ← Paperless-Export"
  log "  $PROJECT_DIR/scripts             ← Hilfsskripte"
}

# ── RAG-Indexer-Skript erzeugen ──────────────────────────────
generate_rag_indexer() {
  banner "Generiere RAG-Indexer"

  cat > "$PROJECT_DIR/scripts/rag-indexer.py" <<'PYTHON'
#!/usr/bin/env python3
"""
RAG-Indexer: Paperless-ngx Dokumente → ChromaDB Embedding

Holt neue/geänderte Dokumente aus Paperless-ngx via API,
erzeugt Embeddings über Ollama und speichert sie in ChromaDB
für spätere RAG-Abfragen (z.B. durch den Buchhaltungsbot).

Voraussetzungen:
  pip install requests chromadb-client ollama
"""

import os
import sys
import json
import hashlib
from datetime import datetime

PAPERLESS_URL = os.getenv("PAPERLESS_URL", "http://localhost:8000")
PAPERLESS_TOKEN = os.getenv("PAPERLESS_TOKEN", "")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")
CHROMA_URL = os.getenv("CHROMA_URL", "http://localhost:8100")
COLLECTION_NAME = "aom-dokumente"


def main():
    try:
        import requests
        import chromadb
    except ImportError:
        print("Bitte installieren: pip install requests chromadb-client ollama")
        sys.exit(1)

    # ChromaDB-Client
    from urllib.parse import urlparse
    _parsed = urlparse(CHROMA_URL)
    chroma = chromadb.HttpClient(host=_parsed.hostname or "localhost",
                                  port=_parsed.port or 8000)
    collection = chroma.get_or_create_collection(name=COLLECTION_NAME)

    # Paperless-ngx Dokumente abrufen
    headers = {}
    if PAPERLESS_TOKEN:
        headers["Authorization"] = f"Token {PAPERLESS_TOKEN}"

    resp = requests.get(f"{PAPERLESS_URL}/api/documents/", headers=headers)
    resp.raise_for_status()
    documents = resp.json().get("results", [])

    indexed = 0
    for doc in documents:
        doc_id = str(doc["id"])
        content = doc.get("content", "")
        if not content:
            continue

        # Hash prüfen ob bereits indexiert
        content_hash = hashlib.sha256(content.encode()).hexdigest()[:16]
        existing = collection.get(ids=[doc_id])
        if existing and existing.get("metadatas"):
            meta = existing["metadatas"][0] if existing["metadatas"] else {}
            if meta.get("content_hash") == content_hash:
                continue  # Bereits aktuell

        # Embedding via Ollama
        embed_resp = requests.post(f"{OLLAMA_URL}/api/embeddings", json={
            "model": OLLAMA_MODEL,
            "prompt": content[:4000]  # Tokengrenze beachten
        })
        embed_resp.raise_for_status()
        embedding = embed_resp.json().get("embedding", [])

        if not embedding:
            print(f"  Kein Embedding für Dokument {doc_id}, überspringe")
            continue

        # In ChromaDB speichern
        collection.upsert(
            ids=[doc_id],
            embeddings=[embedding],
            documents=[content[:2000]],
            metadatas=[{
                "title": doc.get("title", ""),
                "correspondent": doc.get("correspondent", ""),
                "created": doc.get("created", ""),
                "content_hash": content_hash,
                "indexed_at": datetime.now().isoformat(),
            }]
        )
        indexed += 1
        print(f"  ✓ Dokument {doc_id}: {doc.get('title', '?')}")

    print(f"\n{indexed} Dokument(e) indexiert in '{COLLECTION_NAME}'")


if __name__ == "__main__":
    main()
PYTHON

  chmod +x "$PROJECT_DIR/scripts/rag-indexer.py"
  log "RAG-Indexer geschrieben → $PROJECT_DIR/scripts/rag-indexer.py"
}

# ── Cloudflare-Tunnel parallel aufsetzen ─────────────────────
setup_cloudflare_parallel() {
  banner "Cloudflare-Tunnel Setup (parallel)"

  # cloudflared installieren
  install_cloudflared

  # Tunnel erstellen (falls nicht vorhanden)
  create_tunnel "$CF_TUNNEL_NAME"

  # Config generieren (Paperless + Ollama + Bot-Endpoint)
  generate_config

  # DNS-Routen setzen (falls Domain konfiguriert)
  if [ "${CF_DOMAIN:-}" != "" ] && [ "${CF_DOMAIN:-}" != "example.com" ]; then
    add_dns_route "paperless.${CF_DOMAIN}" || true
    add_dns_route "ollama.${CF_DOMAIN}" || true
    add_dns_route "bot.${CF_DOMAIN}" || true
  fi

  # Tunnel starten
  if [ -n "${CF_TUNNEL_TOKEN:-}" ]; then
    start_tunnel_token
  else
    start_tunnel
  fi

  log "Cloudflare-Tunnel bereit ✓"
}

# ── Ollama-Modelle vorziehen ─────────────────────────────────
pull_ollama_models() {
  banner "Lade Ollama-Modelle"
  local models=("nomic-embed-text" "llama3.2:3b")
  for model in "${models[@]}"; do
    log "Lade Modell: $model …"
    docker exec aom-ollama ollama pull "$model" 2>/dev/null \
      || log "Modell '$model' konnte noch nicht geladen werden (Container ggf. noch nicht bereit)"
  done
}

# ── Docker-Services starten ──────────────────────────────────
start_services() {
  banner "Starte Docker-Services"
  cd "$PROJECT_DIR"

  if docker compose version >/dev/null 2>&1; then
    docker compose up -d
  else
    docker-compose up -d
  fi
  log "Docker-Services gestartet ✓"
}

# ── Zusammenfassung ──────────────────────────────────────────
print_summary() {
  banner "Setup abgeschlossen ✓"
  cat <<EOF
Rechnungs- & Skizzenscanner mit RAG ist eingerichtet.

Services:
  Paperless-ngx   → http://localhost:8000
  Ollama API      → http://localhost:11434
  ChromaDB        → http://localhost:8100

Rechnungen ablegen in:  $PROJECT_DIR/consume/rechnungen/
Skizzen ablegen in:     $PROJECT_DIR/consume/skizzen/

Cloudflare-Tunnel:
  Status:  $(status_tunnel 2>&1 || echo "nicht konfiguriert")

Nächste Schritte:
  1. Paperless-ngx Admin anlegen:
     docker exec -it aom-paperless python3 manage.py createsuperuser
  2. Ollama-Modelle laden (falls noch nicht geschehen):
     docker exec aom-ollama ollama pull nomic-embed-text
     docker exec aom-ollama ollama pull llama3.2:3b
  3. Buchhaltungsbot starten:
     $SCRIPT_DIR/buchhaltungsbot.sh start

EOF
}

# ── Hauptablauf ──────────────────────────────────────────────
main() {
  banner "aom-sys Scanner + RAG Setup"
  log "Start: $(date -Iseconds)"

  check_prerequisites
  prepare_dirs
  generate_compose
  generate_rag_indexer

  # ── Paralleler Start: Cloudflare-Tunnel + Docker-Services ──
  # Tunnel-Setup läuft im Hintergrund während Docker startet
  log "Starte Cloudflare-Tunnel-Setup parallel …"
  setup_cloudflare_parallel &
  local cf_pid=$!

  start_services

  # Warten bis Cloudflare fertig ist
  if wait "$cf_pid" 2>/dev/null; then
    log "Cloudflare-Tunnel-Setup erfolgreich abgeschlossen"
  else
    log "WARNUNG: Cloudflare-Tunnel-Setup hatte Fehler (ggf. manuell prüfen)"
  fi

  # Ollama-Modelle nachladen (Services müssen laufen)
  sleep 5
  pull_ollama_models

  print_summary
  log "Setup fertig: $(date -Iseconds)"
}

# ── CLI ──────────────────────────────────────────────────────
case "${1:-run}" in
  run|setup)    main ;;
  compose-only) generate_compose; log "Nur Compose-Datei generiert: $COMPOSE_FILE" ;;
  help|--help|-h)
    cat <<EOF
Nutzung: $(basename "$0") [command]

Befehle:
  run / setup     Vollständiges Setup ausführen (Standard)
  compose-only    Nur Docker-Compose generieren

Umgebungsvariablen:
  PROJECT_DIR          Projektverzeichnis  (default: ~/aom-sys-scanner-rag)
  CF_TUNNEL_NAME       Tunnel-Name         (default: aom-cachyos-tunnel)
  CF_TUNNEL_TOKEN      Cloudflare-Token    (optional, für Token-Modus)
  CF_DOMAIN            Domain              (z.B. meinedomain.de)
  PAPERLESS_DB_PASS    Paperless DB-Passwort (default: paperless)
  LOG_FILE             Log-Datei           (default: /var/log/aom-scanner-setup.log)
EOF
    ;;
  *) die "Unbekannter Befehl: $1 (→ help)" ;;
esac
