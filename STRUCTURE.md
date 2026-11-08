# Kompakte Repo-Struktur (Zielbild)

Ziel: aus 13 verstreuten Repos fünf klare Schichten — und Cursor-App-Postgres
nur dort, wo `apps-database` es verlangt.

```text
aom-platform/
  apps/          # publishable UIs
  services/      # APIs & Engines
  agents/        # MCP / CLI (nicht als Cursor App published)
  infra/         # Host-IaC
  hub/           # Taxonomie + Katalog (apps-atlas)
```

## Schicht-Mapping (heute → Ziel)

| Ziel | Heute (Repos / Pfade) |
|------|-------------------------|
| `apps/companion-os` | `project-companion----visual-computer/project-companion-os` |
| `apps/ink-os` | `project-companion----visual-computer` (Root React) |
| `apps/artisplan` | `ArtisPlan` |
| `apps/pke-werkstatt` | `aom1941/pke-keramikwerkstatt` |
| `apps/pke-sgraffito` | `aom1941/pke-sgraffito` |
| `apps/elster-ready` | `…/elster-ready-accounting` |
| `apps/orchestrator-studio` | `aom-orchestrator-studio` |
| `apps/ops/*` | `chillops-dashboard`, `account-operator`, `aom-sys-wd-control`, `picas-fingerprint-explorer` |
| `services/steuer-cockpit` | `…/steuer-cockpit` |
| `services/beleg-buchhaltung` | `…/beleg-buchhaltung` |
| `services/rag` | `…/rag-companion` |
| `services/werkstatt` | `…/werkstatt_sdk`, `…/werkstatt_mcp` |
| `agents/infra-mcp` | `aom-infra-mcp-server` |
| `agents/strato` | `strato-companion` |
| `agents/orchestrator` | `antigravity-orchestrator` |
| `infra/` | `aom-sys-infra-services` |
| `hub/` | `aom1941` (+ `apps-atlas`) |

## apps-database Regeln

| DB | Apps |
|----|------|
| **yes** | pke-werkstatt, Steuer-Cockpit / Belege, Companion Ideen-Pool, apps-atlas |
| **maybe** | ArtisPlan (ohne Nextcloud), Elster Ready (ohne Cockpit), Orchestrator Studio (Run-History) |
| **no** | Ink OS, Picas, ChillOps, Account Operator, WD Control, sGraffito, alle Agents/Infra |

Leere Scaffolds (`Aom_1`, `aom-sys-security`) und der Docker-`docs`-Fork gehören **nicht** in die Produktstruktur.

## Umsetzungspfad (ohne Big-Bang)

1. Katalog leben lassen: `aom1941/apps-atlas` (dieses Repo) mit Postgres.
2. Neue Arbeit nur noch in der Zielschicht starten (Ordner-Konvention).
3. Bestehende Repos schrittweise verschieben/zusammenlegen, wenn ein Feature sowieso angefasst wird.
4. Cursor-publish nur für `apps/*` und `hub/apps-atlas`; Agents bleiben MCP/CLI.

Live-Katalog: siehe [`apps-atlas/`](apps-atlas/).
