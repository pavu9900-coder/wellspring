"""
MedlinePlus XML Web Service Adapter.
Connects to official NIH/NLM MedlinePlus search web service:
https://wsearch.nlm.nih.gov/ws/query?db=healthTopics&term=...
Safely parses XML with defusedxml, caches results, and attributes sources.
"""

import logging
import re
from typing import List, Dict, Any, Optional
import httpx
import defusedxml.ElementTree as ET
from app.config import settings

logger = logging.getLogger(__name__)

# Simple in-memory LRU-style cache
_CACHE: Dict[str, List[Dict[str, Any]]] = {}

CLEANR = re.compile("<.*?>")


def clean_html(raw_html: str) -> str:
    """Strip XML/HTML tags and decode common entities safely."""
    if not raw_html:
        return ""
    cleantext = re.sub(CLEANR, "", raw_html)
    cleantext = cleantext.replace("&quot;", '"').replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
    return " ".join(cleantext.split())


class MedlinePlusAdapter:
    BASE_URL = "https://wsearch.nlm.nih.gov/ws/query"

    def __init__(self, timeout: float = 10.0):
        self.timeout = timeout

    async def search_health_topics(self, query: str, max_results: int = 4) -> List[Dict[str, Any]]:
        """
        Query MedlinePlus Web Service for health topics.
        Returns parsed list of verified educational resources.
        """
        if not settings.medlineplus_enabled:
            logger.info("MedlinePlus integration is disabled by configuration.")
            return []

        clean_query = query.strip().lower()
        if not clean_query:
            return []

        # Check in-memory cache
        if clean_query in _CACHE:
            return _CACHE[clean_query][:max_results]

        params = {
            "db": "healthTopics",
            "term": clean_query,
            "retmax": str(max_results),
            "tool": settings.medlineplus_tool_name,
        }
        if settings.medlineplus_contact_email:
            params["email"] = settings.medlineplus_contact_email

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(self.BASE_URL, params=params)
                if response.status_code != 200:
                    logger.warning(f"MedlinePlus returned HTTP {response.status_code}")
                    return []

                content = response.text
                results = self._parse_xml_response(content)
                _CACHE[clean_query] = results
                return results[:max_results]
        except Exception as e:
            logger.error(f"Error querying MedlinePlus: {e}")
            return []

    def _parse_xml_response(self, xml_content: str) -> List[Dict[str, Any]]:
        """Safely parse MedlinePlus search XML response using defusedxml."""
        results: List[Dict[str, Any]] = []
        try:
            root = ET.fromstring(xml_content)
            # Find all document elements
            for doc in root.findall(".//document"):
                url = doc.get("url", "")
                title = ""
                organization = "U.S. National Library of Medicine / MedlinePlus"
                summary = ""

                for content in doc.findall("content"):
                    name = content.get("name")
                    text = content.text or ""
                    if name == "title":
                        title = clean_html(text)
                    elif name == "organizationName":
                        organization = clean_html(text) or organization
                    elif name == "FullSummary" or name == "snippet":
                        if not summary:
                            summary = clean_html(text)

                if title and url:
                    results.append(
                        {
                            "title": title,
                            "url": url,
                            "organization": organization,
                            "summary": summary[:400] + ("..." if len(summary) > 400 else ""),
                            "attribution": "National Library of Medicine (MedlinePlus)",
                            "is_verified": True,
                        }
                    )
        except Exception as err:
            logger.warning(f"Failed to parse MedlinePlus XML: {err}")

        return results


medline_adapter = MedlinePlusAdapter()
