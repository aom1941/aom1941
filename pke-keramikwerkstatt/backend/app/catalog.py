from .schemas import (
    AutomationCard,
    Blueprint,
    Metric,
    ModuleCard,
    PageCard,
    PhaseCard,
    RoleCard,
    StackLayer,
)


BLUEPRINT = Blueprint(
    name="Pilzkeramik Werkstattboard",
    promise="Self-hosted Organisations-Webapp für Werkstattabläufe, Buchungen, Brennplanung und Dokumente.",
    scope=[
        "Kund:innenverwaltung",
        "Auftrags- und Werkstückverwaltung",
        "Brenn- und Produktionsplanung",
        "Kurs- und Workshop-Buchungen",
        "Rechnungs- und Dokumentenablage",
    ],
    metrics=[
        Metric(
            label="MVP-Module",
            value="5",
            note="CRM, Werkstatt, Brennkalender, Buchungen, Dokumente",
        ),
        Metric(
            label="Rollen",
            value="4",
            note="Admin, Werkstatt, Kursleitung, Buchhaltung",
        ),
        Metric(
            label="Betrieb",
            value="Self-hosted",
            note="Docker, PostgreSQL, lokales Storage, DSGVO-freundlich",
        ),
    ],
    roles=[
        RoleCard(
            name="Admin",
            focus="Mandanten-, Rollen- und Systemkonfiguration",
            permissions=["Benutzer verwalten", "Module freischalten", "Backups prüfen"],
        ),
        RoleCard(
            name="Werkstatt",
            focus="Produktionsfluss vom Drehen bis zur Abholung",
            permissions=["Werkstücke pflegen", "Brennstatus ändern", "Materialverbrauch erfassen"],
        ),
        RoleCard(
            name="Kursleitung",
            focus="Kursplanung und Teilnehmerverwaltung",
            permissions=["Termine pflegen", "Wartelisten steuern", "Teilnahmen bestätigen"],
        ),
        RoleCard(
            name="Buchhaltung",
            focus="Rechnungen, Angebote und Belegablage",
            permissions=["Dokumente ablegen", "Rechnungsstatus setzen", "Export vorbereiten"],
        ),
    ],
    pages=[
        PageCard(
            name="Dashboard",
            purpose="Tages- und Wochenüberblick für Werkstattbetrieb",
            primary_actions=["Offene Brennvorgänge prüfen", "Abholungen sehen", "Kurse im Blick behalten"],
        ),
        PageCard(
            name="Kund:innen & Aufträge",
            purpose="CRM, Ansprechpartner und Auftragsstatus",
            primary_actions=["Kontakt anlegen", "Auftrag starten", "Werkstücke zuordnen"],
        ),
        PageCard(
            name="Brennkalender",
            purpose="Ofenkapazität, Temperaturen und Brennstatus steuern",
            primary_actions=["Ofenlauf planen", "Beladung prüfen", "Status aktualisieren"],
        ),
        PageCard(
            name="Kurse & Buchungen",
            purpose="Termine, Buchungen und Wartelisten verwalten",
            primary_actions=["Kurs anlegen", "Teilnehmer bestätigen", "Freie Plätze prüfen"],
        ),
        PageCard(
            name="Dokumente",
            purpose="Rechnungen, Angebote, Lieferscheine und Anhänge bündeln",
            primary_actions=["Beleg hochladen", "Rechnung markieren", "OCR später anbinden"],
        ),
    ],
    modules=[
        ModuleCard(
            slug="crm",
            title="CRM",
            summary="Kund:innen, Ansprechpartner, Notizen und Statushistorien an einem Ort.",
            highlights=["Kontaktkarte", "Auftragshistorie", "Interne Notizen"],
            entities=["Kund:in", "Ansprechpartner", "Auftrag", "Statushistorie"],
        ),
        ModuleCard(
            slug="werkstatt",
            title="Werkstattplanung",
            summary="Produktionsschritte von Drehen über Trocknen bis Glasieren und Abholung.",
            highlights=["Werkstückboard", "Produktionsstatus", "Aufgaben je Station"],
            entities=["Werkstück", "Produktionsschritt", "Aufgabe", "Abholung"],
        ),
        ModuleCard(
            slug="brennkalender",
            title="Brennkalender",
            summary="Brennpläne mit Kapazität, Temperaturprofil und Verantwortlichkeit.",
            highlights=["Ofenbelegung", "Kapazität", "Schrüh-/Glasurbrand-Status"],
            entities=["Ofen", "Brennvorgang", "Beladung", "Temperaturprofil"],
        ),
        ModuleCard(
            slug="buchungen",
            title="Buchungssystem",
            summary="Kurse, offene Werkstatt und Einzeltermine mit Wartelistenlogik.",
            highlights=["Kursübersicht", "Freie Plätze", "Teilnahmebestätigung"],
            entities=["Kurs", "Buchung", "Teilnahme", "Wartelisteneintrag"],
        ),
        ModuleCard(
            slug="dokumente",
            title="Dokumentenmodul",
            summary="Rechnungen, Angebote, Lieferscheine und Anhänge sauber ablegen.",
            highlights=["Belegliste", "Statusfilter", "Dateiverknüpfung"],
            entities=["Rechnung", "Dokument", "Datei", "Angebot"],
        ),
        ModuleCard(
            slug="inventar",
            title="Inventar",
            summary="Ton, Glasuren, Werkzeuge und Mindestbestände als nächste Ausbaustufe.",
            highlights=["Bestände", "Warnschwellen", "Verbrauchsnotizen"],
            entities=["Material", "Bestand", "Werkzeug", "Lieferant"],
        ),
    ],
    automations=[
        AutomationCard(
            name="Abholerinnerung",
            trigger="Werkstück wird als abholbereit markiert",
            outcome="Kontaktliste für Erinnerung wird erzeugt",
        ),
        AutomationCard(
            name="Brennstatus-Update",
            trigger="Brennvorgang wechselt die Phase",
            outcome="Betroffene Werkstücke und Aufträge erhalten den neuen Status",
        ),
        AutomationCard(
            name="Materialwarnung",
            trigger="Bestand fällt unter Mindestmenge",
            outcome="Warnhinweis im Dashboard und für Einkaufsliste",
        ),
        AutomationCard(
            name="Buchungsbestätigung",
            trigger="Teilnahme wird bestätigt",
            outcome="Termin erscheint in Kursübersicht und Warteliste wird nachgezogen",
        ),
    ],
    phases=[
        PhaseCard(
            title="Phase 1 — MVP",
            goal="Kernprozesse der Werkstatt sichtbar und planbar machen",
            deliverables=[
                "CRM-Grundlage",
                "Werkstück- und Auftragsboard",
                "Brennkalender",
                "Kursbuchungen",
                "Dokumentenablage",
            ],
        ),
        PhaseCard(
            title="Phase 2 — Betriebstiefe",
            goal="Inventar, Medienarchiv und Tagessteuerung ergänzen",
            deliverables=[
                "Lagerlogik",
                "Bild-/Objektarchiv",
                "Tagesdashboard",
            ],
        ),
        PhaseCard(
            title="Phase 3 — Automationen",
            goal="Dokumente, Benachrichtigungen und Auswertungen ausbauen",
            deliverables=[
                "OCR/RAG-Anbindung",
                "Nachrichtenkanäle",
                "Auswertungen zu Umsatz und Auslastung",
            ],
        ),
    ],
    stack=[
        StackLayer(
            layer="Frontend",
            choice="React + Vite",
            reason="Schneller MVP-Start, klare Komponentenstruktur, leicht self-hostbar.",
        ),
        StackLayer(
            layer="Backend",
            choice="FastAPI",
            reason="Klare API-Struktur, gute Typisierung und schnell erweiterbar.",
        ),
        StackLayer(
            layer="Datenbank",
            choice="PostgreSQL",
            reason="Robust für relationale Werkstatt-, Buchungs- und Dokumentendaten.",
        ),
        StackLayer(
            layer="Storage",
            choice="S3-kompatibel oder NAS",
            reason="Geeignet für Rechnungen, Fotos und Anhänge ohne SaaS-Zwang.",
        ),
        StackLayer(
            layer="Betrieb",
            choice="Docker Compose",
            reason="Einfacher self-hosted Einstieg mit sauberer Trennung der Dienste.",
        ),
    ],
)
