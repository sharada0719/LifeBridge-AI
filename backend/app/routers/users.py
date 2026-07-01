from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas, auth, models
from ..database import get_db

router = APIRouter(prefix="/users", tags=["users"])

@router.put("/me", response_model=schemas.UserResponse)
def update_profile(
    user_update: schemas.UserUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    updated = crud.update_user(db, current_user.id, user_update)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return updated

@router.get("/me/contacts", response_model=List[schemas.EmergencyContactResponse])
def get_contacts(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    return crud.get_user_contacts(db, current_user.id)

@router.post("/me/contacts", response_model=schemas.EmergencyContactResponse)
def create_contact(
    contact: schemas.EmergencyContactCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    return crud.create_user_contact(db, current_user.id, contact)

@router.delete("/me/contacts/{contact_id}")
def delete_contact(
    contact_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    deleted = crud.delete_user_contact(db, current_user.id, contact_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Contact not found")
    return {"message": "Emergency contact deleted successfully"}
