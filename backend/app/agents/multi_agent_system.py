import os
import json
import math
import google.generativeai as genai
from typing import TypedDict, List, Dict, Any, Optional
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from langgraph.graph import StateGraph, END

from .. import models
from ..prompts.system_prompts import (
    ASSESSMENT_PROMPT,
    ROUTE_PROMPT,
    SHELTER_PROMPT,
    FIRST_AID_PROMPT,
    TRANSLATION_PROMPT,
    MEMORY_PROMPT,
    ALERT_PROMPT
)

import_memory_db = True
try:
    from ..tools.memory_tools import get_all_memories_db, save_memory_db, get_memory_db
    from ..tools.database_tools import (
        get_active_shelters_db,
        get_active_hospitals_db,
        get_active_resources_db,
        get_active_alerts_db
    )
except ImportError:
    import_memory_db = False

# Configure Gemini AI
api_key = os.getenv("GEMINI_API_KEY", "")
if api_key:
    genai.configure(api_key=api_key)

# ----------------------------------------------------
# 1. Pydantic Structured Output Schemas
# ----------------------------------------------------

class EmergencyAssessmentSchema(BaseModel):
    disaster_type: str = Field(description="Detected disaster type: flood, earthquake, fire, cyclone, landslide, medical, other, none")
    severity: str = Field(description="Severity level: low, medium, high, critical")
    priority: str = Field(description="Priority rating: low, medium, high, critical")
    injuries_mentioned: bool = Field(description="True if injuries are mentioned or implied")
    vulnerable_present: bool = Field(description="True if children, elderly, pregnant, or disabled individuals are present")
    recommended_actions: List[str] = Field(description="3-5 immediate physical steps the user should take")
    confidence_score: float = Field(description="Confidence score from 0.0 to 1.0")

class RouteStep(BaseModel):
    instruction: str
    latitude: float
    longitude: float

class SafeRouteSchema(BaseModel):
    route_found: bool
    start_location: str
    destination: str
    steps: List[RouteStep]
    hazards_avoided: List[str]
    alternate_route_advice: Optional[str] = None

class MatchedFacility(BaseModel):
    id: str
    name: str
    type: str # shelter, hospital, food_camp, water_station
    distance_km: float
    capacity_status: str # available, full, limited
    contact_info: str
    occupancy_or_beds: str

class ShelterMatchSchema(BaseModel):
    facilities_found: bool
    recommendations: List[MatchedFacility]
    rationale: str

class FirstAidInstruction(BaseModel):
    step_number: int
    action: str
    details: str

class MedicalFirstAidSchema(BaseModel):
    guidelines_provided: bool
    emergency_type: str # Burns, Bleeding, CPR, Snake bites, Fractures, Flood safety, Other
    steps: List[FirstAidInstruction]
    disclaimer: str = "DISCLAIMER: This is temporary guidance. Always contact emergency responders (911/112/108) immediately."
    never_diagnose_warning: str = "Do not attempt to diagnose diseases or prescribe medication."

class TranslationSchema(BaseModel):
    original_text: str
    target_language: str
    translated_text: str
    voice_synthesis_ready: bool

class MemoryUpdateItem(BaseModel):
    key: str
    value: str

class MemorySchema(BaseModel):
    detected_language: Optional[str] = None
    detected_contacts: List[Dict[str, str]] = [] # list of dicts with name, phone, relationship
    detected_preferences: List[MemoryUpdateItem] = []
    past_incidents_summary: Optional[str] = None

class AlertSynthesized(BaseModel):
    title: str
    severity: str
    summary: str
    instructions: str
    active: bool

class GovernmentAlertSchema(BaseModel):
    alerts_found: bool
    active_alerts: List[AlertSynthesized]

# ----------------------------------------------------
# 2. State Definition for LangGraph
# ----------------------------------------------------

