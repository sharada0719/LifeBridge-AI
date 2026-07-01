from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas, auth, models
from ..database import get_db

router = APIRouter(prefix="/volunteers", tags=["volunteers"])

@router.get("/", response_model=List[schemas.VolunteerResponse])
def get_volunteers(
    db: Session = Depends(get_db)
):
    return crud.get_volunteers(db)

@router.post("/", response_model=schemas.VolunteerResponse)
def register_volunteer(
    volunteer: schemas.VolunteerCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Check if already registered
    existing = db.query(models.Volunteer).filter(models.Volunteer.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="You are already registered as a volunteer.")
    return crud.create_volunteer(db, current_user.id, volunteer)

@router.put("/me", response_model=schemas.VolunteerResponse)
def update_volunteer_profile(
    update: schemas.VolunteerUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    updated = crud.update_volunteer(db, current_user.id, update)
    if not updated:
        raise HTTPException(status_code=404, detail="Volunteer profile not found")
    return updated
