# Beschluss — Architektur & Sequencing pke-keramikwerkstatt

**Stand:** 2026-07-19 · HRFR-v2 · PKE-Domain
**Status:** Beschlossen (Ergebnis der Architektur-Session vom 2026-07-19)
**Ersetzt:** offene Fragen aus `20260719_PKE-KWS_diskussionspapier-fable--AOM.md`

---

## 0 · Befunde aus dem Code, die diesen Beschluss tragen

1. **Kein Alembic.** Schema entsteht per `Base.metadata.create_all()` im Lifespan-Hook
   (`backend/app/main.py`). Es existiert kein Migrationswerkzeug — die eigentlich
   unumkehrbare Lücke, nicht die Integer-PKs.
2. **Backend direkt exponiert.** `docker-compose.yml` published Port `8000:8000` am
   Frontend-Nginx vorbei. Jede Auth-Lösung nur vor der UI schützt die API nicht.
3. **PII ist bereits live.** `Teilnehmer` hält Telefon, E-Mail, Notizen — ohne Auth,
   hinter Cloudflare Tunnel. Die rote Linie ist überschritten, nicht bevorstehend.

---

## 1 · Entscheidungen (Ja/Nein)

| Frage | Beschluss | Begründung (Kurzform) |
|---|---|---|
| **Auth-first** | **Ja — dünn, am Edge, sofort** | PII ist live (Befund 3). Tailscale-only für Admin, CF Access / Traefik forward-auth für Rest, ein geteiltes App-Login als zweite Schicht. **Kein** 4-Rollen-RBAC — das kommt erst, wenn es den zweiten Menschen gibt, der etwas *nicht* dürfen soll. Port 8000 aus Compose entfernen, alles durch den Proxy. |
| **pgvector in derselben Instanz** | **Ja** | Unbedenklich unter einer Regel: Embeddings sind abgeleitete Daten, jederzeit per Indexer neu erzeugbar, nie Source of Truth. App-Code joint **nie** auf Embedding-Tabellen. Separates Schema in derselben Instanz reicht. |
| **UUID-Migration** | **Nein** | Integer-PKs tragen eine Single-Instance-App dieser Größe 20 Jahre. Longevity hängt an Exportformaten und Migrationen, nicht am Schlüsseltyp. Regel: PKs nie nach außen exponieren — öffentliche Links bekommen eine eigene Token-Spalte. UUID-Spalte bei Bedarf additiv nachrüstbar. |
| **Traefik statt Nginx (Reverse Proxy)** | **Ja** | forward-auth-Middleware ist genau der Mechanismus für Edge-Auth; Traefik läuft in aom-sys ohnehin. Ein Proxy-Muster für den ganzen Park. Der Nginx im Frontend-Container bleibt (serviert nur Statik). |
| **Dokumentenmodul via RAG-Stack als zweiter Zug** | **Nein — These verworfen** | Siehe § 3. |
| **Celery/RQ/Arq** | **Nein, in keiner Phase** | Grenze von BackgroundTasks: Jobs, die Restarts überleben müssen oder Minuten dauern. Antwort darauf ist eine `jobs`-Tabelle + bewährter systemd-Loop, keine Queue-Infrastruktur. |

---

## 2 · Priorisierte Reihenfolge

1. **Sicherheits- und Fundament-Woche**
   - Edge-Auth: Tailscale + CF Access / forward-auth; API-Port 8000 schließen.
   - **Alembic einführen** (vor jedem weiteren Schema-Wachstum).
   - `pg_dump` in die Restic-Kette. Ein Restic-Backup des laufenden
     Postgres-*Volumes* ist kein verlässliches Backup — es braucht Dumps.
2. **Brennkalender** — Ofen, Brennvorgang, Beladung. Das einzige Modul, das kein
   Werkzeug von der Stange liefert; der Existenzgrund des Boards. Werkstück
   zunächst nur als Statusfeld an der Beladung, kein eigenes Produktionsboard.
3. **CRM als Ausbau von `Teilnehmer` → `Kontakt`** — siehe § 4, die am schwersten
   umkehrbare Entscheidung.
