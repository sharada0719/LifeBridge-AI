from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from ..database import get_db
from ..auth import get_current_admin
from ..models import User
from .. import crud, schemas, models

router = APIRouter(prefix="/admin", tags=["admin-operations"])

@router.get("/audit-logs", response_model=List[schemas.AuditLogResponse])
def list_audit_logs(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        return crud.get_audit_logs(db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch audit logs: {str(e)}"
        )

@router.get("/stats")
def get_operations_stats(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        # 1. Emergency Requests aggregations
        requests = db.query(models.EmergencyRequest).all()
        status_counts = {"pending": 0, "dispatched": 0, "resolved": 0, "cancelled": 0}
        type_counts = {"flood": 0, "earthquake": 0, "fire": 0, "cyclone": 0, "landslide": 0, "medical": 0, "other": 0}
        
        for r in requests:
            if r.status in status_counts:
                status_counts[r.status] += 1
            if r.emergency_type in type_counts:
                type_counts[r.emergency_type] += 1

        # 2. Volunteers count
        volunteers = db.query(models.Volunteer).all()
        active_volunteers = len([v for v in volunteers if v.status == "active"])

        # 3. Shelter aggregations
        shelters = db.query(models.Shelter).all()
        total_capacity = sum([s.capacity for s in shelters])
        total_occupancy = sum([s.current_occupancy for s in shelters])

        # 4. Hospital aggregations
        hospitals = db.query(models.Hospital).all()
        total_beds = sum([h.total_beds for h in hospitals])
        avail_beds = sum([h.available_beds for h in hospitals])

        # 5. Resources inventory
        resources = db.query(models.Resource).all()
        inventory = [
            {"name": r.name, "type": r.type, "quantity": r.quantity, "status": r.status}
            for r in resources
        ]

        # 6. Mock incident trends & response time (Analytics feed)
        trends = [
            {"day": "Mon", "incidents": 4},
            {"day": "Tue", "incidents": 7},
            {"day": "Wed", "incidents": 15}, # flood spike
            {"day": "Thu", "incidents": 11},
            {"day": "Fri", "incidents": 6},
            {"day": "Sat", "incidents": 8},
            {"day": "Sun", "incidents": 5}
        ]

        return {
            "requests_by_status": status_counts,
            "requests_by_type": type_counts,
            "total_requests": len(requests),
            "volunteers_active": active_volunteers,
            "volunteers_total": len(volunteers),
            "shelters": {
                "total_capacity": total_capacity,
                "total_occupancy": total_occupancy,
                "occupancy_rate": round((total_occupancy / total_capacity) * 100, 1) if total_capacity > 0 else 0
            },
            "hospitals": {
                "total_beds": total_beds,
                "available_beds": avail_beds,
                "utilization_rate": round(((total_beds - avail_beds) / total_beds) * 100, 1) if total_beds > 0 else 0
            },
            "inventory": inventory,
            "incident_trends": trends,
            "average_response_time_min": 4.8
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compile operational metrics: {str(e)}"
        )
