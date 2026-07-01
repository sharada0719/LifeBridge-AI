from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas, auth, models
from ..database import get_db

router = APIRouter(prefix="/resources", tags=["resources"])

@router.get("/", response_model=List[schemas.ResourceResponse])
def get_resources(
    db: Session = Depends(get_db)
):
    return crud.get_resources(db)

@router.post("/", response_model=schemas.ResourceResponse)
def create_resource(
    resource: schemas.ResourceCreate,
    current_user: models.User = Depends(auth.get_current_responder),
    db: Session = Depends(get_db)
):
    return crud.create_resource(db, resource)

@router.patch("/{resource_id}", response_model=schemas.ResourceResponse)
def update_resource(
    resource_id: str,
    update: schemas.ResourceUpdate,
    current_user: models.User = Depends(auth.get_current_responder),
    db: Session = Depends(get_db)
):
    updated = crud.update_resource(db, resource_id, update)
    if not updated:
        raise HTTPException(status_code=404, detail="Resource not found")
    return updated
