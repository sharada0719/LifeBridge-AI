from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas, auth, models
from ..database import get_db

router = APIRouter(prefix="/requests", tags=["emergency-requests"])

@router.post("/", response_model=schemas.EmergencyRequestResponse)
def create_request(
    request: schemas.EmergencyRequestCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    return crud.create_emergency_request(db, current_user.id, request)

@router.get("/", response_model=List[schemas.EmergencyRequestResponse])
def list_requests(
    current_user: models.User = Depends(auth.get_current_responder),
    db: Session = Depends(get_db)
):
    return crud.get_emergency_requests(db)

@router.get("/me", response_model=List[schemas.EmergencyRequestResponse])
def list_my_requests(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    return crud.get_user_emergency_requests(db, current_user.id)

@router.patch("/{request_id}", response_model=schemas.EmergencyRequestResponse)
def update_request(
    request_id: str,
    update: schemas.EmergencyRequestUpdate,
    current_user: models.User = Depends(auth.get_current_responder),
    db: Session = Depends(get_db)
):
    updated = crud.update_emergency_request(db, request_id, update)
    if not updated:
        raise HTTPException(status_code=404, detail="Emergency request not found")
    return updated
