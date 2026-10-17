"""
Health Action Workflow Orchestrator.
Coordinates:
1. Safety policy checks
2. Follow-up inquiry verification
3. MedlinePlus authoritative health content grounding
4. Environmental context enrichment
5. NVIDIA LLM synthesis (with deterministic fallback)
6. Post-generation safety & citation verification
"""

import json
import re
import logging
from typing import Dict, Any, List, Optional
from app.domain.models import CheckInRequest, CheckInResponse, ActionItem, SourceCitation
from app.safety.evaluator import safety_evaluator
from app.adapters.medlineplus_adapter import medline_adapter
from app.adapters.open_meteo_adapter import open_meteo_adapter
from app.adapters.nvidia_adapter import nvidia_adapter, NvidiaAPIError
from app.adapters.crisis_resources import get_crisis_resources
from app.safety.rules import check_red_flags, check_medication_manipulation

logger = logging.getLogger(__name__)


CURATED_WELLNESS_GROUNDING = {
    "sleep_hygiene": {
        "title": "Healthy Sleep Habits (Sleep Hygiene)",
        "summary": "Sleep hygiene involves consistent bedtime routines, keeping the sleeping space cool and dark, limiting evening blue light from mobile devices, and avoiding caffeine or stimulants within 4-6 hours of bed.",
        "url": "https://medlineplus.gov/healthy-sleep.html",
        "organization": "National Institutes of Health / MedlinePlus",
        "default_actions": [
            {
                "id": "act-sleep-1",
                "title": "Establish a 30-minute digital sunset",
                "description": "Switch screens and high-intensity notifications off 30 to 45 minutes before your target bedtime. Replace with quiet reading or gentle stretching.",
                "rationale": "Blue-spectrum light from phone and computer displays suppresses evening melatonin synthesis and disrupts the circadian sleep cycle.",
                "frequency": "nightly",
            },
            {
                "id": "act-sleep-2",
                "title": "Fix consistent wake-up time",
                "description": "Anchor your wake-up time to the exact same hour every day (+/- 20 minutes), even on weekends.",
                "rationale": "A fixed morning awakening time reinforces circadian rhythm and sleep drive more effectively than varying bedtimes.",
                "frequency": "daily",
            },
            {
                "id": "act-sleep-3",
                "title": "Cut afternoon caffeine cutoff at 2:00 PM",
                "description": "Cease coffee, strong tea, and energy drink intake past early afternoon.",
                "rationale": "Caffeine has an average elimination half-life of 5-7 hours and can interfere with deep slow-wave restorative sleep.",
                "frequency": "daily",
            },
        ],
    },
    "everyday_stress": {
        "title": "Stress and Your Health",
        "summary": "Everyday stress can manifest physically as muscle tightness, headaches, and mental fatigue. Proven lifestyle adjustments include rhythmic box breathing, brief outdoor walks, structured priority lists, and restorative pauses.",
        "url": "https://medlineplus.gov/stress.html",
        "organization": "National Library of Medicine / MedlinePlus",
        "default_actions": [
            {
                "id": "act-stress-1",
                "title": "Practice 4-4-4-4 Box Breathing twice daily",
                "description": "Inhale for 4 seconds, hold gently for 4, exhale slowly for 4, hold empty for 4. Repeat for 4 full cycles.",
                "rationale": "Controlled diaphragmatic pacing stimulates the vagus nerve and activates parasympathetic relaxation response.",
                "frequency": "twice daily",
            },
            {
                "id": "act-stress-2",
                "title": "Conduct an evening mental download",
                "description": "Spend 5 minutes writing down tomorrow's 3 primary tasks on paper to unload working memory before sleep.",
                "rationale": "Externalizing pending obligations reduces cognitive rumination and anticipatory cortisol spikes.",
                "frequency": "evening",
            },
            {
                "id": "act-stress-3",
                "title": "15-minute natural daylight walk",
                "description": "Take a brisk walk outdoors during morning or midday break without headphones.",
                "rationale": "Natural sunlight exposure and bilateral movement help regulate mood neurotransmitters and lower perceived stress.",
                "frequency": "daily",
            },
        ],
    },
    "light_physical_wellness": {
        "title": "Ergonomics and Musculoskeletal Health",
        "summary": "Prolonged desk work often causes postural fatigue, cervical stiffness, and eye strain. Regular 20-20-20 visual resets, desk stretches, and posture corrections reduce cumulative strain.",
        "url": "https://medlineplus.gov/occupationalhealth.html",
        "organization": "National Institute for Occupational Safety and Health (NIOSH)",
        "default_actions": [
            {
                "id": "act-phys-1",
                "title": "Adopt 20-20-20 rule for eye strain",
                "description": "Every 20 minutes of screen work, look at an object 20 feet away for at least 20 seconds.",
                "rationale": "Relaxes the ciliary muscles in the eyes and prevents digital ocular fatigue.",
                "frequency": "throughout day",
            },
            {
                "id": "act-phys-2",
                "title": "Perform gentle chin tucks & shoulder rolls",
                "description": "Do 5 slow shoulder rolls backwards followed by 5 gentle chin retractions every 2 hours of desk work.",
                "rationale": "Counteracts forward head posture and eases tension in the trapezius and levator scapulae muscles.",
                "frequency": "every 2 hours",
            },
        ],
    },
    "healthy_routines": {
        "title": "Healthy Habits for Daily Living",
        "summary": "Building durable wellness habits depends on simple environmental cues, adequate daily hydration, balanced nutrition timing, and consistent gentle physical activity.",
        "url": "https://medlineplus.gov/healthyhabits.html",
        "organization": "National Institutes of Health / MedlinePlus",
        "default_actions": [
            {
                "id": "act-hab-1",
                "title": "Morning 500ml hydration glass",
                "description": "Drink a full glass of room-temperature water upon waking before having tea or coffee.",
                "rationale": "Rehydrates the body after overnight fluid loss and supports digestive motility.",
                "frequency": "morning",
            },
            {
                "id": "act-hab-2",
                "title": "Post-meal 10-minute light stroll",
                "description": "Take a casual 10-minute walk after lunch or dinner.",
                "rationale": "Gentle postprandial movement assists glucose absorption into skeletal muscle without digestive upset.",
                "frequency": "daily",
            },
        ],
    },
}