class AgentState(TypedDict):
    # Session Details
    user_id: str
    message: str
    latitude: Optional[float]
    longitude: Optional[float]
    preferred_language: str
    db: Session
    
    # Retrieved Database Context
    memory_profile: Dict[str, Any]
    active_alerts: List[Dict[str, Any]]
    available_shelters: List[Dict[str, Any]]
    available_hospitals: List[Dict[str, Any]]
    available_resources: List[Dict[str, Any]]
    
    # Outputs from intermediate agents
    assessment: Optional[Dict[str, Any]]
    routing: Optional[Dict[str, Any]]
    matched_shelters: Optional[Dict[str, Any]]
    first_aid_guidance: Optional[Dict[str, Any]]
    alerts_feed: Optional[Dict[str, Any]]
    memory_updates: Optional[Dict[str, Any]]
    
    # Outputs for response synthesis
    synthesized_english: str
    final_response: str

# Helper to compute Haversine Distance
def get_distance(lat1, lon1, lat2, lon2):
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return 999.0
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.asin(math.sqrt(a))
    return round(R * c, 2)

# Helper to query Gemini with structured output and fallback heuristic
def query_gemini(prompt: str, system_prompt: str, schema: Any, fallback_data: Dict[str, Any]) -> Dict[str, Any]:
    if not api_key:
        return fallback_data
    try:
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=system_prompt
        )
        response = model.generate_content(
            prompt,
            generation_config={
                "response_mime_type": "application/json",
                "response_schema": schema
            }
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini API Error: {e}. Falling back to structured default.")
        return fallback_data

# ----------------------------------------------------
# 3. LangGraph Agent Nodes
# ----------------------------------------------------

def memory_retrieve_node(state: AgentState) -> Dict[str, Any]:
    """Memory Agent retrieves contacts, past incidents and preferred language."""
    user_id = state.get("user_id", "guest")
    db = state["db"]
    
    # Fetch from SQLite memory tools
    sqlite_memories = {}
    if import_memory_db:
        sqlite_memories = get_all_memories_db(user_id)
    
    # Fetch SQL emergency contacts
    sql_contacts = []
    try:
        contacts = db.query(models.EmergencyContact).filter(models.EmergencyContact.user_id == user_id).all()
        sql_contacts = [
            {"name": c.name, "phone": c.phone, "relationship": c.relationship_type, "is_trusted": c.is_trusted}
            for c in contacts
        ]
    except Exception as e:
        print(f"Error loading sql contacts: {e}")

    # Fetch SQL past requests
    sql_past_requests = []
    try:
        reqs = db.query(models.EmergencyRequest).filter(models.EmergencyRequest.user_id == user_id).order_by(models.EmergencyRequest.created_at.desc()).limit(3).all()
        sql_past_requests = [
            {"type": r.emergency_type, "severity": r.severity, "description": r.description, "status": r.status}
            for r in reqs
        ]
    except Exception as e:
        print(f"Error loading sql requests: {e}")

    profile = {
        "emergency_contacts": sql_contacts,
        "past_incidents": sql_past_requests,
        "user_preferences": sqlite_memories.get("user_preferences", ""),
        "preferred_language": sqlite_memories.get("preferred_language", "English")
    }
    
    pref_lang = sqlite_memories.get("preferred_language", state.get("preferred_language", "English"))
    
    return {
        "memory_profile": profile,
        "preferred_language": pref_lang
    }


def emergency_assessment_node(state: AgentState) -> Dict[str, Any]:
    """Emergency Assessment Agent analyzes the message and classifies it."""
    message = state["message"]
    
    # Structured fallback in case API fails
    fallback_actions = ["Stay calm.", "Call emergency services immediately.", "Ensure your own safety first."]
    fallback = {
        "disaster_type": "none",
        "severity": "low",
        "priority": "low",
        "injuries_mentioned": False,
        "vulnerable_present": False,
        "recommended_actions": fallback_actions,
        "confidence_score": 0.5
    }
    
    # Heuristic adjustment of fallback for testing offline
    msg_lower = message.lower()
    if "flood" in msg_lower or "water" in msg_lower:
        fallback.update({
            "disaster_type": "flood", "severity": "critical", "priority": "critical",
            "recommended_actions": [
                "Move to higher ground immediately.",
                "Avoid walking or driving through flood waters.",
                "Disconnect main power switches if dry."
            ]
        })
    elif "quake" in msg_lower or "earthquake" in msg_lower:
        fallback.update({
            "disaster_type": "earthquake", "severity": "high", "priority": "high",
            "recommended_actions": [
                "Drop, Cover, and Hold On.",
                "Stay away from glass windows and heavy objects.",
                "If outdoors, move to an open area away from power lines."
            ]
        })
    elif "fire" in msg_lower or "smoke" in msg_lower:
        fallback.update({
            "disaster_type": "fire", "severity": "critical", "priority": "critical",
            "recommended_actions": [
                "Evacuate the building immediately using stairs, not elevators.",
                "Stay low to avoid inhaling toxic smoke.",
                "Once safe, call local fire rescue services."
            ]
        })
    elif "cpr" in msg_lower or "bleeding" in msg_lower or "snake" in msg_lower or "fracture" in msg_lower or "burn" in msg_lower:
        fallback.update({
            "disaster_type": "medical", "severity": "high", "priority": "high", "injuries_mentioned": True,
            "recommended_actions": [
                "Call medical dispatch immediately.",
                "Administer first aid stabilization if trained.",
                "Keep the patient calm and warm."
            ]
        })

    assessment = query_gemini(
        prompt=f"User Distress Message: '{message}'",
        system_prompt=ASSESSMENT_PROMPT,
        schema=EmergencyAssessmentSchema,
        fallback_data=fallback
    )
    
    return {"assessment": assessment}


def government_alert_node(state: AgentState) -> Dict[str, Any]:
    """Government Alert Agent fetches and synthesizes official alerts."""
    db = state["db"]
    
    alerts_from_db = []
    if import_memory_db:
        alerts_from_db = get_active_alerts_db(db)
        
    formatted_alerts = [
        {"title": a.title, "message": a.message, "type": a.type, "created_at": str(a.created_at)}
        for a in alerts_from_db
    ]
    
    prompt = f"Active warnings in database: {json.dumps(formatted_alerts)}. Synthesize these for the user."
    fallback = {
        "alerts_found": len(formatted_alerts) > 0,
        "active_alerts": [
            {
                "title": a["title"],
                "severity": "high" if "Warning" in a["title"] or "Critical" in a["title"] else "medium",
                "summary": a["message"],
                "instructions": "Follow evacuation notices.",
                "active": True
            } for a in formatted_alerts
        ]
    }
    
    if not formatted_alerts:
        fallback = {
            "alerts_found": False,
            "active_alerts": []
        }

    alerts_feed = query_gemini(
        prompt=prompt,
        system_prompt=ALERT_PROMPT,
        schema=GovernmentAlertSchema,
        fallback_data=fallback
    )
    
    return {"alerts_feed": alerts_feed}


def shelter_matching_node(state: AgentState) -> Dict[str, Any]:
    """Shelter Agent finds and matches shelters, hospitals and resources."""
    db = state["db"]
    lat = state.get("latitude")
    lng = state.get("longitude")
    assessment = state.get("assessment", {})
    disaster_type = assessment.get("disaster_type", "none")
    
    # Only run if user asks, or if there is an active disaster/medical emergency
    needs_shelter = any(k in state["message"].lower() for k in ["shelter", "hospital", "camp", "water", "station", "medical kit"])
    is_emergency = disaster_type not in ["none", "other"]
    
    if not (needs_shelter or is_emergency):
        return {"matched_shelters": {"facilities_found": False, "recommendations": [], "rationale": "No shelter or facility query active."}}

    # Load from DB
    shelters_db = []
    hospitals_db = []
    resources_db = []
    
    if import_memory_db:
        shelters_db = get_active_shelters_db(db)
        hospitals_db = get_active_hospitals_db(db)
        resources_db = get_active_resources_db(db)
        
    facilities = []
    
    for s in shelters_db:
        dist = get_distance(lat, lng, s.latitude, s.longitude)
        facilities.append({
            "id": s.id,
            "name": s.name,
            "type": "shelter",
            "distance_km": dist,
            "capacity_status": "available" if s.current_occupancy < s.capacity else "full",
            "contact_info": s.contact_info or "+1 (555) 123-4567",
            "occupancy_or_beds": f"{s.current_occupancy} / {s.capacity} occupancy"
        })
        
    for h in hospitals_db:
        dist = get_distance(lat, lng, h.latitude, h.longitude)
        facilities.append({
            "id": h.id,
            "name": h.name,
            "type": "hospital",
            "distance_km": dist,
            "capacity_status": "available" if h.available_beds > 0 else "full",
            "contact_info": h.contact_info or "+1 (555) 911-0100",
            "occupancy_or_beds": f"{h.available_beds} beds free / {h.total_beds} total"
        })
        
    # Mock some food camps and water stations near the user based on active resources
    for r in resources_db:
        if r.type in ["food", "water"] and r.latitude and r.longitude:
            dist = get_distance(lat, lng, r.latitude, r.longitude)
            facilities.append({
                "id": r.id,
                "name": f"Resource Depot - {r.name}",
                "type": "food_camp" if r.type == "food" else "water_station",
                "distance_km": dist,
                "capacity_status": "available" if r.quantity > 0 else "depleted",
                "contact_info": "+1 (555) 011-2233",
                "occupancy_or_beds": f"Qty: {r.quantity} available"
            })
            
    # Sort by distance
    facilities = sorted(facilities, key=lambda x: x["distance_km"])[:4]
    
    prompt = f"User GPS Coordinates: [{lat or 40.7128}, {lng or -74.0060}]. Nearest facilities: {json.dumps(facilities)}. Select recommendations."
    fallback = {
        "facilities_found": len(facilities) > 0,
        "recommendations": facilities,
        "rationale": f"Found {len(facilities)} matching shelters or emergency care spots nearby."
    }
    
    matched_shelters = query_gemini(
        prompt=prompt,
        system_prompt=SHELTER_PROMPT,
        schema=ShelterMatchSchema,
        fallback_data=fallback
    )
    
    return {"matched_shelters": matched_shelters}


def safe_route_node(state: AgentState) -> Dict[str, Any]:
    """Safe Route Agent suggests coordinates and navigation routing advice, avoiding hazards."""
    message = state["message"].lower()
    lat = state.get("latitude")
    lng = state.get("longitude")
    assessment = state.get("assessment", {})
    disaster_type = assessment.get("disaster_type", "none")
    
    needs_route = any(k in message for k in ["route", "path", "evacuate", "escape", "navigate", "go to"])
    is_critical_disaster = disaster_type in ["flood", "landslide", "earthquake", "fire"]
    
    if not (needs_route or is_critical_disaster):
        return {"routing": {"route_found": False, "start_location": "", "destination": "", "steps": [], "hazards_avoided": []}}

    # Define some default mock roads / route nodes
    start_lat = lat or 40.7128
    start_lng = lng or -74.0060
    
    # We locate a shelter coordinates if matched
    dest_name = "Community Safe Haven"
    dest_lat = 40.7306
    dest_lng = -73.9352
    
    matched = state.get("matched_shelters", {})
    recs = matched.get("recommendations", [])
    if recs:
        dest_name = recs[0]["name"]
        # Find this facility coordinates by checking DB or estimating
        dest_lat = start_lat + 0.015
        dest_lng = start_lng + 0.02
        
    hazards = ["Main Highway active flooding", "Uptown Mudslide Roadblock"]
    
    fallback = {
        "route_found": True,
        "start_location": f"My Coordinates [{start_lat}, {start_lng}]",
        "destination": dest_name,
        "steps": [
            {"instruction": f"Head east on Local Street from [{start_lat}, {start_lng}]", "latitude": start_lat, "longitude": start_lng},
            {"instruction": "Turn left onto Safe Ridge Road, bypassing Main Highway (flooded)", "latitude": start_lat + 0.005, "longitude": start_lng + 0.008},
            {"instruction": f"Continue straight to reach {dest_name} safely", "latitude": dest_lat, "longitude": dest_lng}
        ],
        "hazards_avoided": hazards,
        "alternate_route_advice": "Alternate pathway via West Ridge Freeway remains clear for low-clearance vehicles."
    }
    
    prompt = f"Route request from [{start_lat}, {start_lng}] to {dest_name} [{dest_lat}, {dest_lng}]. Avoided hazards: {json.dumps(hazards)}."
    
    routing = query_gemini(
        prompt=prompt,
        system_prompt=ROUTE_PROMPT,
        schema=SafeRouteSchema,
        fallback_data=fallback
    )
    
    return {"routing": routing}


def medical_first_aid_node(state: AgentState) -> Dict[str, Any]:
    """Medical First Aid Agent provides guidance for Burns, Bleeding, CPR, Snake bites, Fractures, and Flood safety."""
    message = state["message"].lower()
    assessment = state.get("assessment", {})
    disaster_type = assessment.get("disaster_type", "none")
    
    first_aid_keys = ["burn", "bleed", "cpr", "snake", "fracture", "first aid", "bite", "wound", "flood safety"]
    needs_aid = any(k in message for k in first_aid_keys) or disaster_type == "medical" or assessment.get("injuries_mentioned")
    
    if not needs_aid:
        return {"first_aid_guidance": {"guidelines_provided": False, "emergency_type": "", "steps": [], "disclaimer": "", "never_diagnose_warning": ""}}

    # Detect target type
    target_aid = "Other"
    steps = []
    
    if "burn" in message:
        target_aid = "Burns"
        steps = [
            {"step_number": 1, "action": "Cool the burn", "details": "Hold the burned area under cool (not cold) running water for 10-15 minutes."},
            {"step_number": 2, "action": "Protect the burn", "details": "Cover loosely with a sterile, non-stick bandage or clean cloth. Avoid linty materials."},
            {"step_number": 3, "action": "Do NOT pop blisters", "details": "Popping blisters increases infection risk. Do not apply butter, oil, or ointments."}
        ]
    elif "bleed" in message or "wound" in message:
        target_aid = "Bleeding"
        steps = [
            {"step_number": 1, "action": "Apply direct pressure", "details": "Press firmly on the wound with a clean cloth, bandage, or gloved hand."},
            {"step_number": 2, "action": "Elevate", "details": "Position the bleeding limb above the level of the heart if possible and if fracture is not suspected."},
            {"step_number": 3, "action": "Bind the dressing", "details": "Wrap a bandage firmly to hold pressure. Do not remove original dressing if soaked; add more layers on top."}
        ]
    elif "cpr" in message:
        target_aid = "CPR"
        steps = [
            {"step_number": 1, "action": "Check responsiveness", "details": "Tap the shoulder and shout loudly: 'Are you okay?'. Check for breathing."},
            {"step_number": 2, "action": "Start compressions", "details": "Place hands in center of chest. Push hard and fast: 2 inches deep, 100-120 compressions per minute."},
            {"step_number": 3, "action": "Rescue breaths (if trained)", "details": "Give 2 rescue breaths after every 30 compressions. Otherwise, perform hands-only CPR."}
        ]
    elif "snake" in message or "bite" in message:
        target_aid = "Snake bites"
        steps = [
            {"step_number": 1, "action": "Keep calm and immobile", "details": "Minimize movement to slow venom spread. Keep the bitten limb below heart level."},
            {"step_number": 2, "action": "Clean the wound", "details": "Wash gently with soap and water. Remove rings or tight clothing as swelling will occur."},
            {"step_number": 3, "action": "Do NOT cut or suck", "details": "Never cut the wound, apply suction, apply ice, or use a tourniquet. Walk slowly if necessary; call emergency."}
        ]
    elif "fracture" in message or "bone" in message or "broken" in message:
        target_aid = "Fractures"
        steps = [
            {"step_number": 1, "action": "Immobilize the area", "details": "Do not try to realign the bone. Use a splint or rolled newspapers taped around it to prevent movement."},
            {"step_number": 2, "action": "Apply cold pack", "details": "Wrap ice in a cloth and apply to the fractured area to reduce swelling and pain."},
            {"step_number": 3, "action": "Elevate and monitor", "details": "Elevate the limb if possible. Watch for signs of shock (dizziness, pale skin, rapid breathing)."}
        ]
    elif "flood safety" in message or "flood" in message:
        target_aid = "Flood safety"
        steps = [
            {"step_number": 1, "action": "Get to high ground", "details": "Immediately move away from low-lying channels, basements, or streams."},
            {"step_number": 2, "action": "Never cross moving water", "details": "Just 6 inches of rushing water can sweep you off your feet; 2 feet can carry away cars."},
            {"step_number": 3, "action": "Avoid electrical hazards", "details": "Stay clear of power lines, flooded electrical panels, or wet appliances."}
        ]
    else:
        target_aid = "General Emergency First Aid"
        steps = [
            {"step_number": 1, "action": "Call emergency response", "details": "Contact emergency personnel immediately."},
            {"step_number": 2, "action": "Assess breathing", "details": "Ensure the airway is clear and breathing is unhindered."},
            {"step_number": 3, "action": "Keep warm and stable", "details": "Comfort the patient and protect them from weather hazards."}
        ]

    fallback = {
        "guidelines_provided": True,
        "emergency_type": target_aid,
        "steps": steps,
        "disclaimer": "CRITICAL: This first aid guide is for temporary stabilization. Always contact medical emergency services (112, 108, or 911) immediately.",
        "never_diagnose_warning": "Warning: Do not attempt to diagnose underlying medical conditions or administer prescriptions."
    }

    first_aid_guidance = query_gemini(
        prompt=f"Provide first aid instructions for: '{message}' / type: '{target_aid}'",
        system_prompt=FIRST_AID_PROMPT,
        schema=MedicalFirstAidSchema,
        fallback_data=fallback
    )
    
    # Enforce medical safety overrides
    first_aid_guidance["disclaimer"] = "CRITICAL: This guide is for temporary stabilization. Contact medical emergency services (112 / 108 / 911) immediately."
    first_aid_guidance["never_diagnose_warning"] = "Warning: Do not attempt to diagnose underlying medical conditions or administer prescriptions."
    
    return {"first_aid_guidance": first_aid_guidance}


def synthesizer_node(state: AgentState) -> Dict[str, Any]:
    """Synthesizer Agent combines all inputs into a single English response."""
    message = state["message"]
    assessment = state.get("assessment", {})
    alerts = state.get("alerts_feed", {})
    shelters = state.get("matched_shelters", {})
    routing = state.get("routing", {})
    aid = state.get("first_aid_guidance", {})
    profile = state.get("memory_profile", {})
    
    context = {
        "user_message": message,
        "assessment": assessment,
        "alerts_synthesized": alerts,
        "shelters_matched": shelters,
        "safe_route": routing,
        "medical_first_aid": aid,
        "user_memory_contacts": profile.get("emergency_contacts", [])
    }
    
    prompt = f"Construct a direct, helpful response utilizing this collected data: {json.dumps(context)}."
    
    # Formulate a basic default response in case Gemini synthesis fails
    fallback_res = "I am processing your emergency request. "
    if assessment.get("disaster_type", "none") != "none":
        fallback_res += f"We have detected a {assessment['disaster_type']} disaster situation of {assessment['severity']} severity. "
    if aid.get("guidelines_provided"):
        fallback_res += f"\n\n**First Aid Stabilization Guidelines ({aid['emergency_type']}):**\n"
        for s in aid["steps"]:
            fallback_res += f"{s['step_number']}. **{s['action']}**: {s['details']}\n"
    if shelters.get("facilities_found"):
        fallback_res += f"\n\n**Matched Shelters & Care Centers:**\n"
        for f in shelters["recommendations"]:
            fallback_res += f"- **{f['name']}** ({f['type']}) - {f['distance_km']} km away. Vacancy: {f['occupancy_or_beds']}. Phone: {f['contact_info']}\n"
    if routing.get("route_found"):
        fallback_res += f"\n\n**Safe Transit Route Directions (Avoiding hazards like {', '.join(routing['hazards_avoided'])}):**\n"
        for s in routing["steps"]:
            fallback_res += f"- {s['instruction']}\n"
    if alerts.get("alerts_found"):
        fallback_res += f"\n\n**Local Alerts Warning:**\n"
        for a in alerts["active_alerts"]:
            fallback_res += f"- **{a['title']}**: {a['summary']}\n"
            
    fallback_res += "\n\n*DISCLAIMER: LifeBridge AI provides stabilizer advice. Please contact local emergency services immediately.*"
    
    if not api_key:
        return {"synthesized_english": fallback_res}
        
    try:
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction="You are the LifeBridge AI Response Synthesizer. Combine all modular agent telemetry into a reassuring, clean, markdown-formatted response for the user. Emphasize physical safety, actionable guides, and contact points."
        )
        response = model.generate_content(prompt)
        synthesized = response.text
    except Exception as e:
        print(f"Error in response synthesizer: {e}")
        synthesized = fallback_res
        
    return {"synthesized_english": synthesized}


