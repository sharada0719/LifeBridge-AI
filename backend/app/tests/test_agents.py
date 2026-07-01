import pytest
from ..agents.multi_agent_system import run_copilot_agent

def test_multi_agent_flood_classification(db):
    res = run_copilot_agent(
        user_id="mock-uid",
        message="Water is rising fast in my house, need flood evacuation route.",
        db=db,
        latitude=40.7128,
        longitude=-74.0060
    )
    
    assert "message" in res
    assert "emergency_assessment" in res
    assert "routing" in res
    
    assessment = res["emergency_assessment"]
    assert assessment["disaster_type"] == "flood"
    assert assessment["severity"] in ["high", "critical"]
    assert len(assessment["recommended_actions"]) > 0

def test_multi_agent_medical_first_aid_guidance(db):
    res = run_copilot_agent(
        user_id="mock-uid",
        message="Help, my brother has a snake bite and is bleeding.",
        db=db
    )
    
    assert "first_aid_guidance" in res
    aid = res["first_aid_guidance"]
    assert aid["guidelines_provided"] is True
    assert "Snake bites" in aid["emergency_type"] or "General" in aid["emergency_type"]
    assert len(aid["steps"]) > 0
    assert "CRITICAL" in aid["disclaimer"]
