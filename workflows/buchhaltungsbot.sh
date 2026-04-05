#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# buchhaltungsbot.sh
# Kleiner Buchhaltungsbot — immer auf der Suche
#
# Kombiniert drei Aufgaben in einer Schleife:
#   A) Buchhaltung: Neue Rechnungen/Dokumente erkennen,
#      RAG-Index aktualisieren, Zusammenfassungen generieren
#   B) Cloudflare:  Tunnel-Gesundheit prüfen, bei Ausfall
#      automatisch neu starten → „das lästige CF-Gedöns abnehmen"
#   C) Hawk Eye:    PII-/Sensitivdaten-Scan auf neue Dokumente
#      (DSGVO-Konformität automatisch sicherstellen)
#
# Damit ist die Antwort auf die Frage: JA, der Bot kann auch
# das Cloudflare-Gedöns übernehmen.
#
# Sicherheitsgegner Nr. 1 = Alltag → der Bot macht es automatisch.
#
# Voraussetzungen:
#   - Paperless-ngx + Ollama + ChromaDB laufen (via setup-scanner-rag.sh)
#   - cloudflare-tunnel-helper.sh im selben Verzeichnis
#   - Optional: jq, curl für API-Aufrufe
#
# HRFR-v2 · sys-Domain · Stand 2025
# ──────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="${LOG_FILE:-/var/log/aom-buchhaltungsbot.log}"
PID_FILE="${PID_FILE:-/tmp/aom-buchhaltungsbot.pid}"

# Intervalle (Sekunden)
CHECK_INTERVAL="${CHECK_INTERVAL:-300}"       # 5 Minuten
CF_CHECK_INTERVAL="${CF_CHECK_INTERVAL:-60}"  # 1 Minute
HAWK_EYE_INTERVAL="${HAWK_EYE_INTERVAL:-600}" # 10 Minuten
MAX_CF_RETRIES="${MAX_CF_RETRIES:-3}"

# Service-URLs
PAPERLESS_URL="${PAPERLESS_URL:-http://localhost:8000}"
PAPERLESS_TOKEN="${PAPERLESS_TOKEN:-}"
OLLAMA_URL="${OLLAMA_URL:-http://localhost:11434}"
CHROMA_URL="${CHROMA_URL:-http://localhost:8100}"
OLLAMA_MODEL="${OLLAMA_MODEL:-llama3.2:3b}"

# Health-Endpoint für den Bot selbst
BOT_HEALTH_PORT="${BOT_HEALTH_PORT:-8077}"

# Cloudflare-Helper einbinden
# shellcheck source=./cloudflare-tunnel-helper.sh
source "$SCRIPT_DIR/cloudflare-tunnel-helper.sh"

