#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# cloudflare-tunnel-helper.sh
# Cloudflare-Tunnel Verwaltung für den CachyOS Self-Hosted Stack
#
# Nutzt cloudflared CLI um Tunnel zu erstellen, zu prüfen und
# bei Bedarf neu zu starten.  Wird sowohl vom Setup-Skript als
# auch vom Buchhaltungsbot aufgerufen.
#
# Voraussetzungen:
#   - cloudflared installiert (pacman -S cloudflared)
#   - gültiger Cloudflare-Token in $CF_TUNNEL_TOKEN oder
#     $CF_CREDENTIALS_FILE
#
# HRFR-v2 · sys-Domain · Stand 2025
# ──────────────────────────────────────────────────────────────
set -euo pipefail

# ── Konfiguration ────────────────────────────────────────────
CF_TUNNEL_NAME="${CF_TUNNEL_NAME:-aom-cachyos-tunnel}"
CF_CONFIG_DIR="${CF_CONFIG_DIR:-$HOME/.cloudflared}"
CF_CONFIG_FILE="${CF_CONFIG_DIR}/config.yml"
CF_CREDENTIALS_FILE="${CF_CREDENTIALS_FILE:-${CF_CONFIG_DIR}/${CF_TUNNEL_NAME}.json}"
CF_TUNNEL_TOKEN="${CF_TUNNEL_TOKEN:-}"
LOG_FILE="${LOG_FILE:-/var/log/aom-cf-tunnel.log}"

# ── Hilfsfunktionen ─────────────────────────────────────────
log() { printf '[%s] %s\n' "$(date -Iseconds)" "$*" | tee -a "$LOG_FILE" 2>/dev/null || printf '[%s] %s\n' "$(date -Iseconds)" "$*"; }
err() { log "FEHLER: $*" >&2; }
die() { err "$*"; exit 1; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "'$1' nicht gefunden. Bitte installieren: pacman -S $1"
}

# ── Cloudflared installieren (CachyOS / Arch) ───────────────
install_cloudflared() {
  if command -v cloudflared >/dev/null 2>&1; then
    log "cloudflared bereits installiert: $(cloudflared --version)"
    return 0
  fi
  log "Installiere cloudflared …"
  sudo pacman -S --noconfirm cloudflared \
    || die "cloudflared konnte nicht installiert werden"
  log "cloudflared installiert: $(cloudflared --version)"
}

# ── Tunnel erstellen ─────────────────────────────────────────
create_tunnel() {
  local name="${1:-$CF_TUNNEL_NAME}"
  require_cmd cloudflared
  mkdir -p "$CF_CONFIG_DIR"

  if cloudflared tunnel list 2>/dev/null | grep -q "$name"; then
    log "Tunnel '$name' existiert bereits"
    return 0
  fi

  log "Erstelle Tunnel '$name' …"
  cloudflared tunnel create "$name"
  log "Tunnel '$name' erstellt"
}

# ── Tunnel-Config generieren ─────────────────────────────────
# Erzeugt eine config.yml die lokale Services exponiert:
#   - Paperless-ngx  (Rechnungs-/Skizzenscanner)
#   - Ollama API     (RAG LLM-Backend)
#   - Buchhaltungsbot Health-Endpoint
generate_config() {
  local tunnel_id
  tunnel_id=$(cloudflared tunnel list 2>/dev/null \
    | grep "$CF_TUNNEL_NAME" | awk '{print $1}')
  [ -n "$tunnel_id" ] || die "Tunnel-ID für '$CF_TUNNEL_NAME' nicht gefunden"

  log "Generiere Config → $CF_CONFIG_FILE"
  cat > "$CF_CONFIG_FILE" <<YAML
# Automatisch generiert von cloudflare-tunnel-helper.sh
tunnel: ${tunnel_id}
credentials-file: ${CF_CREDENTIALS_FILE}

ingress:
  # Paperless-ngx — Rechnungs- und Skizzenscanner
  - hostname: paperless.${CF_DOMAIN:-example.com}
    service: http://localhost:8000

  # Ollama API — RAG LLM-Backend
  - hostname: ollama.${CF_DOMAIN:-example.com}
    service: http://localhost:11434

  # Buchhaltungsbot Health-Endpoint
  - hostname: bot.${CF_DOMAIN:-example.com}
    service: http://localhost:8077

  # Catch-All → 404
  - service: http_status:404
YAML
  log "Config geschrieben"
}

# ── Tunnel starten ───────────────────────────────────────────
start_tunnel() {
  require_cmd cloudflared
  [ -f "$CF_CONFIG_FILE" ] || die "Keine Config gefunden: $CF_CONFIG_FILE — erst generate_config ausführen"

  if is_tunnel_running; then
    log "Tunnel läuft bereits (PID $(pgrep -f 'cloudflared tunnel run' | head -1))"
    return 0
  fi

  log "Starte Tunnel '$CF_TUNNEL_NAME' …"
  nohup cloudflared tunnel --config "$CF_CONFIG_FILE" run "$CF_TUNNEL_NAME" \
    >> "$LOG_FILE" 2>&1 &
  local pid=$!
  log "Tunnel gestartet (PID $pid)"
}

