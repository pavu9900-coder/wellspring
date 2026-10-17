"""
Curated local, national, and international crisis & emergency health resources.
Verified official numbers and service scopes.
Never fabricate contact info or present self-care as an alternative to emergency care.
"""

from typing import List, Dict, Any


CRISIS_RESOURCES: List[Dict[str, Any]] = [
    {
        "id": "tele-manas",
        "name": "Tele-MANAS (National Tele Mental Health Programme)",
        "region": "India",
        "number": "14416 / 1800-891-4416",
        "description": "24/7 free, confidential mental health counseling and crisis support in multiple Indian regional languages.",
        "category": "mental_health_crisis",
        "official_url": "https://telemanas.mohfw.gov.in/",
        "is_emergency": True,
    },
    {
        "id": "india-emergency",
        "name": "Emergency Services (Police, Fire, Ambulance)",
        "region": "India",
        "number": "112",
        "description": "Unified national emergency helpline for immediate medical, accident, or physical safety emergencies.",
        "category": "medical_emergency",
        "official_url": "https://112.gov.in/",
        "is_emergency": True,
    },
    {
        "id": "kiran-helpline",
        "name": "KIRAN Mental Health Helpline",
        "region": "India",
        "number": "1800-599-0019",
        "description": "24/7 toll-free helpline providing psychological support, stress management, and mental health rehabilitation.",
        "category": "mental_health_support",
        "official_url": "https://depwd.gov.in/",
        "is_emergency": False,
    },
    {
        "id": "us-lifeline",
        "name": "Suicide & Crisis Lifeline (988)",
        "region": "United States",
        "number": "988",
        "description": "24/7 free and confidential support for people in distress, prevention, and crisis resources.",
        "category": "mental_health_crisis",
        "official_url": "https://988lifeline.org/",
        "is_emergency": True,
    },
    {
        "id": "us-emergency",
        "name": "US Emergency Services",
        "region": "United States",
        "number": "911",
        "description": "Immediate emergency medical response, police, and ambulance dispatch.",
        "category": "medical_emergency",
        "official_url": "https://www.911.gov/",
        "is_emergency": True,
    },
]


def get_crisis_resources(category: str = None, region: str = None) -> List[Dict[str, Any]]:
    results = CRISIS_RESOURCES
    if category:
        results = [r for r in results if r["category"] == category or r["is_emergency"]]
    if region:
        results = [r for r in results if r["region"].lower() == region.lower() or r["is_emergency"]]
    return results
