from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Teilnehmer
from ..schemas import TeilnehmerCreate, TeilnehmerResponse

router = APIRouter(prefix="/api/teilnehmer", tags=["teilnehmer"])


@router.get("", response_model=list[TeilnehmerResponse])
def list_teilnehmer(db: Session = Depends(get_db)):
    return db.query(Teilnehmer).order_by(Teilnehmer.nachname, Teilnehmer.vorname).all()


@router.post("", response_model=TeilnehmerResponse, status_code=201)
def create_teilnehmer(payload: TeilnehmerCreate, db: Session = Depends(get_db)):
    teilnehmer = Teilnehmer(**payload.model_dump())
    db.add(teilnehmer)
    db.commit()
    db.refresh(teilnehmer)
    return teilnehmer


@router.get("/{teilnehmer_id}", response_model=TeilnehmerResponse)
def get_teilnehmer(teilnehmer_id: int, db: Session = Depends(get_db)):
    teilnehmer = db.query(Teilnehmer).filter(Teilnehmer.id == teilnehmer_id).first()
    if not teilnehmer:
        raise HTTPException(status_code=404, detail="Teilnehmer nicht gefunden")
    return teilnehmer
