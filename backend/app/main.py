from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from .config import settings
from .routers import auth, users, emergency_requests, shelters, hospitals, volunteers, resources, notifications, ai_agent, admin
from . import models

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="LifeBridge AI - Intelligent Disaster Response & Emergency Assistant Backend API",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; refine in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(emergency_requests.router, prefix="/api")
app.include_router(shelters.router, prefix="/api")
app.include_router(hospitals.router, prefix="/api")
app.include_router(volunteers.router, prefix="/api")
app.include_router(resources.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(ai_agent.router, prefix="/api")
app.include_router(admin.router, prefix="/api")

@app.on_event("startup")
def seed_data():
    db = SessionLocal()
    try:
        # Seed Shelters
        if db.query(models.Shelter).count() == 0:
            shelters = [
                models.Shelter(
                    name="Community Safe Haven - West Wing",
                    location_desc="404 Resilience Blvd, Near Metro Station",
                    latitude=40.7128,
                    longitude=-74.0060,
                    capacity=250,
                    current_occupancy=45,
                    contact_info="+1 (555) 123-4567"
                ),
                models.Shelter(
                    name="St. Jude Emergency Center",
                    location_desc="92 Grace Ave, High Grounds",
                    latitude=40.7306,
                    longitude=-73.9352,
                    capacity=150,
                    current_occupancy=110,
                    contact_info="+1 (555) 987-6543"
                ),
                models.Shelter(
                    name="Downtown Public Gym Shelter",
                    location_desc="12 Stadium Way, Block B",
                    latitude=40.7580,
                    longitude=-73.9855,
                    capacity=400,
                    current_occupancy=15,
                    contact_info="+1 (555) 456-7890"
                )
            ]
            db.add_all(shelters)

        # Seed Hospitals
        if db.query(models.Hospital).count() == 0:
            hospitals = [
                models.Hospital(
                    name="Metro General Trauma Hospital",
                    address="100 Healing Way, Downtown",
                    latitude=40.7128,
                    longitude=-74.0060,
                    contact_info="+1 (555) 911-0100",
                    total_beds=200,
                    available_beds=48
                ),
                models.Hospital(
                    name="Hope Medical Emergency Center",
                    address="75 Recovery Lane, Uptown",
                    latitude=40.7306,
                    longitude=-73.9352,
                    contact_info="+1 (555) 911-0200",
                    total_beds=120,
                    available_beds=12
                ),
                models.Hospital(
                    name="Mercy Red Cross Station",
                    address="5 Field Clinic, East District",
                    latitude=40.7580,
                    longitude=-73.9855,
                    contact_info="+1 (555) 911-0300",
                    total_beds=50,
                    available_beds=35
                )
            ]
            db.add_all(hospitals)

        # Seed Resources
        if db.query(models.Resource).count() == 0:
            resources = [
                models.Resource(name="Packaged Drinking Water", type="water", quantity=5000, status="available", latitude=40.7128, longitude=-74.0060),
                models.Resource(name="MRE Meals (Ready-to-Eat)", type="food", quantity=2500, status="available", latitude=40.7128, longitude=-74.0060),
                models.Resource(name="Advanced First Aid Kit", type="medical_kit", quantity=450, status="available", latitude=40.7306, longitude=-73.9352),
                models.Resource(name="Thermal Safety Blanket", type="blanket", quantity=1200, status="available", latitude=40.7580, longitude=-73.9855),
                models.Resource(name="Inflatable Life Jackets", type="life_jacket", quantity=300, status="available", latitude=40.7306, longitude=-73.9352)
            ]
            db.add_all(resources)

        # Seed Notifications
        if db.query(models.Notification).count() == 0:
            notifications = [
                models.Notification(
                    title="🔴 Flash Flood Warning - Evacuation Advised",
                    message="High-risk flooding expected in low-lying coastal areas. Emergency teams are active. Evacuate to the nearest designated shelter immediately.",
                    type="alert",
                    is_read=False
                ),
                models.Notification(
                    title="🟢 Volunteer Network Activated",
                    message="Rescue operations have started in the West sector. Registered volunteers, please check-in via your dashboard status panel.",
                    type="info",
                    is_read=False
                )
            ]
            db.add_all(notifications)

        db.commit()
    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Welcome to LifeBridge AI Disaster Response & Emergency Assistant API. Access /docs for Interactive API Specification."}
