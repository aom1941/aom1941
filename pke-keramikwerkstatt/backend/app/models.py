from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    Time,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from .database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Kurs(Base):
    __tablename__ = "kurse"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    beschreibung = Column(Text, nullable=True)
    max_teilnehmer = Column(Integer, nullable=False, default=10)
    preis_eur = Column(Numeric(10, 2), nullable=True)
    status = Column(String(20), nullable=False, default="geplant")
    erstellt_am = Column(DateTime(timezone=True), nullable=False, default=_now)

    termine = relationship("KursTermin", back_populates="kurs", cascade="all, delete-orphan")
    anmeldungen = relationship("Anmeldung", back_populates="kurs", cascade="all, delete-orphan")


class KursTermin(Base):
    __tablename__ = "kurs_termine"

    id = Column(Integer, primary_key=True, index=True)
    kurs_id = Column(Integer, ForeignKey("kurse.id", ondelete="CASCADE"), nullable=False)
    datum = Column(Date, nullable=False)
    start_uhrzeit = Column(Time, nullable=True)
    end_uhrzeit = Column(Time, nullable=True)
    notizen = Column(Text, nullable=True)

    kurs = relationship("Kurs", back_populates="termine")


class Teilnehmer(Base):
    __tablename__ = "teilnehmer"

    id = Column(Integer, primary_key=True, index=True)
    vorname = Column(String(100), nullable=False)
    nachname = Column(String(100), nullable=False)
    telefon = Column(String(50), nullable=True)
    email = Column(String(200), nullable=True)
    notizen = Column(Text, nullable=True)
    erstellt_am = Column(DateTime(timezone=True), nullable=False, default=_now)

    anmeldungen = relationship("Anmeldung", back_populates="teilnehmer", cascade="all, delete-orphan")


class Anmeldung(Base):
    __tablename__ = "anmeldungen"
    __table_args__ = (
        UniqueConstraint("kurs_id", "teilnehmer_id", name="uq_anmeldung_kurs_teilnehmer"),
    )

    id = Column(Integer, primary_key=True, index=True)
    kurs_id = Column(Integer, ForeignKey("kurse.id", ondelete="CASCADE"), nullable=False)
    teilnehmer_id = Column(Integer, ForeignKey("teilnehmer.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(20), nullable=False, default="bestaetigt")
    angemeldet_am = Column(DateTime(timezone=True), nullable=False, default=_now)

    kurs = relationship("Kurs", back_populates="anmeldungen")
    teilnehmer = relationship("Teilnehmer", back_populates="anmeldungen")