def translation_node(state: AgentState) -> Dict[str, Any]:
    """Translation Agent translates the response to Hindi, Kannada, Tamil, Telugu, or Marathi if required."""
    lang = state.get("preferred_language", "English")
    text = state["synthesized_english"]
    
    if lang.lower() == "english":
        return {"final_response": text}
        
    prompt = f"Translate the following text to {lang}:\n\n{text}"
    fallback = {
        "original_text": text,
        "target_language": lang,
        "translated_text": f"[{lang} Translation of]: {text}",
        "voice_synthesis_ready": True
    }
    
    translation = query_gemini(
        prompt=prompt,
        system_prompt=TRANSLATION_PROMPT,
        schema=TranslationSchema,
        fallback_data=fallback
    )
    
    return {"final_response": translation.get("translated_text", text)}


def save_memory_node(state: AgentState) -> Dict[str, Any]:
    """Memory Agent parses conversation outcomes to save preference changes or language detection."""
    user_id = state.get("user_id", "guest")
    message = state["message"]
    lang = state.get("preferred_language", "English")
    
    # Store key fields back to SQLite db
    if import_memory_db:
        save_memory_db(user_id, "preferred_language", lang)
        
        # Look for custom patterns like contact updates or language expressions in user message
        msg_lower = message.lower()
        if "my name is" in msg_lower:
            name = message.split("my name is")[-1].strip().split(".")[0].split(",")[0]
            save_memory_db(user_id, "user_name", name)
        if "speak in" in msg_lower or "talk in" in msg_lower:
            for l in ["hindi", "kannada", "tamil", "telugu", "marathi", "english"]:
                if l in msg_lower:
                    save_memory_db(user_id, "preferred_language", l.capitalize())
                    
    return {"memory_updates": {"status": "saved"}}


