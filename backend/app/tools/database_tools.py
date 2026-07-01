from sqlalchemy.orm import Session
from .. import models

def get_active_shelters_db(db: Session):
    try:
        return db.query(models.Shelter).all()
    except Exception as e:
        print(f"Error querying shelters: {e}")
        return []

def get_active_hospitals_db(db: Session):
    try:
        return db.query(models.Hospital).all()
    except Exception as e:
        print(f"Error querying hospitals: {e}")
        return []

def get_active_resources_db(db: Session):
    try:
        return db.query(models.Resource).all()
    except Exception as e:
        print(f"Error querying resources: {e}")
        return []

def get_active_alerts_db(db: Session):
    try:
        return db.query(models.Notification).filter(models.Notification.type == "alert").all()
    except Exception as e:
        print(f"Error querying alerts: {e}")
        return []
