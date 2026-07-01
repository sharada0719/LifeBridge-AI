from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas, auth, models
from ..database import get_db

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("/", response_model=List[schemas.NotificationResponse])
def get_my_notifications(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    return crud.get_user_notifications(db, current_user.id)

@router.post("/broadcast", response_model=schemas.NotificationResponse)
def create_broadcast_notification(
    notification: schemas.NotificationBase,
    current_user: models.User = Depends(auth.get_current_responder),
    db: Session = Depends(get_db)
):
    # Null user_id indicates it is broadcasted globally
    full_notif = schemas.NotificationCreate(**notification.model_dump(), user_id=None)
    return crud.create_notification(db, full_notif)

@router.post("/{notification_id}/read", response_model=schemas.NotificationResponse)
def mark_read(
    notification_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    updated = crud.mark_notification_as_read(db, current_user.id, notification_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Notification not found")
    return updated
