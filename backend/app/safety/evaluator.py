"""
Healthcare Safety Evaluator.
Executes the testable safety policy layer.
Determines SafetyStatus and builds clinical guardrails.
"""

from typing import Dict, Any, List, Optional
from app.safety.rules import (
    check_red_flags,
    check_medication_manipulation,
    identify_unsupported_domain,
    classify_wellness_category,
)
from app.adapters.crisis_resources import get_crisis_resources


class SafetyEvaluationResult:
    def __init__(
        self,
        status: str,
        category: str,
        is_safe_for_guidance: bool,
        safety_message: str,
        escalation_resources: List[Dict[str, Any]] = None,
        follow_up_questions: List[Dict[str, Any]] = None,
        professional_care_guidance: str = "",
        rejection_reason: Optional[str] = None,
    ):
        self.status = status
        self.category = category
        self.is_safe_for_guidance = is_safe_for_guidance
        self.safety_message = safety_message
        self.escalation_resources = escalation_resources or []
        self.follow_up_questions = follow_up_questions or []
        self.professional_care_guidance = professional_care_guidance
        self.rejection_reason = rejection_reason

    def to_dict(self) -> Dict[str, Any]:
        return {
            "status": self.status,
            "category": self.category,
            "is_safe_for_guidance": self.is_safe_for_guidance,
            "safety_message": self.safety_message,
            "escalation_resources": self.escalation_resources,
            "follow_up_questions": self.follow_up_questions,
            "professional_care_guidance": self.professional_care_guidance,
            "rejection_reason": self.rejection_reason,
        }


CATEGORY_FOLLOW_UPS = {
    "sleep_hygiene": [
        {
            "id": "duration",
            "question": "How long have you been experiencing difficulty with your sleep?",
            "options": ["A few days", "1 to 3 weeks", "More than a month", "Chronic / several months"],
        },
        {
            "id": "caffeine_timing",
            "question": "Do you consume tea, coffee, energy drinks, or heavy meals within 4 hours before bedtime?",
            "options": ["Rarely or never", "Occasionally", "Almost every evening", "Yes, right before bed"],
        },
        {
            "id": "physical_symptoms",
            "question": "Do you experience loud snoring, sudden gasping for air, or restless leg sensations?",
            "options": ["No, just trouble winding down", "Occasional restlessness", "Yes, partner noted heavy snoring/choking", "Unsure"],
        },
    ],
    "everyday_stress": [
        {
            "id": "stress_duration",
            "question": "Is this tension linked to a specific temporary event (e.g., project, exam) or an ongoing state?",
            "options": ["Temporary acute situation", "Ongoing for several weeks", "Persistent exhaustion / burnout", "Unsure"],
        },
        {
            "id": "routine_impact",
            "question": "Has this stress significantly interfered with your eating habits, sleep, or ability to focus on daily tasks?",
            "options": ["Mild impact only", "Noticeably disrupted routine", "Severe disruption", "No impact"],
        },
    ],
    "light_physical_wellness": [
        {
            "id": "screen_time",
            "question": "How many hours of uninterrupted screen time or seated desk work do you typically have each day?",
            "options": ["Under 4 hours", "4 to 7 hours", "8+ hours with few breaks", "Frequent breaks taken"],
        },
        {
            "id": "radiating_pain",
            "question": "Is the stiffness localized, or is there any numbness, tingling, or weakness radiating into your limbs?",
            "options": ["Localized stiffness only", "Mild neck tension", "Yes, numbness/tingling in hands/arms", "Unsure"],
        },
    ],
    "healthy_routines": [
        {
            "id": "hydration_goal",
            "question": "What is your main priority for your daily health routine right now?",
            "options": ["Consistent hydration", "Active movement & light walking", "Reducing evening screen time", "Balanced meal cadence"],
        },
    ],
}


