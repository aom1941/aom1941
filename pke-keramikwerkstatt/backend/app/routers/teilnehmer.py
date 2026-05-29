from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Anmeldung, Teilnehmer
from ..schemas import TeilnehmerCreate, TeilnehmerListItem, TeilnehmerResponse, TeilnehmerWithKurse

router = APIRouter(prefix="/api/teilnehmer", tags=["teilnehmer"])


@router.get("", response_model=list[TeilnehmerListItem])
def list_teilnehmer(db: Session = Depends(get_db)):
    count_sub = (
        db.query(Anmeldung.teilnehmer_id, func.count(Anmeldung.id).label("cnt"))
        .group_by(Anmeldung.teilnehmer_id)
        .subquery()
    )
    rows = (
        db.query(Teilnehmer, func.coalesce(count_sub.c.cnt, 0))
        .outerjoin(count_sub, Teilnehmer.id == count_sub.c.teilnehmer_id)
        .order_by(Teilnehmer.nachname, Teilnehmer.vorname)
        .all()
    )
    return [
        TeilnehmerListItem(
            id=t.id,
            vorname=t.vorname,
            nachname=t.nachname,
            telefon=t.telefon,
            email=t.email,
            erstellt_am=t.erstellt_am,
            anmeldungen_count=int(cnt),
        )
        for t, cnt in rows
    ]


@router.post("", response_model=TeilnehmerResponse, status_code=201)
def create_teilnehmer(payload: TeilnehmerCreate, db: Session = Depends(get_db)):
    teilnehmer = Teilnehmer(**payload.model_dump())
    db.add(teilnehmer)
    db.commit()
    db.refresh(teilnehmer)
    return teilnehmer


@router.get("/{teilnehmer_id}", response_model=TeilnehmerWithKurse)
def get_teilnehmer(teilnehmer_id: int, db: Session = Depends(get_db)):
    teilnehmer = db.query(Teilnehmer).filter(Teilnehmer.id == teilnehmer_id).first()
    if not teilnehmer:
        raise HTTPException(status_code=404, detail="Teilnehmer nicht gefunden")
    return teilnehmer
