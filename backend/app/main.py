"""
WellSpring AI - Authoritative Python Backend (FastAPI).
Exposes typed REST endpoints for health check-in, safety triage,
authoritative MedlinePlus retrieval, NVIDIA LLM synthesis, and habit tracking.
"""

import logging
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.domain.models import (
    CheckInRequest,
    CheckInResponse,
    ProgressCheckInRequest,
    ProgressCheckInResponse,
)
from app.domain.workflow import workflow_engine
from app.adapters.nvidia_adapter import nvidia_adapter
from app.adapters.medlineplus_adapter import medline_adapter
from app.adapters.crisis_resources import get_crisis_resources
from app.adapters.open_meteo_adapter import open_meteo_adapter
from app.database.supabase_client import db_client
from app.safety.rules import check_red_flags

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("wellspring.backend")

app = FastAPI(
    title="WellSpring AI Backend API",
    description="Authoritative backend for AI-assisted health action planning and safety evaluation.",
    version="1.0.0",
)

# CORS configuration
origins = [
    settings.frontend_origin,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_status():
    """System health check and external service configuration state."""
    return {
        "status": "healthy",
        "app_env": settings.app_env,
        "services": {
            "nvidia_llm": {
                "configured": nvidia_adapter.is_configured(),
                "model": settings.nvidia_model,
                "base_url": settings.nvidia_base_url,
            },
            "medlineplus": {
                "enabled": settings.medlineplus_enabled,
                "endpoint": medline_adapter.BASE_URL,
            },
            "supabase": {
                "configured": db_client.is_connected,
            },
            "open_meteo": {
                "enabled": settings.open_meteo_enabled,
            },
        },
    }


@app.post("/api/check-in", response_model=CheckInResponse)
async def process_check_in(request: CheckInRequest):
    """
    Core health check-in endpoint.
    Runs input through safety policy, MedlinePlus knowledge grounding, and NVIDIA LLM synthesis.
    """
    try:
        response = await workflow_engine.process_checkin(request)
        return response
    except Exception as exc:
        logger.error(f"Unexpected error in check-in flow: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to complete health check-in safely at this moment. Please try again or consult a doctor.",
        )


@app.post("/api/action-plans/save")
async def save_action_plan(payload: Dict[str, Any]):
    """Persist an action plan and return unique plan_id."""
    category = payload.get("concern_category", "general_wellness")
    summary = payload.get("summary", "")
    safety_message = payload.get("safety_message", "")
    guidance = payload.get("professional_care_guidance", "")
    limitations = payload.get("limitations", "")
    actions = payload.get("recommended_actions", [])
    sources = payload.get("sources", [])

    plan_id = await db_client.save_action_plan(
        concern_category=category,
        summary=summary,
        safety_message=safety_message,
        professional_care_guidance=guidance,
        limitations=limitations,
        actions=actions,
        sources=sources,
    )
    return {"plan_id": plan_id, "status": "saved"}


@app.get("/api/action-plans/{plan_id}")
async def get_action_plan(plan_id: str):
    """Fetch action plan by ID."""
    plan = await db_client.get_action_plan(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Action plan not found")
    return plan


@app.post("/api/habits/check-in", response_model=ProgressCheckInResponse)
async def record_habit_progress(request: ProgressCheckInRequest):
    """
    Record progress check-in. Evaluates status_feeling.
    If symptoms are worsening, advises professional care evaluation.
    """
    safety_alert = None
    if request.status_feeling == "worsening":
        # Check notes for emergent red flags
        has_rf, rf_reasons = check_red_flags(request.notes or "")
        if has_rf:
            safety_alert = (
                "EMERGENCY WARNING: Your progress update indicates worsening symptoms that require urgent medical attention. "
                "Please seek immediate medical evaluation."
            )
        else:
            safety_alert = (
                "Clinical Caution: You indicated that your symptoms are worsening. "
                "Non-invasive lifestyle adjustments should not delay professional medical diagnosis. "
                "We strongly recommend scheduling an appointment with your healthcare physician."
            )

    entry = await db_client.record_progress(
        plan_id=request.plan_id,
        status_feeling=request.status_feeling,
        notes=request.notes or "",
        completed_action_ids=request.completed_action_ids,
    )

    return ProgressCheckInResponse(
        plan_id=request.plan_id,
        status_feeling=request.status_feeling,
        safety_alert=safety_alert,
        message="Progress recorded successfully.",
        timestamp=entry["timestamp"],
    )


@app.get("/api/habits/history")
async def get_habit_history(plan_id: Optional[str] = None):
    """Retrieve habit completion and progress history."""
    return await db_client.get_recent_checkins(plan_id)


@app.get("/api/library/search")
async def search_health_library(q: str = Query(..., min_length=2)):
    """Search authoritative MedlinePlus health topics."""
    results = await medline_adapter.search_health_topics(query=q, max_results=6)
    return {"query": q, "results": results}


@app.get("/api/crisis-resources")
async def fetch_crisis_directory(category: Optional[str] = None, region: Optional[str] = None):
    """Retrieve verified crisis and emergency health resources."""
    return {"resources": get_crisis_resources(category=category, region=region)}


@app.get("/api/environmental-context")
async def get_environmental_context(lat: float = 28.6139, lon: float = 77.2090):
    """Get optional ambient weather wellness tips."""
    weather = await open_meteo_adapter.get_current_weather(latitude=lat, longitude=lon)
    return {"weather": weather}