4. **Dokumente = Paperless-Verknüpfung** — Dokument-ID-Referenzen + Deep-Links,
   Rechnungsstatus als kleine Tabelle im Board. Dateien bleiben in Paperless.

---

## 3 · Verworfene These (Diskussionspapier § 3)

> *„Auth einziehen, dann Dokumentenmodul über den pgvector-RAG-Stack füllen."*

Auth-Teil bestätigt (dünn). Dokumenten-Teil verworfen, drei Bruchstellen:

- **„Es existiert schon" ist eine Falle.** `rag-indexer-pg.py` macht semantische
  Suche über Paperless-Dokumente für einen Bot. Das Modul aus `catalog.py` ist eine
  Belegablage mit Statusworkflow. Anderes Feature, das zufällig das Wort
  „Dokumente" teilt.
- **Paperless-ngx *ist* das Dokumentenmodul.** OCR, Tags, Korrespondenten,
  Volltextsuche, Aufbewahrung — läuft in aom-sys. Ein Board-Dokumentenmodul
  dupliziert Paperless. Richtiger Schnitt: eine Referenzspalte und ein Deep-Link.
- **RAG löst ein Problem, das eine Töpferschule nicht hat.** Semantische Suche über
  ein paar hundert Belege erledigt die Paperless-Volltextsuche. Embeddings sind
  Phase 3, wenn überhaupt.

---

## 4 · Die am schwersten umkehrbare Entscheidung: eine Kontakt-Entität

**Beschluss: Es gibt genau eine Personen-Entität.** `Teilnehmer` wird zu `Kontakt`
erweitert/umbenannt; Anmeldungen, Aufträge und Rechnungen hängen daran. **Keine**
zweite „Kund:in"-Tabelle neben `Teilnehmer` (auch wenn `catalog.py` das nahelegt).

Begründung: Dieselbe reale Person bucht einen Kurs *und* gibt Werkstücke in
Auftrag. Zwei Tabellen bedeuten Duplikate; Personen-Deduplizierung nach zwei
Jahren Betrieb ist die hässlichste denkbare Migration.

Nebeneffekt — **Löschkonzept wird einfach**, weil operative PII an genau einer
Entität hängt. Präzisierung: *nicht* alle PII wohnt in einer Tabelle — ein
revisionssicheres Rechnungsarchiv enthält notwendigerweise PII. Das Konzept
trennt daher zwei Datenklassen:

- **Rechnungsdaten (aufbewahrungspflichtig, §147 AO, 10 Jahre):** Jede Rechnung
  hält einen **unveränderlichen Empfänger-/Adress-Snapshot** (kopierte Felder
  zum Ausstellungszeitpunkt, kein Live-Join auf `Kontakt`). Dieser Snapshot wird
  innerhalb der Aufbewahrungsfrist **nicht anonymisiert und nicht verändert** —
  Rechtsgrundlage ist Art. 6 Abs. 1 lit. c DSGVO i. V. m. §147 AO; Art. 17
  greift hier nicht (Art. 17 Abs. 3 lit. b). Nach Fristablauf: Löschung/
  Anonymisierung des Archivs als eigener, jährlicher Schritt.
- **Kontakt- und operative Daten (nicht aufbewahrungspflichtig):** Hier greift
  Art. 17 als Anonymisierung — `anonymisiert_am` setzen, PII-Felder auf
  `Kontakt` überschreiben, Anmeldungs-/Auftragsgerüst für Statistik behalten.
- **Art. 15 (Auskunft):** ein Endpoint, der über die FKs eines Kontakts läuft
  **und** die Rechnungs-Snapshots derselben Person einschließt.
- Snapshot-Spalten und `anonymisiert_am` kommen **jetzt** ins Schema, nicht
  nachgerüstet.

---

## 5 · Streichliste `catalog.py`

