from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Anmeldung, Kurs, KursMaterial, KursTermin, Material, Teilnehmer
from ..schemas import (
    AnmeldungCreate,
    AnmeldungWithTeilnehmer,
    KursCreate,
    KursDetail,
    KursMaterialCreate,
    KursMaterialResponse,
    KursResponse,
    KursTerminCreate,
    KursTerminResponse,
    KursUpdate,
)

router = APIRouter(prefix="/api/kurse", tags=["kurse"])


@router.get("", response_model=list[KursResponse])
def list_kurse(db: Session = Depends(get_db)):
    return db.query(Kurs).order_by(Kurs.erstellt_am.desc()).all()


@router.post("", response_model=KursResponse, status_code=201)
def create_kurs(payload: KursCreate, db: Session = Depends(get_db)):
    kurs = Kurs(**payload.model_dump())
    db.add(kurs)
    db.commit()
    db.refresh(kurs)
    return kurs


@router.get("/{kurs_id}", response_model=KursDetail)
def get_kurs(kurs_id: int, db: Session = Depends(get_db)):
    kurs = db.query(Kurs).filter(Kurs.id == kurs_id).first()
    if not kurs:
        raise HTTPException(status_code=404, detail="Kurs nicht gefunden")
    return kurs


@router.put("/{kurs_id}", response_model=KursResponse)
def update_kurs(kurs_id: int, payload: KursUpdate, db: Session = Depends(get_db)):
    kurs = db.query(Kurs).filter(Kurs.id == kurs_id).first()
    if not kurs:
        raise HTTPException(status_code=404, detail="Kurs nicht gefunden")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(kurs, key, value)
    db.commit()
    db.refresh(kurs)
    return kurs


@router.delete("/{kurs_id}", status_code=204)
def delete_kurs(kurs_id: int, db: Session = Depends(get_db)):
    kurs = db.query(Kurs).filter(Kurs.id == kurs_id).first()
    if not kurs:
        raise HTTPException(status_code=404, detail="Kurs nicht gefunden")
    db.delete(kurs)
    db.commit()


@router.post("/{kurs_id}/termine", response_model=KursTerminResponse, status_code=201)
def add_termin(kurs_id: int, payload: KursTerminCreate, db: Session = Depends(get_db)):
    kurs = db.query(Kurs).filter(Kurs.id == kurs_id).first()
    if not kurs:
        raise HTTPException(status_code=404, detail="Kurs nicht gefunden")
    termin = KursTermin(kurs_id=kurs_id, **payload.model_dump())
    db.add(termin)
    db.commit()
    db.refresh(termin)
    return termin


@router.delete("/{kurs_id}/termine/{termin_id}", status_code=204)
def delete_termin(kurs_id: int, termin_id: int, db: Session = Depends(get_db)):
    termin = (
        db.query(KursTermin)
        .filter(KursTermin.id == termin_id, KursTermin.kurs_id == kurs_id)
        .first()
    )
    if not termin:
        raise HTTPException(status_code=404, detail="Termin nicht gefunden")
    db.delete(termin)
    db.commit()


@router.get("/{kurs_id}/anmeldungen", response_model=list[AnmeldungWithTeilnehmer])
def list_anmeldungen(kurs_id: int, db: Session = Depends(get_db)):
    return db.query(Anmeldung).filter(Anmeldung.kurs_id == kurs_id).all()


@router.post("/{kurs_id}/anmeldungen", response_model=AnmeldungWithTeilnehmer, status_code=201)
def create_anmeldung(kurs_id: int, payload: AnmeldungCreate, db: Session = Depends(get_db)):
    if not db.query(Kurs).filter(Kurs.id == kurs_id).first():
        raise HTTPException(status_code=404, detail="Kurs nicht gefunden")
    if not db.query(Teilnehmer).filter(Teilnehmer.id == payload.teilnehmer_id).first():
        raise HTTPException(status_code=404, detail="Teilnehmer nicht gefunden")
    existing = (
        db.query(Anmeldung)
        .filter(Anmeldung.kurs_id == kurs_id, Anmeldung.teilnehmer_id == payload.teilnehmer_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Teilnehmer bereits angemeldet")
    anmeldung = Anmeldung(kurs_id=kurs_id, **payload.model_dump())
    db.add(anmeldung)
    db.commit()
    db.refresh(anmeldung)
    return anmeldung


@router.post("/{kurs_id}/materialien", response_model=KursMaterialResponse, status_code=201)
def add_kurs_material(kurs_id: int, payload: KursMaterialCreate, db: Session = Depends(get_db)):
    if not db.query(Kurs).filter(Kurs.id == kurs_id).first():
        raise HTTPException(status_code=404, detail="Kurs nicht gefunden")
    if not db.query(Material).filter(Material.id == payload.material_id).first():
        raise HTTPException(status_code=404, detail="Material nicht gefunden")
    existing = (
        db.query(KursMaterial)
        .filter(KursMaterial.kurs_id == kurs_id, KursMaterial.material_id == payload.material_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Material bereits im Kurs eingetragen")
    km = KursMaterial(kurs_id=kurs_id, **payload.model_dump())
    db.add(km)
    db.commit()
    db.refresh(km)
    return km


@router.delete("/{kurs_id}/materialien/{km_id}", status_code=204)
def delete_kurs_material(kurs_id: int, km_id: int, db: Session = Depends(get_db)):
    km = (
        db.query(KursMaterial)
        .filter(KursMaterial.id == km_id, KursMaterial.kurs_id == kurs_id)
        .first()
    )
    if not km:
        raise HTTPException(status_code=404, detail="Kursmaterial nicht gefunden")
    db.delete(km)
    db.commit()
