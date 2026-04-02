# Arne Oskar Müller — aom1941

**Architekt · Keramiker · Systems Builder**  
Nürnberg · TU Wien / TH Nürnberg · Stadt Nürnberg

---

## Arbeitsdomänen

Alle Repositories folgen dem **HRFR-v2 Taxonomie-Schema** (`aom-<domain>-<name>`).  
Jede Domain ist konzeptuell und steuerlich abgegrenzt.

| Prefix | Domain | Scope |
|--------|--------|-------|
| `arc` | Architektur | HOAI-Tools, BIM-Utilities, Entwurfswerkzeuge, Bebauungsplan-Analyse |
| `sys` | System / Infra | Self-Hosted Stack, Docker, Sync-Pipelines, Sicherheitsarchitektur |
| `kre` | Kreativ / ML | PICAS Foto-Kuration, Punctum/Studium ML-Pipeline, Bildarchiv |
| `cup` | ClipUp Media | GbR-Werkzeuge, Videoproduktion-Dashboard (steuerlich isoliert) |
| `pke` | Pilzkeramik | Web-Auftritt, Design-System, Buchungssystem |
| `prv` | Privat | Private Repos |

---

## Aktive Projekte

### [`aom-arc-suite`](https://github.com/aom1941/aom-arc-suite) — Architektur-Suite
> HOAI 2021 §35 Honorarrechner · Bebauungsplan SP-App (GRZ/GFZ) · PostgreSQL Planindex  
> `Python` `React` `PostgreSQL` `HTML`

### [`aom-kre-picas`](https://github.com/aom1941/aom-kre-picas) — PICAS
> Photo-Kuration ML-Pipeline. Barthes' Punctum/Studium als Trainings-Framework.  
> SwiftUI iPad-Annotator + PyTorch MobileNetV3 + FastAPI Backend.  
> `Swift` `PyTorch` `FastAPI` `CLIP`

### [`aom-sys-infra-services`](https://github.com/aom1941/aom-sys-infra-services) — Infra Stack
> Self-Hosted Infrastruktur: Traefik · Immich · Ollama · Paperless-ngx · Gitea  
> Zero-Trust via Tailscale. DSGVO-konform, kein Vendor Lock-in.  
> `Docker` `Traefik` `CachyOS` `Tailscale`

### [`aom-cup-bureaucracy`](https://github.com/aom1941/aom-cup-bureaucracy) — GbR Dashboard
> Verwaltungs-Dashboard für ClipUp Media GbR (Richter & Müller).  
> Steuerlich isoliert von allen anderen Domains.  
> `React` `Node.js`

---

## Systemphilosophie

```
Lokale Souveränität   — kein Vendor Lock-in, kein Cloud-Zwang
DSGVO-Konformität     — alle Daten on-premise oder Ende-zu-Ende verschlüsselt
80/20-Konsistenz      — "80% Konsistenz schlägt 100% theoretische Perfektion"
Domain-Trennung       — fünf Arbeitsbereiche, klare steuerliche + konzeptuelle Grenzen
Dokumentation as Code — Struktur ist Bedeutung
```

---

## Infrastruktur-Stack

```
CachyOS i9 Mini-PC  ──┐
Mac Mini M1         ──┤── Tailscale Zero-Trust ── WD NAS (Restic Backups)
iPad (SwiftUI)      ──┘

Docker Services: Traefik · Immich · Ollama (MLX) · Gitea · Kimai
                 Paperless-ngx · BIMserver · FreeCAD · PostgreSQL
```

---

<sub>HRFR-v2 · `[TIME]_[DOM-PROJ]_[DETAIL]--[USER].[EXT]` · Stand: 2025</sub>