| Modul/Element | Beschluss |
|---|---|
| **Dokumentenmodul** | Gestrichen als eigenständiges Modul → Paperless-Verknüpfung (§ 2.4). |
| **Inventar** | Gestrichen. Ton und Glasuren sind ein Regal und ein Blick. Warnschwellen/Lieferanten-Entitäten kosten mehr Datenpflege als der Engpass, den sie verhindern. Bei Bedarf: Freitext-Materialliste. |
| **Werkstattplanung** | Radikal vereinfacht. Kein Board aus Werkstück/Produktionsschritt/Aufgabe/Station — ein Werkstück mit Statusfeld (gedreht → getrocknet → geschrüht → glasiert → abholbereit), angehängt an Kontakt und Brennvorgang. |
| **Rollen** | 4 → 2: Admin und „alle anderen". Buchhaltung als Rolle für einen Betrieb, in dem dieselbe Person dreht und Rechnungen schreibt, ist Organigramm-Fiktion. |
| **Automationen** | Bleiben alle 4 — als In-Process-Events beim Statuswechsel, nicht als eigene Dienste. |

**Zielbild: drei Module, die es nirgends zu kaufen gibt — Buchungen, Brennkalender,
Kontakte.** Alles andere ist Integration, und Integration ist in aom-sys schon gebaut.

---

## 6 · Weitere Festlegungen

- **CUP-Isolation:** eigene Instanz + eigenes Volume + **eigenes Restic-Repo mit
  eigenem Key** reicht. Steuerliche Trennung ist eine Frage von Datenbeständen,
  Zugriff und Nachweisbarkeit, nicht von Blech. Die Trennung wird einmal sauber
  dokumentiert (welche Instanz, welches Repo, wer hat Zugriff).
- **Hawk Eye:** als Post-Consume-Hook in Paperless, nicht als blockierender
  Ingest-Gate. Job ist Klassifikation und Retention-Flagging, nicht Türsteher.
  Blockierender Scan erzeugt „Scanner down = keine Dokumente" und killt gelebte
  Konsistenz (80/20-Regel).
- **CRM-Reuse aus `aom-cup-bureaucracy`:** Nein, neu bauen. Eine Kontaktkarte ist
  eine Tabelle und vier Endpoints entlang der Muster aus `kurse.py`/`teilnehmer.py`.
  Fremdcode lesen und adaptieren kostet mehr als schreiben.
- **Artefakt-Heimat-Regel:** Dateien wohnen in Paperless, Fotos in Immich, das
  Board hält nur Referenzen. Nie Blobs in der Board-DB oder auf Board-Volumes.

---

## 7 · Benannte blinde Flecken

1. **Der Cloudflare Tunnel widerspricht der eigenen Doktrin.** „Alle Daten
   on-premise" — aber der Tunnel terminiert TLS bei Cloudflare: Teilnehmer-PII im
   Klartext durch einen US-Anbieter. Konsequenz: Board Tailscale-only; CF Tunnel
   nur für Dienste ohne PII. Externer Zugriff (Kursleitung) über CF Access +
   Device-Policy ist der vertretbare Kompromiss — dann aber als bewusste Ausnahme
   ins Verfahrensverzeichnis, nicht als Default.
2. **WhatsApp ist das eigentliche DSGVO-Loch.** Vorlagen schieben Teilnehmerdaten
   in Meta-Infrastruktur; das lokale Ollama-Dogma bleibt Symbolpolitik, solange die
   Kommunikation über WhatsApp läuft. Nicht abschalten — aber ehrlich einordnen
   und Einwilligung sauber erfassen.
3. **Absehbare Fehlermodi 2–3 Jahre:** erster Schemawechsel mit Produktionsdaten
   ohne Alembic (darum § 2.1); verwaiste systemd-Loops ohne Überwachung (ein
   Uptime-Kuma über alle :8077-Health-Endpoints); Artefakt-Wildwuchs zwischen
   Board, Paperless und Immich (darum die Heimat-Regel in § 6).
4. **Der unbequeme Ratschlag:** Die 20-Jahre-Frage ist nicht, welches Format
   überlebt — sondern wer das System betreibt, wenn keine Lust mehr da ist. Jedes
   Modul ist ein Wartungsgelübde auf zwei Jahrzehnte. Die Longevity-Randbedingung
   ist ein Argument für *weniger* Module, nicht für besser architekturierte viele.

---

<sub>HRFR-v2 · `20260719_PKE-KWS_beschluss-architektur--AOM.md` · PKE-Domain · Beschluss, ersetzt Diskussionsstand</sub>