# ----------------------------------------------------
# 4. LangGraph Workflow Compilation
# ----------------------------------------------------

workflow = StateGraph(AgentState)

# Add Nodes
workflow.add_node("retrieve_memory", memory_retrieve_node)
workflow.add_node("emergency_assessment", emergency_assessment_node)
workflow.add_node("government_alerts", government_alert_node)
workflow.add_node("shelter_matching", shelter_matching_node)
workflow.add_node("safe_route", safe_route_node)
workflow.add_node("first_aid", medical_first_aid_node)
workflow.add_node("synthesizer", synthesizer_node)
workflow.add_node("translation", translation_node)
workflow.add_node("save_memory", save_memory_node)

# Link Edges
workflow.set_entry_point("retrieve_memory")
workflow.add_edge("retrieve_memory", "emergency_assessment")
workflow.add_edge("emergency_assessment", "government_alerts")
workflow.add_edge("government_alerts", "shelter_matching")
workflow.add_edge("shelter_matching", "safe_route")
workflow.add_edge("safe_route", "first_aid")
workflow.add_edge("first_aid", "synthesizer")
workflow.add_edge("synthesizer", "translation")
workflow.add_edge("translation", "save_memory")
workflow.add_edge("save_memory", END)

# Compile LangGraph app
agent_app = workflow.compile()


def run_copilot_agent(user_id: str, message: str, db: Session, latitude: Optional[float] = None, longitude: Optional[float] = None) -> Dict[str, Any]:
    """Runs the LangGraph Multi-Agent network synchronously."""
    initial_state = {
        "user_id": user_id,
        "message": message,
        "latitude": latitude,
        "longitude": longitude,
        "preferred_language": "English",
        "db": db,
        "memory_profile": {},
        "active_alerts": [],
        "available_shelters": [],
        "available_hospitals": [],
        "available_resources": [],
        "assessment": None,
        "routing": None,
        "matched_shelters": None,
        "first_aid_guidance": None,
        "alerts_feed": None,
        "memory_updates": None,
        "synthesized_english": "",
        "final_response": ""
    }
    
    result = agent_app.invoke(initial_state)
    
    # Return structured metadata fields alongside the text response so frontend can render custom widgets
    return {
        "message": result["final_response"],
        "preferred_language": result["preferred_language"],
        "emergency_assessment": result["assessment"],
        "routing": result["routing"],
        "matched_shelters": result["matched_shelters"],
        "first_aid_guidance": result["first_aid_guidance"],
        "alerts_feed": result["alerts_feed"]
    }
