"""
Unit Tests for Healthcare Safety Evaluator & Red Flag Engine.
Validates that emergency symptoms and high-risk queries are caught deterministically.
"""

import pytest
from app.safety.evaluator import safety_evaluator
from app.safety.rules import check_red_flags, check_medication_manipulation


def test_red_flags_cardiac_symptoms():
    text = "I have severe crushing chest pain radiating to my left arm."
    has_rf, reasons = check_red_flags(text)
    assert has_rf is True
    assert any("chest pain" in r.lower() for r in reasons)

    eval_result = safety_evaluator.evaluate_initial_concern(text)
    assert eval_result.status == "urgent_escalation"
    assert eval_result.is_safe_for_guidance is False
    assert len(eval_result.escalation_resources) > 0
    # Checks that 112 or emergency services is in escalation resources
    assert any("112" in r["number"] or "911" in r["number"] for r in eval_result.escalation_resources)


def test_red_flags_crisis_and_self_harm():
    text = "I feel so hopeless and I want to kill myself today."
    has_rf, reasons = check_red_flags(text)
    assert has_rf is True

    eval_result = safety_evaluator.evaluate_initial_concern(text)
    assert eval_result.status == "urgent_escalation"
    assert eval_result.category == "mental_health_crisis"
    # Verifies Tele-MANAS (14416) or 988 is in resources
    assert any("14416" in r["number"] or "988" in r["number"] for r in eval_result.escalation_resources)


def test_red_flags_stroke_neurological():
    text = "My spouse noticed my face is drooping and slurred speech."
    eval_result = safety_evaluator.evaluate_initial_concern(text)
    assert eval_result.status == "urgent_escalation"
    assert eval_result.is_safe_for_guidance is False


def test_medication_manipulation_rejection():
    text = "Should I stop taking my antidepressant medication or double my dose?"
    assert check_medication_manipulation(text) is True

    eval_result = safety_evaluator.evaluate_initial_concern(text)
    assert eval_result.status == "professional_assessment_recommended"
    assert eval_result.is_safe_for_guidance is False
    assert "medication" in eval_result.safety_message.lower()


def test_unsupported_complex_domain():
    text = "Can you diagnose what stage of tumor or cancer this biopsy represents?"
    eval_result = safety_evaluator.evaluate_initial_concern(text)
    assert eval_result.status == "unsupported_concern"
    assert eval_result.is_safe_for_guidance is False


def test_supported_everyday_wellness_sleep():
    text = "I am having trouble falling asleep at night and wake up feeling groggy."
    eval_result = safety_evaluator.evaluate_initial_concern(text)
    assert eval_result.status == "follow_up_required"
    assert eval_result.is_safe_for_guidance is True
    assert eval_result.category == "sleep_hygiene"
    assert len(eval_result.follow_up_questions) > 0


def test_supported_everyday_wellness_stress():
    text = "I am experiencing workplace stress and mental burnout lately."
    eval_result = safety_evaluator.evaluate_initial_concern(text)
    assert eval_result.status == "follow_up_required"
    assert eval_result.category == "everyday_stress"
    assert len(eval_result.follow_up_questions) > 0


def test_empty_input_handling():
    eval_result = safety_evaluator.evaluate_initial_concern("   ")
    assert eval_result.status == "unable_to_complete_safely"
    assert eval_result.is_safe_for_guidance is False
