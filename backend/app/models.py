import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="citizen")  # citizen, responder, admin
    phone = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    contacts = relationship("EmergencyContact", back_populates="user", cascade="all, delete-orphan")
    requests = relationship("EmergencyRequest", back_populates="user", cascade="all, delete-orphan")
    volunteer_profile = relationship("Volunteer", back_populates="user", uselist=False, cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")

class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    relationship_type = Column(String, nullable=False)
    is_trusted = Column(Boolean, default=True)

    # Relationships
    user = relationship("User", back_populates="contacts")

class EmergencyRequest(Base):
    __tablename__ = "emergency_requests"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    emergency_type = Column(String, nullable=False)  # flood, earthquake, fire, cyclone, landslide, medical, other
    status = Column(String, default="pending")  # pending, dispatched, resolved, cancelled
    description = Column(String, nullable=False)
    severity = Column(String, default="medium")  # low, medium, high, critical
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="requests")

class Shelter(Base):
    __tablename__ = "shelters"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    name = Column(String, nullable=False)
    location_desc = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    capacity = Column(Integer, default=100)
    current_occupancy = Column(Integer, default=0)
    contact_info = Column(String, nullable=True)

class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    name = Column(String, nullable=False)
    address = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    contact_info = Column(String, nullable=True)
    total_beds = Column(Integer, default=50)
    available_beds = Column(Integer, default=50)

class Volunteer(Base):
    __tablename__ = "volunteers"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    skill_set = Column(String, nullable=False)  # e.g., First Aid, Rescue, Medical, Driving
    status = Column(String, default="active")  # active, inactive
    current_lat = Column(Float, nullable=True)
    current_lng = Column(Float, nullable=True)

    # Relationships
    user = relationship("User", back_populates="volunteer_profile")

class Resource(Base):
    __tablename__ = "resources"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # water, food, medical_kit, blanket, power_bank, life_jacket
    quantity = Column(Integer, default=0)
    status = Column(String, default="available")  # available, allocated, depleted
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)  # Nullable for broadcast alerts
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    type = Column(String, default="info")  # alert, system, info
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="notifications")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)  # Nullable for system tasks
    action = Column(String, nullable=False)  # e.g., "USER_REGISTER", "SOS_DISPATCH", "SHELTER_UPDATE"
    details = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User")
