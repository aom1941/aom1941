# gemini-derArnecloud — Tech-Stack Kompendium

> Komprimierte Referenz aller Technologien, Services und Werkzeuge im aom1941-Ökosystem.  
> Stand: 2025 · HRFR-v2 · `[TIME]_[DOM-PROJ]_[DETAIL]--[USER].[EXT]`

---

## Hardware-Topologie

```
CachyOS i9 Mini-PC  ──┐
Mac Mini M1          ──┤── Tailscale Zero-Trust ── WD NAS (Restic)
iPad (SwiftUI)       ──┘
```

| Gerät | OS / Rolle | Netz |
|-------|-----------|------|
| i9 Mini-PC | CachyOS (Arch) · Docker-Host, Hauptserver | Tailscale |
| Mac Mini M1 | macOS · Ollama MLX, Dev-Maschine | Tailscale |
| iPad | iPadOS · SwiftUI Annotator (PICAS) | Tailscale |
| WD NAS | Backup-Target · Restic verschlüsselt | Tailscale |

---

## Docker-Services (Self-Hosted)

| Service | Funktion | Stack |
|---------|----------|-------|
| **Traefik** | Reverse-Proxy, TLS-Termination, Routing | Go |
| **Immich** | Foto/Video-Verwaltung (Google-Photos-Ersatz) | Node.js, ML |
| **Ollama** | LLM-Inferenz lokal (MLX auf M1) | Go, Python |
| **Gitea** | Git-Forge (Self-Hosted GitHub-Alternative) | Go |
| **Kimai** | Zeiterfassung | PHP, Symfony |
| **Paperless-ngx** | Dokumenten-Management, OCR | Python, Django |
| **BIMserver** | BIM-Modellserver (IFC) | Java |
| **FreeCAD** | Parametrisches CAD | Python, C++ |
| **PostgreSQL** | Relationale DB (Planindex, Arc-Suite) | C |
| **Nextcloud** | File-Sync, Kalender, Kontakte (derArneCloud) | PHP |

**Netzwerk-Prinzip:** Zero-Trust via Tailscale · DSGVO-konform · kein Vendor Lock-in

---

## Domänen (HRFR-v2 Taxonomie)

| Prefix | Domain | Repo-Beispiel | Kern-Technologien |
|--------|--------|---------------|-------------------|
| `arc` | Architektur | `aom-arc-suite` | Python · React · PostgreSQL · HTML |
| `sys` | System/Infra | `aom-sys-derarnecloud` | Docker · Traefik · CachyOS · Tailscale · Deno |
| `kre` | Kreativ/ML | `aom-kre-picas` | Swift · PyTorch · FastAPI · CLIP · MobileNetV3 |
| `cup` | ClipUp Media | `aom-cup-bureaucracy` | React · Node.js |
| `pke` | Pilzkeramik | `aom-pke-workshop` | Web (Werkstatt-Management) |
| `prv` | Privat | — | — |

---

## Sprachen & Runtimes

| Sprache | Einsatz |
|---------|---------|
| **TypeScript/Deno** | derArneCloud Tooling, Content-Media-Sortierung |
| **Python** | Arc-Suite (HOAI), Paperless, PICAS ML-Pipeline, FastAPI |
| **Swift/SwiftUI** | PICAS iPad-Annotator |
| **React/Node.js** | Arc-Suite Frontend, Cup-Bureaucracy Dashboard |
| **Go** | Traefik, Gitea, Ollama |
| **Rust** | DevContainer-Feature (verfügbar) |
| **Java** | BIMserver |
| **PHP** | Kimai, Nextcloud |
| **SQL/PostgreSQL** | Planindex, Arc-Suite Datenbank |
| **HTML/CSS** | Frontends, Bebauungsplan-App |

---

## ML / KI-Stack

```
PICAS Pipeline:
  Annotator (SwiftUI iPad) → FastAPI Backend → PyTorch MobileNetV3
  Trainings-Framework: Barthes' Punctum/Studium
  Embedding: CLIP

LLM lokal:
  Ollama (MLX auf Mac Mini M1)
```

---

## DevContainer (derArneCloud)

**Basis:** `mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm`

Kern-Features (Auswahl aus ~300 installierten):

| Kategorie | Tools |
|-----------|-------|
| Sprachen | Node, Python, Rust, Ruby, PHP, Java, Go, Kotlin, Scala, Zig, Swift |
| Container/K8s | kubectl, Helm, Minikube, Kind, k3d, k9s, Skaffold, Docker-in-Docker |
| IaC | Terraform, Pulumi, Bicep, Nix |
| Cloud CLI | Google Cloud CLI, AWS SAM, Azure Functions, Flyctl |
| Data/ML | NVIDIA CUDA, DVC, DuckDB, Miniforge, Micromamba |
| Docs | Hugo, Quarto, Pandoc, mdBook, AsciiDoc |
| Security | Trivy, tfsec, Gitleaks, Cosign, Grype, Syft, Semgrep |
| R-Ecosystem | R, RStudio Server, renv, R-Packages |
| Shells | Fish, Nushell, Zsh-Plugins, PowerShell |
| Editor | Vim, Ripgrep, fzf, Starship |
| Testing | Bats, k6, Pact-Go |

**VSCode-Extensions:** .NET Runtime · Prettier SQL · Dart Getters/Setters

---

## Projekt-Steckbriefe

### aom-arc-suite — Architektur-Werkzeuge
- HOAI 2021 §35 Honorarrechner
- Bebauungsplan SP-App (GRZ/GFZ-Berechnung)
- PostgreSQL Planindex
- `Python` `React` `PostgreSQL` `HTML`

### aom-kre-picas — Foto-Kuration ML
- Barthes' Punctum/Studium als ML-Trainings-Framework
- SwiftUI iPad-Annotator + PyTorch MobileNetV3 + FastAPI
- `Swift` `PyTorch` `FastAPI` `CLIP`

### aom-sys-derarnecloud — Self-Hosted Cloud
- Nextcloud + Docker + Deno-Tooling
- Content-Media-Sortierung (TypeScript/Deno)
- `Deno` `TypeScript` `Docker` `Nextcloud`

### aom-cup-bureaucracy — GbR Dashboard
- Verwaltung ClipUp Media GbR (Richter & Müller)
- Steuerlich isoliert
- `React` `Node.js`

### aom-pke-workshop — Pilzkeramik
- Werkstatt-Management
- Web-Auftritt, Design-System, Buchungssystem

---

## Systemphilosophie

| Prinzip | Beschreibung |
|---------|-------------|
| **Lokale Souveränität** | Kein Vendor Lock-in, kein Cloud-Zwang |
| **DSGVO-Konformität** | Alle Daten on-premise oder E2E-verschlüsselt |
| **80/20-Konsistenz** | 80 % Konsistenz schlägt 100 % theoretische Perfektion |
| **Domain-Trennung** | Fünf Arbeitsbereiche, klare steuerliche + konzeptuelle Grenzen |
| **Dokumentation as Code** | Struktur ist Bedeutung |

---

## Backup & Sicherheit

```
Restic → WD NAS (verschlüsselt, dedupliziert)
Tailscale Zero-Trust Mesh (kein offener Port)
Dependabot (devcontainers, wöchentlich)
```

---

<sub>gemini-derArnecloud.md · aom1941 · komprimiert aus README.md + aom-sys-derarnecloud + Projektlandschaft · 2025</sub>
