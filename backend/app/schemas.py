from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    user_id: Optional[str] = None

# User Schemas
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str = "citizen"  # citizen, responder, admin
    phone: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class UserResponse(UserBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

# Emergency Contact Schemas
class EmergencyContactBase(BaseModel):
    name: str
    phone: str
    relationship: str
    is_trusted: bool = True

class EmergencyContactCreate(EmergencyContactBase):
    pass

class EmergencyContactResponse(EmergencyContactBase):
    id: str
    user_id: str

    class Config:
        from_attributes = True

# Emergency Request Schemas
class EmergencyRequestBase(BaseModel):
    emergency_type: str  # flood, earthquake, fire, cyclone, landslide, medical, other
    description: str
    severity: str = "medium"  # low, medium, high, critical
    latitude: float
    longitude: float

class EmergencyRequestCreate(EmergencyRequestBase):
    pass

class EmergencyRequestUpdate(BaseModel):
    status: Optional[str] = None  # pending, dispatched, resolved, cancelled
    severity: Optional[str] = None

class EmergencyRequestResponse(EmergencyRequestBase):
    id: str
    user_id: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Shelter Schemas
class ShelterBase(BaseModel):
    name: str
    location_desc: str
    latitude: float
    longitude: float
    capacity: int
    current_occupancy: int
    contact_info: Optional[str] = None

class ShelterCreate(ShelterBase):
    pass

class ShelterUpdate(BaseModel):
    name: Optional[str] = None
    location_desc: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    capacity: Optional[int] = None
    current_occupancy: Optional[int] = None
    contact_info: Optional[str] = None

class ShelterResponse(ShelterBase):
    id: str

    class Config:
        from_attributes = True

# Hospital Schemas
class HospitalBase(BaseModel):
    name: str
    address: str
    latitude: float
    longitude: float
    contact_info: Optional[str] = None
    total_beds: int
    available_beds: int

class HospitalCreate(HospitalBase):
    pass

class HospitalUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    contact_info: Optional[str] = None
    total_beds: Optional[int] = None
    available_beds: Optional[int] = None

class HospitalResponse(HospitalBase):
    id: str

    class Config:
        from_attributes = True

# Volunteer Schemas
class VolunteerBase(BaseModel):
    skill_set: str
    status: str = "active"  # active, inactive
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None

class VolunteerCreate(VolunteerBase):
    pass

class VolunteerUpdate(BaseModel):
    skill_set: Optional[str] = None
    status: Optional[str] = None
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None

class VolunteerResponse(VolunteerBase):
    id: str
    user_id: str
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True

# Resource Schemas
class ResourceBase(BaseModel):
    name: str
    type: str  # water, food, medical_kit, blanket, power_bank, life_jacket
    quantity: int
    status: str = "available"  # available, allocated, depleted
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class ResourceCreate(ResourceBase):
    pass

class ResourceUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    quantity: Optional[int] = None
    status: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class ResourceResponse(ResourceBase):
    id: str

    class Config:
        from_attributes = True

# Notification Schemas
class NotificationBase(BaseModel):
    title: str
    message: str
    type: str = "info"  # alert, system, info

class NotificationCreate(NotificationBase):
    user_id: Optional[str] = None  # Null for global broadcasts

class NotificationResponse(NotificationBase):
    id: str
    user_id: Optional[str]
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    action: str
    details: str
    created_at: datetime

    class Config:
        from_attributes = True
