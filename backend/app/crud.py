from sqlalchemy.orm import Session
from . import models, schemas, auth

# User operations
def create_audit_log(db: Session, action: str, details: str, user_id: str = None):
    db_log = models.AuditLog(user_id=user_id, action=action, details=details)
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

def get_user(db: Session, user_id: str):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        name=user.name,
        email=user.email,
        password_hash=hashed_password,
        role=user.role,
        phone=user.phone,
        latitude=user.latitude,
        longitude=user.longitude
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    create_audit_log(db, "USER_REGISTER", f"Registered new user: {db_user.email} (Role: {db_user.role})", db_user.id)
    return db_user

def update_user(db: Session, user_id: str, user_update: schemas.UserUpdate):
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    for key, value in user_update.model_dump(exclude_unset=True).items():
        setattr(db_user, key, value)
    db.commit()
    db.refresh(db_user)
    return db_user

# Emergency Contact operations
def get_user_contacts(db: Session, user_id: str):
    return db.query(models.EmergencyContact).filter(models.EmergencyContact.user_id == user_id).all()

def create_user_contact(db: Session, user_id: str, contact: schemas.EmergencyContactCreate):
    db_contact = models.EmergencyContact(**contact.model_dump(), user_id=user_id)
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)
    return db_contact

def delete_user_contact(db: Session, user_id: str, contact_id: str):
    db_contact = db.query(models.EmergencyContact).filter(
        models.EmergencyContact.id == contact_id, 
        models.EmergencyContact.user_id == user_id
    ).first()
    if db_contact:
        db.delete(db_contact)
        db.commit()
        return True
    return False

# Emergency Request operations
def create_emergency_request(db: Session, user_id: str, request: schemas.EmergencyRequestCreate):
    db_request = models.EmergencyRequest(**request.model_dump(), user_id=user_id)
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    create_audit_log(db, "SOS_DISPATCH", f"SOS Distress request created (Type: {db_request.emergency_type}, Severity: {db_request.severity})", user_id)
    return db_request

def get_emergency_requests(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.EmergencyRequest).offset(skip).limit(limit).all()

def get_user_emergency_requests(db: Session, user_id: str):
    return db.query(models.EmergencyRequest).filter(models.EmergencyRequest.user_id == user_id).all()

def update_emergency_request(db: Session, request_id: str, update: schemas.EmergencyRequestUpdate):
    db_request = db.query(models.EmergencyRequest).filter(models.models.EmergencyRequest.id == request_id).first() if hasattr(models.models, 'EmergencyRequest') else db.query(models.EmergencyRequest).filter(models.EmergencyRequest.id == request_id).first()
    if not db_request:
        return None
    for key, value in update.model_dump(exclude_unset=True).items():
        setattr(db_request, key, value)
    db.commit()
    db.refresh(db_request)
    create_audit_log(db, "REQUEST_UPDATE", f"Distress Request status updated to: {db_request.status} (Severity: {db_request.severity})", db_request.user_id)
    return db_request

# Shelter operations
def get_shelters(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Shelter).offset(skip).limit(limit).all()

def create_shelter(db: Session, shelter: schemas.ShelterCreate):
    db_shelter = models.Shelter(**shelter.model_dump())
    db.add(db_shelter)
    db.commit()
    db.refresh(db_shelter)
    return db_shelter

def update_shelter(db: Session, shelter_id: str, update: schemas.ShelterUpdate):
    db_shelter = db.query(models.Shelter).filter(models.Shelter.id == shelter_id).first()
    if not db_shelter:
        return None
    for key, value in update.model_dump(exclude_unset=True).items():
        setattr(db_shelter, key, value)
    db.commit()
    db.refresh(db_shelter)
    create_audit_log(db, "SHELTER_UPDATE", f"Shelter occupancy updated: {db_shelter.current_occupancy}/{db_shelter.capacity} beds reserved.")
    return db_shelter

# Hospital operations
def get_hospitals(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Hospital).offset(skip).limit(limit).all()

def create_hospital(db: Session, hospital: schemas.HospitalCreate):
    db_hospital = models.Hospital(**hospital.model_dump())
    db.add(db_hospital)
    db.commit()
    db.refresh(db_hospital)
    return db_hospital

def update_hospital(db: Session, hospital_id: str, update: schemas.HospitalUpdate):
    db_hospital = db.query(models.Hospital).filter(models.Hospital.id == hospital_id).first()
    if not db_hospital:
        return None
    for key, value in update.model_dump(exclude_unset=True).items():
        setattr(db_hospital, key, value)
    db.commit()
    db.refresh(db_hospital)
    create_audit_log(db, "HOSPITAL_UPDATE", f"Hospital bed openings updated: {db_hospital.available_beds}/{db_hospital.total_beds} beds free.")
    return db_hospital

# Volunteer operations
def get_volunteers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Volunteer).offset(skip).limit(limit).all()

def create_volunteer(db: Session, user_id: str, volunteer: schemas.VolunteerCreate):
    db_volunteer = models.Volunteer(**volunteer.model_dump(), user_id=user_id)
    db.add(db_volunteer)
    db.commit()
    db.refresh(db_volunteer)
    return db_volunteer

def update_volunteer(db: Session, user_id: str, update: schemas.VolunteerUpdate):
    db_volunteer = db.query(models.Volunteer).filter(models.Volunteer.user_id == user_id).first()
    if not db_volunteer:
        return None
    for key, value in update.model_dump(exclude_unset=True).items():
        setattr(db_volunteer, key, value)
    db.commit()
    db.refresh(db_volunteer)
    create_audit_log(db, "VOLUNTEER_UPDATE", f"Volunteer profile updated: Skill set: {db_volunteer.skill_set}, status: {db_volunteer.status}", db_volunteer.user_id)
    return db_volunteer

# Resource operations
def get_resources(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Resource).offset(skip).limit(limit).all()

def create_resource(db: Session, resource: schemas.ResourceCreate):
    db_resource = models.Resource(**resource.model_dump())
    db.add(db_resource)
    db.commit()
    db.refresh(db_resource)
    return db_resource

def update_resource(db: Session, resource_id: str, update: schemas.ResourceUpdate):
    db_resource = db.query(models.Resource).filter(models.Resource.id == resource_id).first()
    if not db_resource:
        return None
    for key, value in update.model_dump(exclude_unset=True).items():
        setattr(db_resource, key, value)
    db.commit()
    db.refresh(db_resource)
    create_audit_log(db, "RESOURCE_UPDATE", f"Aid Resource updated: {db_resource.name} ({db_resource.type}) quantity set to {db_resource.quantity} ({db_resource.status})")
    return db_resource

# Notification operations
def get_user_notifications(db: Session, user_id: str):
    # Fetch notifications specifically for the user, plus global alerts (where user_id is null)
    return db.query(models.Notification).filter(
        (models.Notification.user_id == user_id) | (models.Notification.user_id == None)
    ).order_by(models.Notification.created_at.desc()).all()

def create_notification(db: Session, notification: schemas.NotificationCreate):
    db_notification = models.Notification(**notification.model_dump())
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    return db_notification

def mark_notification_as_read(db: Session, user_id: str, notification_id: str):
    db_notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        ((models.Notification.user_id == user_id) | (models.Notification.user_id == None))
    ).first()
    if db_notification:
        db_notification.is_read = True
        db.commit()
        db.refresh(db_notification)
        return db_notification
    return None

def get_audit_logs(db: Session, skip: int = 0, limit: int = 150):
    return db.query(models.AuditLog).order_by(models.AuditLog.created_at.desc()).offset(skip).limit(limit).all()