# ── Tunnel-Token-Modus (vereinfachter Start) ─────────────────
start_tunnel_token() {
  [ -n "$CF_TUNNEL_TOKEN" ] || die "CF_TUNNEL_TOKEN ist nicht gesetzt"
  require_cmd cloudflared

  if is_tunnel_running; then
    log "Tunnel läuft bereits"
    return 0
  fi

  log "Starte Tunnel via Token …"
  nohup cloudflared tunnel run --token "$CF_TUNNEL_TOKEN" \
    >> "$LOG_FILE" 2>&1 &
  log "Tunnel gestartet (Token-Modus, PID $!)"
}

# ── Tunnel stoppen ───────────────────────────────────────────
stop_tunnel() {
  local pids
  pids=$(pgrep -f 'cloudflared tunnel run' 2>/dev/null || true)
  if [ -z "$pids" ]; then
    log "Kein laufender Tunnel gefunden"
    return 0
  fi
  log "Stoppe Tunnel (PIDs: $pids) …"
  echo "$pids" | xargs kill 2>/dev/null || true
  log "Tunnel gestoppt"
}

# ── Tunnel-Status prüfen ────────────────────────────────────
is_tunnel_running() {
  pgrep -f 'cloudflared tunnel run' >/dev/null 2>&1
}

status_tunnel() {
  if is_tunnel_running; then
    log "✅  Tunnel läuft (PID $(pgrep -f 'cloudflared tunnel run' | head -1))"
    return 0
  else
    log "❌  Tunnel ist NICHT aktiv"
    return 1
  fi
}

# ── Health-Check (für Bot-Nutzung) ──────────────────────────
healthcheck() {
  local ok=true

  # 1. Prozess läuft?
  if ! is_tunnel_running; then
    err "Tunnel-Prozess nicht aktiv"
    ok=false
  fi

  # 2. cloudflared Connector-Status
  if command -v cloudflared >/dev/null 2>&1; then
    if ! cloudflared tunnel info "$CF_TUNNEL_NAME" >/dev/null 2>&1; then
      err "Tunnel-Info nicht abrufbar"
      ok=false
    fi
  fi

  if $ok; then
    log "Health-Check OK"
    return 0
  else
    log "Health-Check FEHLGESCHLAGEN"
    return 1
  fi
}

# ── Tunnel neu starten (für Bot: automatischer Recovery) ────
restart_tunnel() {
  log "Neustart Tunnel …"
  stop_tunnel
  sleep 2
  if [ -n "$CF_TUNNEL_TOKEN" ]; then
    start_tunnel_token
  else
    start_tunnel
  fi
}

# ── DNS-Route setzen ─────────────────────────────────────────
add_dns_route() {
  local hostname="${1:?Hostname erforderlich}"
  require_cmd cloudflared
  log "Setze DNS-Route: $hostname → $CF_TUNNEL_NAME"
  cloudflared tunnel route dns "$CF_TUNNEL_NAME" "$hostname"
}

# ── CLI-Dispatcher ───────────────────────────────────────────
main() {
  local cmd="${1:-help}"
  shift || true

  case "$cmd" in
    install)         install_cloudflared ;;
    create)          create_tunnel "$@" ;;
    config)          generate_config ;;
    start)           start_tunnel ;;
    start-token)     start_tunnel_token ;;
    stop)            stop_tunnel ;;
    restart)         restart_tunnel ;;
    status)          status_tunnel ;;
    healthcheck)     healthcheck ;;
    dns)             add_dns_route "$@" ;;
    help|--help|-h)
      cat <<EOF
Nutzung: $(basename "$0") <command>

Befehle:
  install       cloudflared installieren (pacman)
  create        Tunnel erstellen
  config        config.yml generieren (Paperless, Ollama, Bot)
  start         Tunnel starten (config-basiert)
  start-token   Tunnel starten (Token-Modus)
  stop          Tunnel stoppen
  restart       Tunnel neu starten
  status        Tunnel-Status prüfen
  healthcheck   Erweiterter Health-Check (für Bot)
  dns <host>    DNS-Route hinzufügen

Umgebungsvariablen:
  CF_TUNNEL_NAME       Tunnel-Name       (default: aom-cachyos-tunnel)
  CF_TUNNEL_TOKEN      Tunnel-Token       (für Token-Modus)
  CF_DOMAIN            Domain             (default: example.com)
  CF_CONFIG_DIR        Config-Verzeichnis (default: ~/.cloudflared)
  CF_CREDENTIALS_FILE  Credentials-Datei
  LOG_FILE             Log-Datei          (default: /var/log/aom-cf-tunnel.log)
EOF
      ;;
    *) die "Unbekannter Befehl: $cmd (→ help)" ;;
  esac
}

# Nur ausführen wenn direkt aufgerufen (nicht gesourced)
if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  main "$@"
fi
