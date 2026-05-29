from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Anmeldung, Kurs, KursTermin, Teilnehmer
from ..schemas import DashboardResponse, DashboardStats, NaechsterTermin

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardResponse)
def get_dashboard(db: Session = Depends(get_db)):
    today = date.today()

    kurse_gesamt = db.query(func.count(Kurs.id)).scalar() or 0
    kurse_aktiv = db.query(func.count(Kurs.id)).filter(Kurs.status == "aktiv").scalar() or 0
    teilnehmer_gesamt = db.query(func.count(Teilnehmer.id)).scalar() or 0
    anmeldungen_gesamt = db.query(func.count(Anmeldung.id)).scalar() or 0

    confirmed_sub = (
        db.query(Anmeldung.kurs_id, func.count(Anmeldung.id).label("cnt"))
        .filter(Anmeldung.status == "bestaetigt")
        .group_by(Anmeldung.kurs_id)
        .subquery()
    )

    termine_rows = (
        db.query(KursTermin, Kurs, func.coalesce(confirmed_sub.c.cnt, 0))
        .join(Kurs, KursTermin.kurs_id == Kurs.id)
        .outerjoin(confirmed_sub, Kurs.id == confirmed_sub.c.kurs_id)
        .filter(KursTermin.datum >= today, Kurs.status != "abgesagt")
        .order_by(KursTermin.datum, KursTermin.start_uhrzeit)
        .limit(8)
        .all()
    )

    naechste_termine = [
        NaechsterTermin(
            termin_id=t.id,
            datum=t.datum,
            start_uhrzeit=t.start_uhrzeit,
            kurs_id=k.id,
            kurs_name=k.name,
            kurs_status=k.status,
            anmeldungen=int(cnt),
            max_teilnehmer=k.max_teilnehmer,
        )
        for t, k, cnt in termine_rows
    ]

    return DashboardResponse(
        stats=DashboardStats(
            kurse_gesamt=kurse_gesamt,
            kurse_aktiv=kurse_aktiv,
            teilnehmer_gesamt=teilnehmer_gesamt,
            anmeldungen_gesamt=anmeldungen_gesamt,
        ),
        naechste_termine=naechste_termine,
    )
