# 🏺 pke-keramikwerkstatt — Werkstattboard

> Self-hosted Werkstattboard für **Pilzkeramik**: Kurse, Termine, Teilnehmer,
> Anmeldungen mit Warteliste, WhatsApp-Vorlagen und die sGraffito-Vorlage als
> Atelier-Werkzeug.

**Stand:** Der Code liegt seit dem 18.11.2026 im privaten Repository
`pilzkeramik/pke-keramikwerkstatt` und wird nur dort weiterentwickelt. Die
Kopie, die hier bis dahin lag, war seit Mai 2026 vom eigentlichen Stand
abgewichen und ist entfernt. Sie bleibt in der Git-Historie dieses Repos
nachlesbar.

Der Architektur-Beschluss vom 19.07.2026 liegt ebenfalls nur noch im privaten
Repository (`docs/`).

## Was es kann

- Kursliste als Tagesübersicht: nächster Termin, Belegung, ausgebuchte Kurse,
  Warteliste
- Anmeldungen mit Kapazitätsprüfung: Ein voller Kurs nimmt nur noch
  Wartelisten-Einträge an, auch bei gleichzeitigen Anfragen
- Status ändern, Anmeldungen entfernen, bekannte Personen wiedererkennen
- WhatsApp-Kopiervorlagen für Buchungsbestätigung und Erinnerung
- [sGraffito-Vorlage](../pke-sgraffito/): Foto → Geometrie → Fliesen-Druckvorlage
- Öffentlicher Atelier-Onepager, Board und API hinter Zugangsschutz

## Technik

React + TypeScript (Vite) · Nginx · FastAPI · SQLAlchemy 2 · Alembic ·
PostgreSQL 16 · Docker Compose · pytest-Suite gegen SQLite und PostgreSQL in der CI