# ── OLLAMA Basic-Auth aus URL extrahieren ────────────────────
# Unterstützt: http://user:pass@host:port/path
_parse_ollama_url() {
  OLLAMA_CURL_AUTH=""
  OLLAMA_URL_CLEAN="$OLLAMA_URL"
  if [[ "$OLLAMA_URL" =~ ^(https?://)([^:@/]+):([^@/]+)@(.+)$ ]]; then
    OLLAMA_CURL_AUTH="${BASH_REMATCH[2]}:${BASH_REMATCH[3]}"
    OLLAMA_URL_CLEAN="${BASH_REMATCH[1]}${BASH_REMATCH[4]}"
  elif [[ "$OLLAMA_URL" =~ ^(https?://)([^@/]+)@(.+)$ ]]; then
    OLLAMA_CURL_AUTH="${BASH_REMATCH[2]}"
    OLLAMA_URL_CLEAN="${BASH_REMATCH[1]}${BASH_REMATCH[3]}"
  fi
  # Array für sicheres Übergeben an curl (kein Word-Splitting bei Sonderzeichen)
  OLLAMA_CURL_FLAGS=()
  if [ -n "$OLLAMA_CURL_AUTH" ]; then
    OLLAMA_CURL_FLAGS=(--user "$OLLAMA_CURL_AUTH")
  fi
}
_parse_ollama_url

# ── Logging ──────────────────────────────────────────────────
bot_log() { printf '[BOT %s] %s\n' "$(date -Iseconds)" "$*" | tee -a "$LOG_FILE" 2>/dev/null || printf '[BOT %s] %s\n' "$(date -Iseconds)" "$*"; }
bot_log_pipe() { local tag="${1:-}"; while IFS= read -r line; do bot_log "  $tag $line"; done; }

# ── A) Buchhaltungs-Aufgaben ─────────────────────────────────

# Neue Dokumente in Paperless-ngx prüfen
check_new_documents() {
  bot_log "Prüfe neue Dokumente …"

  local count
  count=$(curl -sf "$PAPERLESS_URL/api/documents/?ordering=-added" \
    ${PAPERLESS_TOKEN:+-H "Authorization: Token $PAPERLESS_TOKEN"} 2>/dev/null \
    | python3 -c "import sys,json; print(json.load(sys.stdin).get('count',0))" 2>/dev/null \
    || echo "0")

  bot_log "Dokumente in Paperless: $count"
}

# RAG-Index aktualisieren
update_rag_index() {
  bot_log "Aktualisiere RAG-Index …"
  local indexer="$SCRIPT_DIR/../scripts/rag-indexer.py"
  [ -f "$indexer" ] && indexer="$indexer"
  # Fallback: im Projektverzeichnis suchen
  [ -f "$indexer" ] || indexer="${PROJECT_DIR:-$HOME/aom-sys-scanner-rag}/scripts/rag-indexer.py"

  if [ -f "$indexer" ]; then
    PAPERLESS_URL="$PAPERLESS_URL" \
    PAPERLESS_TOKEN="$PAPERLESS_TOKEN" \
    OLLAMA_URL="$OLLAMA_URL" \
    CHROMA_URL="$CHROMA_URL" \
    python3 "$indexer" 2>&1 | bot_log_pipe "[RAG]"
  else
    bot_log "RAG-Indexer nicht gefunden, überspringe"
  fi
}

# Zusammenfassung neuer Rechnungen via LLM
summarize_new_invoices() {
  bot_log "Erstelle Rechnungszusammenfassungen …"

  local headers=""
  if [ -n "$PAPERLESS_TOKEN" ]; then
    headers="Authorization: Token $PAPERLESS_TOKEN"
  fi

  # Letzte 5 Dokumente mit Tag "Rechnung" (falls vorhanden)
  local docs
  docs=$(curl -sf "$PAPERLESS_URL/api/documents/?ordering=-added&page_size=5" \
    ${headers:+-H "$headers"} 2>/dev/null || echo '{"results":[]}')

  local titles
  titles=$(echo "$docs" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for d in data.get('results', [])[:5]:
    print(f\"- {d.get('title','?')} (ID: {d['id']})\")
" 2>/dev/null || echo "(keine)")

  if [ "$titles" = "(keine)" ] || [ -z "$titles" ]; then
    bot_log "Keine neuen Dokumente zur Zusammenfassung"
    return
  fi

  bot_log "Letzte Dokumente:\n$titles"

  # LLM-Zusammenfassung via Ollama
  local prompt="Fasse die folgenden Dokumententitel kurz zusammen und markiere welche als Rechnungen erkennbar sind:\n$titles"

  local summary
  summary=$(curl -sf "${OLLAMA_CURL_FLAGS[@]+"${OLLAMA_CURL_FLAGS[@]}"}" \
    "$OLLAMA_URL_CLEAN/api/generate" \
    -d "{\"model\":\"$OLLAMA_MODEL\",\"prompt\":\"$prompt\",\"stream\":false}" \
    2>/dev/null \
    | python3 -c "import sys,json; print(json.load(sys.stdin).get('response',''))" 2>/dev/null \
    || echo "(LLM nicht erreichbar)")

  bot_log "LLM-Zusammenfassung: $summary"
}

# ── B) Cloudflare-Tunnel-Verwaltung ──────────────────────────

# Tunnel-Gesundheit prüfen und bei Bedarf neu starten
manage_cloudflare_tunnel() {
  bot_log "Prüfe Cloudflare-Tunnel …"

  if healthcheck 2>/dev/null; then
    bot_log "Cloudflare-Tunnel: OK ✓"
    return 0
  fi

  bot_log "⚠️  Cloudflare-Tunnel nicht gesund — starte Neustart"
  local attempt=0
  while (( attempt < MAX_CF_RETRIES )); do
    (( attempt++ ))
    bot_log "Neustart-Versuch $attempt/$MAX_CF_RETRIES …"
    restart_tunnel 2>/dev/null || true
    sleep 10

    if healthcheck 2>/dev/null; then
      bot_log "Cloudflare-Tunnel nach Versuch $attempt wieder OK ✓"
      return 0
    fi
  done

  bot_log "❌ Cloudflare-Tunnel nach $MAX_CF_RETRIES Versuchen nicht wiederhergestellt!"
  bot_log "   Manuelle Prüfung erforderlich."
  return 1
}

# ── C) Hawk Eye PII-Scan ─────────────────────────────────────

# Neue Dokumente auf PII/Sensitivdaten scannen (DSGVO)
run_hawk_eye_scan() {
  bot_log "Starte Hawk Eye PII-Scan …"
  local scan_script="${PROJECT_DIR:-$HOME/aom-sys-scanner-rag}/scripts/hawk-eye-scan.sh"

  if [ ! -f "$scan_script" ]; then
    # Fallback: hawk_scanner direkt aufrufen
    if ! command -v hawk_scanner >/dev/null 2>&1; then
      bot_log "Hawk Eye nicht installiert, überspringe PII-Scan"
      return 0
    fi

    local project_dir="${PROJECT_DIR:-$HOME/aom-sys-scanner-rag}"
    local connection_file="$project_dir/hawk-eye-connection.yml"
    local fingerprint_file="$project_dir/hawk-eye-fingerprint.yml"

    if [ ! -f "$connection_file" ] || [ ! -f "$fingerprint_file" ]; then
      bot_log "Hawk Eye Config nicht gefunden, überspringe"
      return 0
    fi

    local results_dir="$project_dir/hawk-eye-results"
    mkdir -p "$results_dir"
    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)

    hawk_scanner fs \
      --connection "$connection_file" \
      --fingerprint "$fingerprint_file" \
      --stdout --quiet 2>/dev/null \
      | tee "$results_dir/scan_${timestamp}.json" \
      | bot_log_pipe "[HAWK]"
    return 0
  fi

  PROJECT_DIR="${PROJECT_DIR:-$HOME/aom-sys-scanner-rag}" \
    bash "$scan_script" 2>&1 | bot_log_pipe "[HAWK]"
  bot_log "Hawk Eye PII-Scan abgeschlossen"
}

# ── Health-Endpoint (einfacher HTTP-Server) ──────────────────
start_health_endpoint() {
  # Minimaler Health-Endpoint via bash + socat/ncat
  if command -v socat >/dev/null 2>&1; then
    bot_log "Health-Endpoint gestartet auf Port $BOT_HEALTH_PORT (socat)"
    while true; do
      echo -e "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n{\"status\":\"ok\",\"ts\":\"$(date -Iseconds)\"}" \
        | socat - TCP-LISTEN:"$BOT_HEALTH_PORT",reuseaddr 2>/dev/null || sleep 1
    done &
  elif command -v ncat >/dev/null 2>&1; then
    bot_log "Health-Endpoint gestartet auf Port $BOT_HEALTH_PORT (ncat)"
    while true; do
      echo -e "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n{\"status\":\"ok\",\"ts\":\"$(date -Iseconds)\"}" \
        | ncat -l -p "$BOT_HEALTH_PORT" 2>/dev/null || sleep 1
    done &
  else
    bot_log "Kein socat/ncat gefunden — Health-Endpoint nicht verfügbar"
  fi
}

# ── Hauptschleife ────────────────────────────────────────────
run_loop() {
  bot_log "═══ Buchhaltungsbot gestartet ═══"
  bot_log "Check-Intervall:       ${CHECK_INTERVAL}s"
  bot_log "CF-Check-Intervall:    ${CF_CHECK_INTERVAL}s"
  bot_log "Hawk-Eye-Intervall:    ${HAWK_EYE_INTERVAL}s"

  start_health_endpoint

  local last_doc_check=0
  local last_cf_check=0
  local last_hawk_check=0

  while true; do
    local now
    now=$(date +%s)

    # Cloudflare-Check (häufiger)
    if (( now - last_cf_check >= CF_CHECK_INTERVAL )); then
      manage_cloudflare_tunnel || true
      last_cf_check=$now
    fi

    # Buchhaltungs-Check
    if (( now - last_doc_check >= CHECK_INTERVAL )); then
      check_new_documents || true
      update_rag_index || true
      summarize_new_invoices || true
      last_doc_check=$now
    fi

    # Hawk Eye PII-Scan (seltener — ressourcenintensiv)
    if (( now - last_hawk_check >= HAWK_EYE_INTERVAL )); then
      run_hawk_eye_scan || true
      last_hawk_check=$now
    fi

    sleep 30
  done
}

# ── Start / Stop / Status ───────────────────────────────────
start_bot() {
  if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    bot_log "Bot läuft bereits (PID $(cat "$PID_FILE"))"
    return 0
  fi

  bot_log "Starte Buchhaltungsbot im Hintergrund …"
  nohup "$0" _loop >> "$LOG_FILE" 2>&1 &
  echo $! > "$PID_FILE"
  bot_log "Bot gestartet (PID $!)"
}

stop_bot() {
  if [ -f "$PID_FILE" ]; then
    local pid
    pid=$(cat "$PID_FILE")
    if kill -0 "$pid" 2>/dev/null; then
      bot_log "Stoppe Bot (PID $pid) …"
      kill "$pid" 2>/dev/null || true
      rm -f "$PID_FILE"
      bot_log "Bot gestoppt"
    else
      bot_log "Bot-Prozess nicht mehr aktiv"
      rm -f "$PID_FILE"
    fi
  else
    bot_log "Kein PID-File gefunden"
  fi
}

status_bot() {
  if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    bot_log "✅  Bot läuft (PID $(cat "$PID_FILE"))"
    status_tunnel 2>/dev/null || true
    return 0
  else
    bot_log "❌  Bot ist nicht aktiv"
    return 1
  fi
}

# ── CLI ──────────────────────────────────────────────────────
case "${1:-help}" in
  start)   start_bot ;;
  stop)    stop_bot ;;
  status)  status_bot ;;
  run)     run_loop ;;   # Vordergrund-Modus
  _loop)   run_loop ;;   # Interner Aufruf
  help|--help|-h)
    cat <<EOF
Nutzung: $(basename "$0") <command>

Befehle:
  start     Bot im Hintergrund starten
  stop      Bot stoppen
  status    Bot- und Tunnel-Status anzeigen
  run       Bot im Vordergrund ausführen (für Debugging)

Der Bot erledigt automatisch:
  📄 Neue Rechnungen/Dokumente in Paperless-ngx erkennen
  🔍 RAG-Index (ChromaDB) aktualisieren
  🤖 LLM-Zusammenfassungen neuer Rechnungen erstellen
  🔒 Cloudflare-Tunnel überwachen und bei Ausfall neu starten
  🦅 Hawk Eye PII-Scan auf neue Dokumente (DSGVO)

Umgebungsvariablen:
  CHECK_INTERVAL       Buchhaltungs-Check Intervall   (default: 300s)
  CF_CHECK_INTERVAL    Cloudflare-Check Intervall      (default: 60s)
  HAWK_EYE_INTERVAL    Hawk Eye Scan-Intervall         (default: 600s)
  MAX_CF_RETRIES       Max. Tunnel-Neustart-Versuche   (default: 3)
  PAPERLESS_URL        Paperless-ngx URL               (default: http://localhost:8000)
  PAPERLESS_TOKEN      Paperless API-Token
  OLLAMA_URL           Ollama URL                      (default: http://localhost:11434)
  OLLAMA_MODEL         LLM-Modell                      (default: llama3.2:3b)
  CHROMA_URL           ChromaDB URL                    (default: http://localhost:8100)
  BOT_HEALTH_PORT      Health-Endpoint Port            (default: 8077)
  LOG_FILE             Log-Datei                       (default: /var/log/aom-buchhaltungsbot.log)
  PID_FILE             PID-Datei                       (default: /tmp/aom-buchhaltungsbot.pid)
EOF
    ;;
  *) die "Unbekannter Befehl: $1 (→ help)" ;;
esac
