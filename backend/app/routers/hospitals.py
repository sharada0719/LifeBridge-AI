from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas, auth, models
from ..database import get_db

router = APIRouter(prefix="/hospitals", tags=["hospitals"])

@router.get("/", response_model=List[schemas.HospitalResponse])
def get_hospitals(
    db: Session = Depends(get_db)
):
    return crud.get_hospitals(db)

@router.post("/", response_model=schemas.HospitalResponse)
def create_hospital(
    hospital: schemas.HospitalCreate,
    current_user: models.User = Depends(auth.get_current_responder),
    db: Session = Depends(get_db)
):
    return crud.create_hospital(db, hospital)

@router.patch("/{hospital_id}", response_model=schemas.HospitalResponse)
def update_hospital(
    hospital_id: str,
    update: schemas.HospitalUpdate,
    current_user: models.User = Depends(auth.get_current_responder),
    db: Session = Depends(get_db)
):
    updated = crud.update_hospital(db, hospital_id, update)
    if not updated:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return updated
