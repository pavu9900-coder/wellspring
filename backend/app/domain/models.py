"""
Domain Pydantic Models for WellSpring AI.
Ensures typed request/response validation and safe JSON contracts.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class ActionItem(BaseModel):
    id: str
    title: str
    description: str
    rationale: str
    frequency: str = "daily"
    is_completed: bool = False


class SourceCitation(BaseModel):
    title: str
    url: str
    organization: str
    summary: str
    attribution: str = "National Library of Medicine / MedlinePlus"
    is_verified: bool = True


class CrisisResource(BaseModel):
    id: str
    name: str
    region: str
    number: str
    description: str
    category: str
    official_url: str
    is_emergency: bool = True


class CheckInRequest(BaseModel):
    concern_text: str = Field(..., min_length=2, max_length=2000)
    category: Optional[str] = None
    follow_up_answers: Optional[Dict[str, str]] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class CheckInResponse(BaseModel):
    status: str
    concern_category: str
    summary: str
    safety_message: str
    professional_care_guidance: str
    follow_up_questions: List[Dict[str, Any]] = Field(default_factory=list)
    escalation_resources: List[Dict[str, Any]] = Field(default_factory=list)
    recommended_actions: List[ActionItem] = Field(default_factory=list)
    sources: List[SourceCitation] = Field(default_factory=list)
    environmental_context: Optional[Dict[str, Any]] = None
    generation_source: Optional[str] = None
    limitations: str = (
        "WellSpring AI provides general educational health information and wellness suggestions. "
        "It is not an automated doctor, diagnostic system, or prescription advisor. "
        "Always consult a licensed medical clinician for medical evaluation."
    )


class ProgressCheckInRequest(BaseModel):
    plan_id: str
    status_feeling: str = Field(..., description="'improving', 'unchanged', or 'worsening'")
    notes: Optional[str] = ""
    completed_action_ids: List[str] = Field(default_factory=list)


class ProgressCheckInResponse(BaseModel):
    plan_id: str
    status_feeling: str
    safety_alert: Optional[str] = None
    message: str
    timestamp: str