class SafetyEvaluator:
    @staticmethod
    def evaluate_initial_concern(concern_text: str) -> SafetyEvaluationResult:
        """
        Evaluate user concern through deterministic safety gates.
        """
        text = concern_text.strip()
        if not text:
            return SafetyEvaluationResult(
                status="unable_to_complete_safely",
                category="unknown",
                is_safe_for_guidance=False,
                safety_message="Please provide a brief description of your wellness concern.",
            )

        # 1. Gate 1: Check for Emergency Red Flags
        has_red_flags, red_flag_reasons = check_red_flags(text)
        if has_red_flags:
            # Check if self-harm or mental health crisis
            is_crisis = any("crisis" in r.lower() or "self-harm" in r.lower() for r in red_flag_reasons)
            category = "mental_health_crisis" if is_crisis else "medical_emergency"
            resources = get_crisis_resources(category=category)

            reasons_summary = "; ".join(red_flag_reasons)
            safety_msg = (
                "EMERGENCY WARNING: Your message indicates potential symptoms requiring urgent medical attention. "
                "WellSpring AI cannot evaluate life-threatening conditions or replace emergency care. "
                "Please contact your nearest emergency response service immediately."
            )
            if is_crisis:
                safety_msg = (
                    "CRISIS ALERT: We hear that you are going through a deeply difficult time. You do not have to carry this alone. "
                    "Free, confidential human support is available 24/7 right now through Tele-MANAS (14416 in India) or 988 (in the US)."
                )

            return SafetyEvaluationResult(
                status="urgent_escalation",
                category=category,
                is_safe_for_guidance=False,
                safety_message=safety_msg,
                escalation_resources=resources,
                professional_care_guidance="Seek immediate emergency medical or crisis evaluation.",
                rejection_reason=f"Emergency red flag triggered: {reasons_summary}",
            )

        # 2. Gate 2: Check for Prescription / Dosage Alteration Requests
        if check_medication_manipulation(text):
            return SafetyEvaluationResult(
                status="professional_assessment_recommended",
                category="medication_safety",
                is_safe_for_guidance=False,
                safety_message=(
                    "Medication Safety Notice: Only a licensed medical practitioner or your prescribing doctor "
                    "can safely advise on starting, stopping, or adjusting pharmaceutical medication dosages. "
                    "Never alter prescription medication without direct clinical supervision."
                ),
                professional_care_guidance="Please contact your prescribing physician or a licensed pharmacist directly regarding any medication adjustments.",
                rejection_reason="Medication alteration request detected.",
            )

        # 3. Gate 3: Check for Unsupported High-Risk Medical Inquiries
        is_unsupported, unsupported_domain = identify_unsupported_domain(text)
        if is_unsupported:
            return SafetyEvaluationResult(
                status="unsupported_concern",
                category="unsupported_domain",
                is_safe_for_guidance=False,
                safety_message=(
                    f"Out-of-Scope Notice: WellSpring AI supports everyday wellness habits (sleep, stress, hydration, ergonomic habits). "
                    f"Inquiries involving {unsupported_domain} require formal diagnostic evaluation by a licensed healthcare professional."
                ),
                professional_care_guidance="Please consult a primary care physician or appropriate medical specialist.",
                rejection_reason=f"Unsupported domain: {unsupported_domain}",
            )

        # 4. Gate 4: Classify Wellness Category & Determine Follow-Up Questions
        category = classify_wellness_category(text)
        follow_ups = CATEGORY_FOLLOW_UPS.get(category, CATEGORY_FOLLOW_UPS["healthy_routines"])

        return SafetyEvaluationResult(
            status="follow_up_required",
            category=category,
            is_safe_for_guidance=True,
            safety_message="Your inquiry is within supported everyday wellness scope. A few quick context questions will help tailor actionable guidance.",
            follow_up_questions=follow_ups,
            professional_care_guidance="If symptoms persist or worsen, consult a qualified healthcare provider.",
        )


safety_evaluator = SafetyEvaluator()
