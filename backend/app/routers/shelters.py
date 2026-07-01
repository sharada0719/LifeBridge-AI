from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas, auth, models
from ..database import get_db

router = APIRouter(prefix="/shelters", tags=["shelters"])

@router.get("/", response_model=List[schemas.ShelterResponse])
def get_shelters(
    db: Session = Depends(get_db)
):
    return crud.get_shelters(db)

@router.post("/", response_model=schemas.ShelterResponse)
def create_shelter(
    shelter: schemas.ShelterCreate,
    current_user: models.User = Depends(auth.get_current_responder),
    db: Session = Depends(get_db)
):
    return crud.create_shelter(db, shelter)

@router.patch("/{shelter_id}", response_model=schemas.ShelterResponse)
def update_shelter(
    shelter_id: str,
    update: schemas.ShelterUpdate,
    current_user: models.User = Depends(auth.get_current_responder),
    db: Session = Depends(get_db)
):
    updated = crud.update_shelter(db, shelter_id, update)
    if not updated:
        raise HTTPException(status_code=404, detail="Shelter not found")
    return updated
