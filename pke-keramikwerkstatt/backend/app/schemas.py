from datetime import date, datetime, time
from typing import Optional

from pydantic import BaseModel, ConfigDict


# ── Blueprint schemas (existing) ──────────────────────────────────────────────

class Metric(BaseModel):
    label: str
    value: str
    note: str


class RoleCard(BaseModel):
    name: str
    focus: str
    permissions: list[str]


class PageCard(BaseModel):
    name: str
    purpose: str
    primary_actions: list[str]


class ModuleCard(BaseModel):
    slug: str
    title: str
    summary: str
    highlights: list[str]
    entities: list[str]


class AutomationCard(BaseModel):
    name: str
    trigger: str
    outcome: str


class PhaseCard(BaseModel):
    title: str
    goal: str
    deliverables: list[str]


class StackLayer(BaseModel):
    layer: str
    choice: str
    reason: str


class Blueprint(BaseModel):
    name: str
    promise: str
    scope: list[str]
    metrics: list[Metric]
    roles: list[RoleCard]
    pages: list[PageCard]
    modules: list[ModuleCard]
    automations: list[AutomationCard]
    phases: list[PhaseCard]
    stack: list[StackLayer]


# ── Kurs ──────────────────────────────────────────────────────────────────────

class KursCreate(BaseModel):
    name: str
    beschreibung: Optional[str] = None
    max_teilnehmer: int = 10
    preis_eur: Optional[float] = None
    status: str = "geplant"


class KursUpdate(BaseModel):
    name: Optional[str] = None
    beschreibung: Optional[str] = None
    max_teilnehmer: Optional[int] = None
    preis_eur: Optional[float] = None
    status: Optional[str] = None


class KursResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    beschreibung: Optional[str]
    max_teilnehmer: int
    preis_eur: Optional[float]
    status: str
    erstellt_am: datetime


# ── KursTermin ────────────────────────────────────────────────────────────────

class KursTerminCreate(BaseModel):
    datum: date
    start_uhrzeit: Optional[time] = None
    end_uhrzeit: Optional[time] = None
    notizen: Optional[str] = None


class KursTerminResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    kurs_id: int
    datum: date
    start_uhrzeit: Optional[time]
    end_uhrzeit: Optional[time]
    notizen: Optional[str]


# ── Teilnehmer ────────────────────────────────────────────────────────────────

class TeilnehmerCreate(BaseModel):
    vorname: str
    nachname: str
    telefon: Optional[str] = None
    email: Optional[str] = None
    notizen: Optional[str] = None


class TeilnehmerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    vorname: str
    nachname: str
    telefon: Optional[str]
    email: Optional[str]
    notizen: Optional[str]
    erstellt_am: datetime


# ── Anmeldung ─────────────────────────────────────────────────────────────────

class AnmeldungCreate(BaseModel):
    teilnehmer_id: int
    status: str = "bestaetigt"


class AnmeldungWithTeilnehmer(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    kurs_id: int
    teilnehmer_id: int
    status: str
    angemeldet_am: datetime
    teilnehmer: TeilnehmerResponse


# ── KursDetail (full) ─────────────────────────────────────────────────────────

class KursDetail(KursResponse):
    termine: list[KursTerminResponse] = []
    anmeldungen: list[AnmeldungWithTeilnehmer] = []


# ── Teilnehmer list item (with course count) ──────────────────────────────────

class TeilnehmerListItem(BaseModel):
    id: int
    vorname: str
    nachname: str
    telefon: Optional[str]
    email: Optional[str]
    erstellt_am: datetime
    anmeldungen_count: int


# ── Teilnehmer detail (with Kurs history) ─────────────────────────────────────

class AnmeldungWithKurs(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    kurs_id: int
    status: str
    angemeldet_am: datetime
    kurs: KursResponse


class TeilnehmerWithKurse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    vorname: str
    nachname: str
    telefon: Optional[str]
    email: Optional[str]
    notizen: Optional[str]
    erstellt_am: datetime
    anmeldungen: list[AnmeldungWithKurs] = []


# ── Dashboard ─────────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    kurse_gesamt: int
    kurse_aktiv: int
    teilnehmer_gesamt: int
    anmeldungen_gesamt: int


class NaechsterTermin(BaseModel):
    termin_id: int
    datum: date
    start_uhrzeit: Optional[time]
    kurs_id: int
    kurs_name: str
    kurs_status: str
    anmeldungen: int
    max_teilnehmer: int


class DashboardResponse(BaseModel):
    stats: DashboardStats
    naechste_termine: list[NaechsterTermin]
