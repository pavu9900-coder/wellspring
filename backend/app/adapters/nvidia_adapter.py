"""
NVIDIA Hosted LLM API Adapter.
Implements robust communication with https://integrate.api.nvidia.com/v1/chat/completions.
Handles rate limits, timeouts, structured JSON extraction, and provider failures.
Never logs sensitive patient narratives or API credentials.
"""

import json
import logging
import asyncio
from typing import List, Dict, Any, Optional
import httpx
from app.config import settings

logger = logging.getLogger(__name__)


class NvidiaAPIError(Exception):
    """Custom exception for NVIDIA hosted API interactions."""
    def __init__(self, message: str, status_code: Optional[int] = None, is_retryable: bool = False):
        super().__init__(message)
        self.status_code = status_code
        self.is_retryable = is_retryable


class NvidiaAdapter:
    def __init__(self):
        self.base_url = settings.nvidia_base_url.rstrip("/")
        self.endpoint = f"{self.base_url}/chat/completions"
        self.model = settings.nvidia_model
        self.api_key = settings.nvidia_api_key
        # Honor the configured provider timeout; the workflow has a safe,
        # evidence-grounded fallback if the hosted provider is unreachable.
        self.timeout = float(settings.nvidia_timeout_seconds)

    def is_configured(self) -> bool:
        """Check if NVIDIA API key is configured."""
        return bool(self.api_key and self.api_key.strip())

    async def generate_chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.2,
        max_tokens: int = 1536,
        response_format_json: bool = True,
    ) -> Dict[str, Any]:
        """
        Execute request to NVIDIA hosted chat completions endpoint.
        Uses bounded retries for transient HTTP 429 / 5xx network errors.
        """
        if not self.is_configured():
            raise NvidiaAPIError(
                "NVIDIA API Key is not configured. Please supply NVIDIA_API_KEY in server environment.",
                status_code=503,
                is_retryable=False,
            )

        headers = {
            "Authorization": f"Bearer {self.api_key.strip()}",
            "Content-Type": "application/json",
            "Accept": "text/event-stream",
        }

        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True,
        }

        if response_format_json and "nemotron" not in self.model.lower():
            payload["response_format"] = {"type": "json_object"}

        max_attempts = 2
        current_payload = dict(payload)

        for attempt in range(1, max_attempts + 1):
            try:
                timeout = httpx.Timeout(self.timeout, connect=min(self.timeout, 5.0))
                async with httpx.AsyncClient(timeout=timeout) as client:
                    async with client.stream(
                        "POST", self.endpoint, json=current_payload, headers=headers
                    ) as response:
                        if response.status_code == 200:
                            content_parts: List[str] = []
                            reasoning_parts: List[str] = []
                            usage: Dict[str, Any] = {}

                            async for line in response.aiter_lines():
                                event = line[5:].strip() if line.startswith("data:") else line.strip()
                                if not event:
                                    continue
                                if event == "[DONE]":
                                    break
                                try:
                                    data = json.loads(event)
                                except json.JSONDecodeError:
                                    continue

                                if data.get("usage"):
                                    usage = data["usage"]
                                for choice in data.get("choices", []):
                                    delta = choice.get("delta") or choice.get("message") or {}
                                    content = delta.get("content")
                                    reasoning = delta.get("reasoning_content")
                                    if isinstance(content, str) and content:
                                        content_parts.append(content)
                                    elif isinstance(content, list):
                                        content_parts.extend(
                                            part.get("text", "")
                                            for part in content
                                            if isinstance(part, dict)
                                        )
                                    if isinstance(reasoning, str) and reasoning:
                                        reasoning_parts.append(reasoning)

                            content_str = "".join(content_parts or reasoning_parts)
                            if not content_str:
                                raise NvidiaAPIError(
                                    "NVIDIA API returned empty message content", status_code=502
                                )
                            return {
                                "content": content_str,
                                "model": self.model,
                                "usage": usage,
                            }

                        status_code = response.status_code
                        error_body = (await response.aread()).decode("utf-8", errors="replace")

                if status_code == 400 and "response_format" in current_payload:
                    # Some models do not support response_format; retry without it.
                    logger.info("response_format parameter not supported by model; retrying without it.")
                    del current_payload["response_format"]
                    continue

                elif status_code in (401, 403):
                    logger.error("NVIDIA API authentication failed. Check NVIDIA_API_KEY.")
                    raise NvidiaAPIError(
                        "Authentication with NVIDIA API failed. Check your NVIDIA_API_KEY.",
                        status_code=status_code,
                        is_retryable=False,
                    )

                elif status_code == 429:
                    logger.warning(f"NVIDIA API rate limit hit (attempt {attempt}/{max_attempts})")
                    if attempt < max_attempts:
                        await asyncio.sleep(2.0 * attempt)
                        continue
                    raise NvidiaAPIError(
                        "NVIDIA API rate limit exceeded. Please try again shortly.",
                        status_code=status_code,
                        is_retryable=True,
                    )

                elif status_code >= 500:
                    logger.warning(f"NVIDIA API upstream 5xx error: {status_code} (attempt {attempt})")
                    if attempt < max_attempts:
                        await asyncio.sleep(1.5 * attempt)
                        continue
                    raise NvidiaAPIError(
                        f"NVIDIA API upstream server error ({status_code})",
                        status_code=status_code,
                        is_retryable=True,
                    )

                else:
                    error_msg = f"NVIDIA API error: HTTP {status_code} - {error_body}"
                    logger.error(error_msg)
                    raise NvidiaAPIError(error_msg, status_code=status_code, is_retryable=False)

            except httpx.TimeoutException:
                logger.warning(f"NVIDIA API timed out after {self.timeout}s")
                raise NvidiaAPIError("NVIDIA API request timed out", status_code=504, is_retryable=True)

            except httpx.RequestError as exc:
                logger.error(f"Network error connecting to NVIDIA API: {type(exc).__name__}")
                if attempt < max_attempts:
                    await asyncio.sleep(1.0)
                    continue
                raise NvidiaAPIError(f"Connection failure to NVIDIA API: {exc}", status_code=503, is_retryable=True)

        raise NvidiaAPIError("Failed to communicate with NVIDIA API after bounded retries", status_code=503)

nvidia_adapter = NvidiaAdapter()
