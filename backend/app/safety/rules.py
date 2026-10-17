"""
Healthcare Safety Rules & Red Flag Definitions.
Deterministic safety boundaries evaluated BEFORE and AFTER any LLM call.
Never allows LLM to override safety rules or triage decisions.
"""

import re
from typing import List, Dict, Any, Tuple

# Severe Red Flag Patterns (Urgent Escalation)
EMERGENCY_PATTERNS = [
    # Cardiac / Vascular
    (re.compile(r"\b(chest\s+(pain|pressure|tightness|heaviness|discomfort)|pressure\s+in\s+chest|tightness\s+in\s+chest|pain\s+radiating\s+to\s+(arm|jaw|back))\b", re.I),
     "Potential cardiovascular emergency symptom (chest pain/pressure). Requires immediate emergency medical care."),
    
    # Respiratory Emergency
    (re.compile(r"\b(can'?t\s+breathe|trouble\s+breathing|difficulty\s+breathing|gasping\s+for\s+air|shortness\s+of\s+breath|severe\s+breathlessness|choking|blue\s+lips)\b", re.I),
     "Severe respiratory distress. Requires immediate emergency medical assistance."),
     
    # Neurological / Stroke
    (re.compile(r"\b(facial\s+droop|slurred\s+speech|sudden\s+numbness|sudden\s+paralysis|worst\s+headache\s+of\s+my\s+life|thunderclap\s+headache)\b", re.I),
     "Possible acute neurological event or stroke warning signs. Immediate emergency care needed."),
     
    # Self-Harm & Severe Crisis
    (re.compile(r"\b(kill\s+myself|want\s+to\s+die|suicide|suicidal|end\s+my\s+life|self[- ]harm|cut\s+myself|hurt\s+myself)\b", re.I),
     "Crisis and self-harm disclosure detected. Immediate human crisis intervention required."),
     
    # Severe Bleeding / Trauma
    (re.compile(r"\b(coughing\s+up\s+blood|vomiting\s+blood|severe\s+uncontrolled\s+bleeding|compound\s+fracture)\b", re.I),
     "Acute severe physical trauma or hemorrhage. Requires immediate emergency response."),
     
    # Severe Anaphylaxis
    (re.compile(r"\b(throat\s+closing|swollen\s+tongue|anaphylaxis|swelling\s+in\s+throat)\b", re.I),
     "Signs of severe allergic reaction / anaphylaxis. Immediate emergency epinephrine/medical response required."),
]

# Prescription / Medication Alteration Patterns
MEDICATION_ALTERATION_PATTERNS = [
    re.compile(r"\b(should\s+i\s+(stop|quit|increase|decrease|double|skip|change)(\s+taking)?\s+(my\s+)?(medication|medicine|pills|prescri|dose|antidepressant|insulin|statin))\b", re.I),
    re.compile(r"\b(what\s+dose\s+of\s+\w+\s+should\s+i\s+take)\b", re.I),
    re.compile(r"\b(prescribe\s+me|give\s+me\s+a\s+prescription)\b", re.I),
    re.compile(r"\b(double\s+my\s+dose|halve\s+my\s+dose|adjust\s+my\s+dose)\b", re.I),
]

# Supported Everyday Wellness Categories
SUPPORTED_CATEGORIES = {
    "sleep_hygiene": [
        "sleep", "insomnia", "waking up", "bedtime", "tired", "sleep schedule", "nap", "circadian"
    ],
    "everyday_stress": [
        "stress", "burnout", "overwhelmed", "tension", "relaxation", "mindfulness", "work pressure"
    ],
    "healthy_routines": [
        "hydration", "morning routine", "water intake", "habit", "daily walk", "screen time", "posture"
    ],
    "light_physical_wellness": [
        "stiff neck", "mild back ache", "eye strain", "light fatigue", "desk ergonomics", "sore muscles"
    ],
}

# Explicitly Unsupported Diagnostic / Complex Scenarios
UNSUPPORTED_DOMAINS = [
    (re.compile(r"\b(cancer|tumor|chemotherapy|biopsy|malignan)\b", re.I), "Oncology and complex neoplastic conditions"),
    (re.compile(r"\b(pregnancy|fetus|labor\s+contractions|miscarriage|trimester)\b", re.I), "Obstetrics and pregnancy-related medical care"),
    (re.compile(r"\b(infant|newborn|baby|pediatric|toddler)\b", re.I), "Pediatric and infant acute care"),
    (re.compile(r"\b(diagnose\s+me|what\s+disease\s+do\s+i\s+have)\b", re.I), "Autonomous medical diagnosis of unknown pathologies"),
]


def check_red_flags(text: str) -> Tuple[bool, List[str]]:
    """
    Scan text for immediate life-safety red flags.
    Returns (has_red_flags, list_of_warning_reasons).
    """
    reasons = []
    for pattern, description in EMERGENCY_PATTERNS:
        if pattern.search(text):
            reasons.append(description)
    return (len(reasons) > 0, reasons)


def check_medication_manipulation(text: str) -> bool:
    """Check if the user is asking to alter or prescribe prescription medicines."""
    for pattern in MEDICATION_ALTERATION_PATTERNS:
        if pattern.search(text):
            return True
    return False


def identify_unsupported_domain(text: str) -> Tuple[bool, str]:
    """Check if inquiry falls strictly outside supported wellness boundaries."""
    for pattern, domain in UNSUPPORTED_DOMAINS:
        if pattern.search(text):
            return (True, domain)
    return (False, "")


def classify_wellness_category(text: str) -> str:
    """Classify the input into one of the supported everyday wellness categories."""
    clean = text.lower()
    for cat, keywords in SUPPORTED_CATEGORIES.items():
        if any(kw in clean for kw in keywords):
            return cat
    return "general_wellness"
