<div align="center">

# aom1941 — Arne

**Architekt · Self-Hoster · ML-Bastler**

*Lokale Souveränität. Kein Cloud-Zwang. DSGVO by default.*

</div>

---

## 🗂️ Domänen

Alle Repositories folgen dem **HRFR-v2 Taxonomie-Schema** (`aom-<domain>-<name>`).

| Prefix | Domain | Scope |
|:------:|--------|-------|
| 🏛️ `arc` | **Architektur** | HOAI-Tools, BIM-Utilities, Entwurfswerkzeuge, Bebauungsplan-Analyse |
| 🖥️ `sys` | **System / Infra** | Self-Hosted Stack, Docker, Sync-Pipelines, Sicherheitsarchitektur |
| 📷 `kre` | **Kreativ / ML** | PICAS Foto-Kuration, Punctum/Studium ML-Pipeline, Immich Enhancer |
| 🎬 `cup` | **ClipUp Media** | GbR-Werkzeuge, Videoproduktion-Dashboard *(steuerlich isoliert)* |
| 🏺 `pke` | **Pilzkeramik** | Web-Auftritt, Werkstattboard, Buchungssystem |
| 🔒 `prv` | **Privat** | Private Repos |

---

## 🚀 Aktive Projekte

### 🏛️ [`aom-arc-suite`](https://github.com/aom1941/aom-arc-suite) — Architektur-Suite
> HOAI 2021 §35 Honorarrechner · Bebauungsplan SP-App (GRZ/GFZ) · PostgreSQL Planindex

![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)

---

### 📷 [`aom-kre-picas`](https://github.com/aom1941/aom-kre-picas) — PICAS Foto-Kuration
> ML-Pipeline nach Barthes' Punctum/Studium · SwiftUI iPad-Annotator · PyTorch MobileNetV3

![Swift](https://img.shields.io/badge/Swift-FA7343?style=flat-square&logo=swift&logoColor=white)
![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?style=flat-square&logo=pytorch&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)

---

### 🖥️ [`aom-sys-infra-services`](https://github.com/aom1941/aom-sys-infra-services) — Infra Stack
> Traefik · Immich · Ollama · Paperless-ngx · Gitea · Zero-Trust via Tailscale

![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![Tailscale](https://img.shields.io/badge/Tailscale-242424?style=flat-square&logo=tailscale&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=flat-square&logo=cloudflare&logoColor=white)

---

### 🎬 [`aom-cup-bureaucracy`](https://github.com/aom1941/aom-cup-bureaucracy) — GbR Dashboard
> Verwaltungs-Dashboard für ClipUp Media GbR (Richter & Müller) · steuerlich isoliert

![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)

---

### 🏺 [`aom_serv`](https://github.com/aom1941/aom_serv) — Pilzkeramik Web-Auftritt
> Single-Page-Website für eine Töpferschule · morphender Hero-Blob · animierte SVG-Töpfer-Signaturen

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)

---

### 🏺 [`pke-keramikwerkstatt`](pke-keramikwerkstatt/) — Werkstattboard
> Kursverwaltung · Teilnehmer · Terminplanung · Docker Compose · Self-hosted

![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)

---

## 🖥️ Infrastruktur

```
CachyOS i9 Mini-PC  ──┐
Mac Mini M1 (MLX)   ──┤── Tailscale Zero-Trust ──── WD NAS (Restic Backups)
iPad (SwiftUI)      ──┘         │
                                └── Cloudflare Tunnel (HTTP/HTTPS only)

Docker Services
├── Reverse Proxy   Traefik
├── Fotos           Immich
├── KI-Inferenz     Ollama (lokal, kein Cloud-LLM)
├── Dokumente       Paperless-ngx · ChromaDB (RAG)
├── Versionierung   Gitea
├── Zeiterfassung   Kimai
├── BIM             BIMserver · FreeCAD
└── Sicherheit      Hawk Eye (PII) · Cloudflare Tunnel
```

---

## ⚙️ Workflows — Rechnungsscanner + Buchhaltungsbot

> **Sicherheitsgegner Nr. 1 = Alltag → automatisieren.**

Im Verzeichnis [`workflows/`](workflows/) liegen Skripte für den automatisierten
Rechnungsscanner mit RAG und den Buchhaltungsbot:

| Skript | Funktion |
|--------|----------|
| [`setup-scanner-rag.sh`](workflows/setup-scanner-rag.sh) | Scanner + RAG + Cloudflare-Tunnel in einem Lauf aufsetzen |
| [`buchhaltungsbot.sh`](workflows/buchhaltungsbot.sh) | Dauerlauf-Bot: Buchhaltung **und** Cloudflare-Tunnel-Management |
| [`cloudflare-tunnel-helper.sh`](workflows/cloudflare-tunnel-helper.sh) | Cloudflare-Tunnel Hilfsfunktionen |

Der Bot überwacht den Tunnel alle 60 s und startet ihn bei Ausfall automatisch neu.

→ [Vollständige Dokumentation in `workflows/README.md`](workflows/README.md)

---

## 💡 Systemphilosophie

| Prinzip | Bedeutung |
|---------|-----------|
| **Lokale Souveränität** | Kein Vendor Lock-in, kein Cloud-Zwang |
| **Privacy-First** | KI-Inferenz lokal (Ollama), keine Cloud-LLMs für Nutzdaten |
| **Zero-Trust** | Kein Port-Forwarding — Admin-Zugriff nur via Tailscale |
| **DSGVO by default** | Alle Daten on-premise oder Ende-zu-Ende verschlüsselt |
| **80/20-Konsistenz** | 80 % Konsistenz schlägt 100 % theoretische Perfektion |
| **Dokumentation as Code** | Struktur ist Bedeutung |

---

<sub>HRFR-v2 · <code>[TIME]_[DOM-PROJ]_[DETAIL]--[USER].[EXT]</code> · Stand: 2026</sub>