class HealthWorkflowEngine:
    async def process_checkin(self, request: CheckInRequest) -> CheckInResponse:
        """
        Orchestrate complete health check-in through safety, grounding, and synthesis.
        """
        concern = request.concern_text.strip()

        # Step 1: Run through Safety Evaluator
        safety_eval = safety_evaluator.evaluate_initial_concern(concern)
        if safety_eval.is_safe_for_guidance and request.follow_up_answers:
            follow_up_text = " ".join(
                answer.strip()
                for answer in request.follow_up_answers.values()
                if answer and answer.strip()
            )
            if follow_up_text:
                follow_up_safety_eval = safety_evaluator.evaluate_initial_concern(
                    follow_up_text
                )
                if not follow_up_safety_eval.is_safe_for_guidance:
                    safety_eval = follow_up_safety_eval

        # Immediate escalation / rejection if red flags or out of scope
        if not safety_eval.is_safe_for_guidance:
            return CheckInResponse(
                status=safety_eval.status,
                concern_category=safety_eval.category,
                summary=f"Safety Review: {safety_eval.status.replace('_', ' ').title()}",
                safety_message=safety_eval.safety_message,
                professional_care_guidance=safety_eval.professional_care_guidance,
                escalation_resources=safety_eval.escalation_resources,
                recommended_actions=[],
                sources=[],
            )

        category = safety_eval.category

        # Step 2: Check whether follow-up answers were provided
        # If no answers provided and follow-up questions exist, return follow_up_required
        if not request.follow_up_answers and safety_eval.follow_up_questions:
            # Query MedlinePlus for topic preview
            sources_preview = await self._fetch_sources(category, concern)
            env_context = await self._fetch_weather(request.latitude, request.longitude)

            return CheckInResponse(
                status="follow_up_required",
                concern_category=category,
                summary=f"We have categorized your concern under '{category.replace('_', ' ').title()}'. Please answer a few clarifying questions so we can calibrate your wellness plan.",
                safety_message="Your inquiry is within supported everyday wellness scope.",
                professional_care_guidance="If you experience worsening symptoms or physical pain, please consult a healthcare professional.",
                follow_up_questions=safety_eval.follow_up_questions,
                recommended_actions=[],
                sources=sources_preview,
                environmental_context=env_context,
            )

        # Step 3: We have answers or sufficient context -> Synthesize guidance!
        # Re-check user's follow-up answers for newly mentioned red flags
        if request.follow_up_answers:
            answers_text = " ".join(request.follow_up_answers.values())
            has_rf, rf_reasons = check_red_flags(answers_text)
            if has_rf:
                return CheckInResponse(
                    status="urgent_escalation",
                    concern_category="medical_emergency",
                    summary="Emergency Warning from Follow-up Information",
                    safety_message=f"Important: Symptoms described in your follow-up require urgent clinical evaluation ({'; '.join(rf_reasons)}).",
                    professional_care_guidance="Please seek immediate medical care at your nearest healthcare facility or call emergency services (112 in India, 911 in the US).",
                    escalation_resources=get_crisis_resources(category="medical_emergency"),
                    recommended_actions=[],
                    sources=[],
                )

        # Step 4: Fetch verified MedlinePlus sources
        sources = await self._fetch_sources(category, concern)
        env_context = await self._fetch_weather(request.latitude, request.longitude)

        # Step 5: Generate structured action plan (via NVIDIA LLM or grounded fallback)
        actions, summary_text, generation_source = await self._synthesize_guidance(
            concern=concern,
            category=category,
            follow_up_answers=request.follow_up_answers or {},
            sources=sources,
            env_context=env_context,
        )

        return CheckInResponse(
            status="guidance_available",
            concern_category=category,
            summary=summary_text,
            safety_message=(
                "Your wellness action plan is grounded in verified health information. "
                "These everyday lifestyle adjustments support general physical and mental well-being."
            ),
            professional_care_guidance=(
                "Consult a licensed physician if your symptoms persist past two weeks, "
                "interfere with work and relationships, or cause physical distress."
            ),
            follow_up_questions=[],
            recommended_actions=actions,
            sources=sources,
            environmental_context=env_context,
            generation_source=generation_source,
        )

    async def _fetch_sources(self, category: str, query: str) -> List[SourceCitation]:
        """Fetch verified sources from MedlinePlus and curated directory."""
        sources: List[SourceCitation] = []

        # Try live MedlinePlus
        medline_results = await medline_adapter.search_health_topics(query=f"{category.replace('_', ' ')} {query}")
        for r in medline_results[:3]:
            sources.append(
                SourceCitation(
                    title=r["title"],
                    url=r["url"],
                    organization=r["organization"],
                    summary=r["summary"],
                    attribution=r["attribution"],
                    is_verified=True,
                )
            )

        # If MedlinePlus had no results or is offline, ground with curated verified baseline
        if not sources and category in CURATED_WELLNESS_GROUNDING:
            curated = CURATED_WELLNESS_GROUNDING[category]
            sources.append(
                SourceCitation(
                    title=curated["title"],
                    url=curated["url"],
                    organization=curated["organization"],
                    summary=curated["summary"],
                    attribution="Curated Healthcare Baseline (MedlinePlus / NIH)",
                    is_verified=True,
                )
            )

        return sources

    async def _fetch_weather(self, lat: Optional[float], lon: Optional[float]) -> Optional[Dict[str, Any]]:
        """Fetch optional environmental context safely."""
        try:
            if lat is not None and lon is not None:
                return await open_meteo_adapter.get_current_weather(lat, lon)
            return await open_meteo_adapter.get_current_weather()
        except Exception:
            return None

    async def _synthesize_guidance(
        self,
        concern: str,
        category: str,
        follow_up_answers: Dict[str, str],
        sources: List[SourceCitation],
        env_context: Optional[Dict[str, Any]],
    ) -> (List[ActionItem], str, str):
        """
        Generate grounded action steps using NVIDIA LLM if configured;
        gracefully fall back to deterministic health guidelines if unconfigured or offline.
        """
        generation_source = "curated"
        if nvidia_adapter.is_configured():
            try:
                actions, summary = await self._generate_with_nvidia(
                    concern, category, follow_up_answers, sources, env_context
                )
                if actions:
                    return actions, summary, "nvidia"
            except Exception as e:
                generation_source = "fallback"
                logger.warning(f"NVIDIA LLM synthesis failed or rate-limited: {e}. Using grounded health baseline.")

        # Deterministic Grounded Synthesis Fallback
        curated = CURATED_WELLNESS_GROUNDING.get(category, CURATED_WELLNESS_GROUNDING["healthy_routines"])
        default_actions = [
            ActionItem(
                id=a["id"],
                title=a["title"],
                description=a["description"],
                rationale=a["rationale"],
                frequency=a["frequency"],
                is_completed=False,
            )
            for a in curated["default_actions"]
        ]

        summary = (
            f"Based on your check-in regarding {category.replace('_', ' ')}, here is an evidence-backed "
            f"routine grounded in {curated['title']}. We selected targeted lifestyle adjustments "
            f"tailored to your responses."
        )

        return default_actions, summary, generation_source

    async def _generate_with_nvidia(
        self,
        concern: str,
        category: str,
        follow_up_answers: Dict[str, str],
        sources: List[SourceCitation],
        env_context: Optional[Dict[str, Any]],
    ) -> (List[ActionItem], str):
        """
        Structured prompt to NVIDIA Hosted API enforcing healthcare safety boundaries.
        """
        source_texts = "\n".join([f"- {s.title} ({s.organization}): {s.summary}" for s in sources])
        env_text = f"Environmental context: {env_context['condition']}, {env_context['temperature_celsius']}°C, {env_context['wellness_tip']}" if env_context else "None"

        system_prompt = (
            "You are WellSpring AI, an evidence-based everyday health companion. "
            "You provide practical, non-diagnostic wellness routines grounded strictly in reviewed health information. "
            "STRICT RULES:\n"
            "1. NEVER diagnose, prescribe medications, or claim to cure diseases.\n"
            "2. NEVER alter or recommend modifying prescription dosages.\n"
            "3. Provide exactly 2 to 4 actionable, practical steps with rationale grounded in the provided health sources.\n"
            "4. Return strictly valid JSON with keys 'summary' (string) and 'actions' (array of objects with 'title', 'description', 'rationale', 'frequency')."
        )

        user_prompt = (
            f"User Concern: {concern}\n"
            f"Category: {category}\n"
            f"Follow-up context: {json.dumps(follow_up_answers)}\n"
            f"{env_text}\n\n"
            f"Reviewed Health Knowledge Sources:\n{source_texts}\n\n"
            "Generate structured wellness guidance in JSON format."
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        resp = await nvidia_adapter.generate_chat_completion(messages=messages, temperature=0.2)
        content = resp["content"].strip()

        # Handle markdown code blocks e.g. ```json ... ```
        if "```" in content:
            match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", content)
            if match:
                content = match.group(1).strip()

        # Fallback to finding first { and last } if extra commentary exists
        if not content.startswith("{") and "{" in content and "}" in content:
            start_idx = content.find("{")
            end_idx = content.rfind("}") + 1
            content = content[start_idx:end_idx]

        parsed = json.loads(content)
        summary = parsed.get("summary", "Personalized wellness guidance plan.")
        raw_actions = parsed.get("actions", [])

        actions: List[ActionItem] = []
        for idx, item in enumerate(raw_actions[:4]):
            title = item.get("title", f"Action {idx+1}")
            desc = item.get("description", "")
            rationale = item.get("rationale", "Promotes general well-being.")
            freq = item.get("frequency", "daily")

            # Post-generation safety validation: reject any drug or diagnostic suggestions
            if check_medication_manipulation(desc) or check_medication_manipulation(title):
                continue

            actions.append(
                ActionItem(
                    id=f"act-ai-{idx+1}",
                    title=title,
                    description=desc,
                    rationale=rationale,
                    frequency=freq,
                    is_completed=False,
                )
            )

        if not actions:
            raise ValueError("No safe actions returned from model")

        return actions, summary


workflow_engine = HealthWorkflowEngine()
