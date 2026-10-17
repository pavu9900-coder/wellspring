"""
Unit & Integration Tests for FastAPI Endpoints.
Uses Starlette/FastAPI TestClient to verify HTTP contracts and status codes.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "services" in data
    assert "nvidia_llm" in data["services"]
    assert "medlineplus" in data["services"]


def test_crisis_resources_endpoint():
    res = client.get("/api/crisis-resources")
    assert res.status_code == 200
    data = res.json()
    assert "resources" in data
    assert len(data["resources"]) >= 3
    # Check that Tele-MANAS is present
    assert any("Tele-MANAS" in r["name"] for r in data["resources"])


def test_check_in_emergency_endpoint():
    payload = {"concern_text": "I have sudden severe difficulty breathing and chest pressure."}
    res = client.post("/api/check-in", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "urgent_escalation"
    assert len(data["escalation_resources"]) > 0
    assert len(data["recommended_actions"]) == 0


def test_check_in_followup_endpoint():
    payload = {"concern_text": "I am having restless sleep and wake up exhausted."}
    res = client.post("/api/check-in", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "follow_up_required"
    assert len(data["follow_up_questions"]) > 0
    assert len(data["recommended_actions"]) == 0


def test_check_in_full_guidance_endpoint():
    payload = {
        "concern_text": "I am having restless sleep and wake up exhausted.",
        "follow_up_answers": {
            "duration": "1 to 3 weeks",
            "caffeine_timing": "Rarely or never",
            "physical_symptoms": "No, just trouble winding down",
        },
    }
    res = client.post("/api/check-in", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "guidance_available"
    assert len(data["recommended_actions"]) >= 2
    assert len(data["sources"]) > 0


def test_save_and_retrieve_action_plan():
    plan_payload = {
        "concern_category": "sleep_hygiene",
        "summary": "Sample sleep action plan",
        "safety_message": "Follow safe routine",
        "professional_care_guidance": "See doctor if needed",
        "limitations": "Prototype info",
        "recommended_actions": [
            {
                "id": "act-1",
                "title": "Sleep earlier",
                "description": "Go to bed by 11pm",
                "rationale": "Circadian rhythm",
                "frequency": "daily",
                "is_completed": False,
            }
        ],
        "sources": [
            {
                "title": "Healthy Sleep",
                "url": "https://medlineplus.gov/healthy-sleep.html",
                "organization": "NIH",
                "summary": "Sleep info",
            }
        ],
    }

    # Save
    res_save = client.post("/api/action-plans/save", json=plan_payload)
    assert res_save.status_code == 200
    plan_id = res_save.json()["plan_id"]
    assert plan_id

    # Retrieve
    res_get = client.get(f"/api/action-plans/{plan_id}")
    assert res_get.status_code == 200
    retrieved = res_get.json()
    assert retrieved["id"] == plan_id
    assert retrieved["summary"] == "Sample sleep action plan"


def test_habits_check_in_improving():
    payload = {
        "plan_id": "test-plan-1",
        "status_feeling": "improving",
        "notes": "Feeling more rested after sticking to routine.",
        "completed_action_ids": ["act-1"],
    }
    res = client.post("/api/habits/check-in", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status_feeling"] == "improving"
    assert data["safety_alert"] is None


def test_habits_check_in_worsening_triggers_alert():
    payload = {
        "plan_id": "test-plan-1",
        "status_feeling": "worsening",
        "notes": "My exhaustion has gotten much worse and I cannot focus.",
        "completed_action_ids": [],
    }
    res = client.post("/api/habits/check-in", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status_feeling"] == "worsening"
    assert data["safety_alert"] is not None
    assert "worsening" in data["safety_alert"].lower()
