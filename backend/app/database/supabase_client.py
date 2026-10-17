"""
Supabase PostgreSQL Database Client & Local Memory Fallback.
Provides unified CRUD interface for Action Plans, Items, Citations, and Progress Checkins.
Works seamlessly with real Supabase credentials or local transient storage in development.
"""

import uuid
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

# Transient In-Memory Store for dev/local demo
_MEMORY_PLANS: Dict[str, Dict[str, Any]] = {}
_MEMORY_CHECKINS: List[Dict[str, Any]] = []


class DatabaseClient:
    def __init__(self):
        self.supabase_url = settings.supabase_url
        self.service_key = settings.supabase_service_role_key or settings.supabase_publishable_key
        self.is_connected = bool(self.supabase_url and self.service_key)

    async def save_action_plan(
        self,
        concern_category: str,
        summary: str,
        safety_message: str,
        professional_care_guidance: str,
        limitations: str,
        actions: List[Dict[str, Any]],
        sources: List[Dict[str, Any]],
    ) -> str:
        """Save a new wellness action plan with items and citations."""
        plan_id = str(uuid.uuid4())
        created_at = datetime.utcnow().isoformat()

        plan_data = {
            "id": plan_id,
            "concern_category": concern_category,
            "summary": summary,
            "safety_message": safety_message,
            "professional_care_guidance": professional_care_guidance,
            "limitations": limitations,
            "actions": actions,
            "sources": sources,
            "created_at": created_at,
        }

        # Store in transient memory
        _MEMORY_PLANS[plan_id] = plan_data

        # If Supabase is configured, also persist to Supabase REST endpoint
        if self.is_connected:
            try:
                headers = {
                    "apikey": self.service_key,
                    "Authorization": f"Bearer {self.service_key}",
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal",
                }
                async with httpx.AsyncClient(timeout=8.0) as client:
                    await client.post(
                        f"{self.supabase_url}/rest/v1/action_plans",
                        json={
                            "id": plan_id,
                            "concern_category": concern_category,
                            "summary": summary,
                            "safety_message": safety_message,
                            "professional_care_guidance": professional_care_guidance,
                            "limitations": limitations,
                        },
                        headers=headers,
                    )
            except Exception as e:
                logger.warning(f"Failed to persist to Supabase, preserved in memory: {e}")

        return plan_id

    async def get_action_plan(self, plan_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve action plan by ID."""
        if plan_id in _MEMORY_PLANS:
            return _MEMORY_PLANS[plan_id]

        if self.is_connected:
            try:
                headers = {
                    "apikey": self.service_key,
                    "Authorization": f"Bearer {self.service_key}",
                }
                async with httpx.AsyncClient(timeout=8.0) as client:
                    res = await client.get(
                        f"{self.supabase_url}/rest/v1/action_plans?id=eq.{plan_id}&select=*",
                        headers=headers,
                    )
                    if res.status_code == 200:
                        records = res.json()
                        if records:
                            return records[0]
            except Exception as e:
                logger.warning(f"Failed to fetch plan from Supabase: {e}")

        return None

    async def record_progress(
        self,
        plan_id: str,
        status_feeling: str,
        notes: str,
        completed_action_ids: List[str],
    ) -> Dict[str, Any]:
        """Record a progress check-in for habit tracking."""
        record_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()

        entry = {
            "id": record_id,
            "plan_id": plan_id,
            "status_feeling": status_feeling,
            "notes": notes,
            "completed_action_ids": completed_action_ids,
            "timestamp": timestamp,
        }
        _MEMORY_CHECKINS.append(entry)

        # Update action item completion in memory
        if plan_id in _MEMORY_PLANS:
            for item in _MEMORY_PLANS[plan_id].get("actions", []):
                item["is_completed"] = item.get("id") in completed_action_ids

        return entry

    async def get_recent_checkins(self, plan_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieve recent progress check-ins."""
        if plan_id:
            return [c for c in _MEMORY_CHECKINS if c["plan_id"] == plan_id]
        return _MEMORY_CHECKINS[-20:]


db_client = DatabaseClient()
