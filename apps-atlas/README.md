# apps-atlas

Cursor App: Katalog der Workspace-Apps, Fähigkeiten, `apps-database`-Bedarf und
der kompakten Zielstruktur (`apps/ · services/ · agents/ · infra/ · hub/`).

## Stack

- Next.js App Router
- Postgres via `cursor-app.json` (`DATABASE_URL` auf Publish)
- lokal: PGlite + `migrations/*.sql`
- Identity: `cursor/identity.ts` (private/team)

## Lokal

```bash
cd apps-atlas
env -u DATABASE_URL npm run dev
```

Öffne [http://127.0.0.1:3000](http://127.0.0.1:3000). Der Dev-Server nutzt
einen simulierten Viewer und seeded den Katalog beim ersten API-Call.

## Build

```bash
env -u DATABASE_URL npm run build
```

`build` führt danach `scripts/migrate.mjs` aus (no-op ohne `DATABASE_URL`).

## Regeln

- App-DB nur wenn Daten Sessions/Geräte/User überdauern.
- Keine Secrets in Dateien; `DATABASE_URL` nie loggen/committen.
- Mutierende Routen (falls später) immer hinter `requireIdentity`.
