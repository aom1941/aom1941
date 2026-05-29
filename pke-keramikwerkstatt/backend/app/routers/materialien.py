from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Material
from ..schemas import MaterialCreate, MaterialResponse, MaterialUpdate

router = APIRouter(prefix="/api/materialien", tags=["materialien"])


@router.get("", response_model=list[MaterialResponse])
def list_materialien(db: Session = Depends(get_db)):
    return db.query(Material).order_by(Material.kategorie, Material.name).all()


@router.post("", response_model=MaterialResponse, status_code=201)
def create_material(payload: MaterialCreate, db: Session = Depends(get_db)):
    material = Material(**payload.model_dump())
    db.add(material)
    db.commit()
    db.refresh(material)
    return material


@router.get("/{material_id}", response_model=MaterialResponse)
def get_material(material_id: int, db: Session = Depends(get_db)):
    m = db.query(Material).filter(Material.id == material_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Material nicht gefunden")
    return m


@router.put("/{material_id}", response_model=MaterialResponse)
def update_material(material_id: int, payload: MaterialUpdate, db: Session = Depends(get_db)):
    m = db.query(Material).filter(Material.id == material_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Material nicht gefunden")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(m, key, value)
    db.commit()
    db.refresh(m)
    return m


@router.delete("/{material_id}", status_code=204)
def delete_material(material_id: int, db: Session = Depends(get_db)):
    m = db.query(Material).filter(Material.id == material_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Material nicht gefunden")
    db.delete(m)
    db.commit()
