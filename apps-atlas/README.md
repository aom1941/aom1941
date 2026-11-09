# apps-atlas

Cursor App: Katalog der Workspace-Apps, Fähigkeiten, `apps-database`-Bedarf und
der kompakten Zielstruktur (`apps/ · services/ · agents/ · infra/ · hub/`).

Der Katalog ist die **lebende Matrix** hinter [`STRUCTURE.md`](../STRUCTURE.md).
Seed-Daten und Typen liegen in [`src/lib/catalog.ts`](src/lib/catalog.ts) — nicht
in der Markdown-Datei.

## Stack

- Next.js App Router (`next dev --turbopack`)
- Postgres via `cursor-app.json` (`DATABASE_URL` auf Publish)
- lokal: PGlite + `migrations/*.sql` (kein Docker)
- Identity: `cursor/identity.ts` (private/team)

## Architektur

```text
Browser  →  GET /api/catalog[?db=yes|maybe|no]
                │
                ├─ getIdentity(request)     # 401 wenn nicht verified
                ├─ ensureSeeded()           # nur wenn Tabelle apps leer
                └─ Postgres oder PGlite
                     apps + structure_layers
```

| Umgebung | Datenbank | Migration |
|----------|-----------|-----------|
| lokal, `DATABASE_URL` unset | In-Memory **PGlite** | alle `migrations/*.sql` beim ersten Query |
| Publish / `DATABASE_URL` gesetzt | Cursor-App-**Postgres** | `scripts/migrate.mjs` (advisory lock, `schema_migrations`) |

`build` führt danach `scripts/migrate.mjs` aus — ohne `DATABASE_URL` ein No-Op.

## Schema

Zwei Tabellen (`migrations/001_apps_catalog.sql`):

| Tabelle | Zweck | Constraints |
|---------|-------|-------------|
| `apps` | Ein App-/Service-/Agent-Eintrag | `layer` ∈ apps/services/agents/infra/hub; `db_need` ∈ yes/maybe/no |
| `structure_layers` | Die fünf Zielschichten | `id` = Layer-Name |

`db_need` folgt der Regel: **App-DB nur wenn Daten Sessions, Geräte oder User überdauern.**

## Öffentliche Schnittstelle

`GET /api/catalog` — einzige Route. `dynamic = "force-dynamic"`, Cache `private, no-store`.

| Query | Wirkung |
|-------|---------|
| *(ohne)* | alle Einträge, sortiert nach `layer, sort_order, name` |
| `?db=yes` / `maybe` / `no` | Filter auf `apps.db_need`; andere Werte werden ignoriert |

Antwort:

```json
{
  "stats": { "total": 21, "dbYes": 5, "dbMaybe": 3, "dbNo": 13, "viewer": "…" },
  "layers": [{ "id": "apps", "title": "apps/", "role": "…", "contents": "…", "sort_order": 10 }],
  "apps": [{ "id": "artisplan", "name": "ArtisPlan", "db_need": "maybe", "…": "…" }]
}
```

Keine mutierenden Routen. Falls später welche kommen: hinter `requireIdentity`.

## Lokal

```bash
cd apps-atlas
npm install
env -u DATABASE_URL npm run dev
```

Öffne [http://127.0.0.1:3000](http://127.0.0.1:3000). Der Dev-Server nutzt
einen simulierten Viewer (`cursor/identity.dev.ts`) und seeded den Katalog
beim ersten API-Call, **falls** `apps` leer ist.

```bash
env -u DATABASE_URL npm run build   # Next-Build + migrate no-op
npm run migrate                     # nur mit DATABASE_URL wirksam
```

## Katalog pflegen

1. Eintrag in `SEED_APPS` / `SEED_LAYERS` in `src/lib/catalog.ts` ergänzen.
2. `STRUCTURE.md` nur anfassen, wenn sich das Schicht-Mapping ändert.
3. **Bestehende Datenbanken werden nicht neu geseedet.** `ensureSeeded()` bricht
   ab, sobald `count(*) from apps > 0`. Für eine lokale Neu-Seed: Dev-Server
   neu starten (PGlite ist pro Prozess) oder die Postgres-Tabellen leeren.

## Constraints & Fallstricke

- `DATABASE_URL` in der lokalen Shell überschreibt PGlite — deshalb `env -u DATABASE_URL`.
- `DATABASE_URL` nie loggen oder committen. `cursor-app.json` deklariert nur `"database": "postgres"`.
- `cursor/identity.ts` nicht editieren (von Cursor generiert). Simulierten Viewer nur in `identity.dev.ts`.
- Seed und Markdown können divergieren: maßgeblich ist `catalog.ts` plus die DB.
- Filter-Statistiken (`dbYes` …) beziehen sich auf die **gefilterte** Ergebnismenge, nicht auf den Gesamtkatalog.
