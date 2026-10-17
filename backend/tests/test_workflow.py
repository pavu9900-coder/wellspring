"""
Unit Tests for Health Workflow Engine.
Validates multi-step check-in, follow-up collection, guidance generation, and grounding.
"""

import pytest
from unittest.mock import AsyncMock, patch
from app.domain.workflow import workflow_engine
from app.domain.models import CheckInRequest


@pytest.mark.asyncio
async def test_workflow_initial_followup_trigger():
    """Initial check-in without follow-up answers returns follow_up_required with clarifying questions."""
    req = CheckInRequest(concern_text="I am unable to sleep well lately.")
    resp = await workflow_engine.process_checkin(req)
    assert resp.status == "follow_up_required"
    assert resp.concern_category == "sleep_hygiene"
    assert len(resp.follow_up_questions) > 0
    assert len(resp.recommended_actions) == 0


@pytest.mark.asyncio
async def test_workflow_complete_guidance_generation():
    req = CheckInRequest(
        concern_text="I am unable to sleep well lately.",
        category="sleep_hygiene",
        follow_up_answers={
            "duration": "1 to 3 weeks",
            "caffeine_timing": "Occasionally",
            "physical_symptoms": "No, just trouble winding down",
        },
    )
    resp = await workflow_engine.process_checkin(req)
    assert resp.status == "guidance_available"
    assert len(resp.recommended_actions) > 0
    assert len(resp.sources) > 0
    assert resp.sources[0].is_verified is True
    # Verify each recommended action has title, description, and rationale
    for action in resp.recommended_actions:
        assert action.title
        assert action.description
        assert action.rationale


@pytest.mark.asyncio
async def test_workflow_emergency_in_followup():
    req = CheckInRequest(
        concern_text="I feel stressed and fatigued.",
        follow_up_answers={
            "symptom_progression": "Now I also have severe crushing chest pain and numbness."
        },
    )
    with patch.object(
        workflow_engine, "_fetch_sources", new_callable=AsyncMock
    ) as fetch_sources, patch(
        "app.domain.workflow.nvidia_adapter.is_configured", return_value=True
    ), patch(
        "app.domain.workflow.nvidia_adapter.generate_chat_completion",
        new_callable=AsyncMock,
    ) as llm_call:
        resp = await workflow_engine.process_checkin(req)

    assert resp.status == "urgent_escalation"
    assert len(resp.escalation_resources) > 0
    assert len(resp.recommended_actions) == 0
    fetch_sources.assert_not_awaited()
    llm_call.assert_not_awaited()
