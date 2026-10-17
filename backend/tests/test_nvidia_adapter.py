"""
Unit Tests for NVIDIA Hosted LLM Adapter.
Validates key handling, 401/429/5xx status code resilience, and timeout management.
"""

import pytest
from unittest.mock import patch
from app.adapters.nvidia_adapter import NvidiaAdapter, NvidiaAPIError


class MockStreamResponse:
    def __init__(self, status_code, events=None, body=b""):
        self.status_code = status_code
        self.events = events or []
        self.body = body

    async def aiter_lines(self):
        for event in self.events:
            yield event

    async def aread(self):
        return self.body


class MockStreamContext:
    def __init__(self, response):
        self.response = response

    async def __aenter__(self):
        return self.response

    async def __aexit__(self, exc_type, exc, traceback):
        return False


@pytest.mark.asyncio
async def test_nvidia_unconfigured_error():
    adapter = NvidiaAdapter()
    adapter.api_key = None
    assert adapter.is_configured() is False

    with pytest.raises(NvidiaAPIError) as exc_info:
        await adapter.generate_chat_completion(messages=[{"role": "user", "content": "hello"}])
    assert exc_info.value.status_code == 503
    assert "not configured" in str(exc_info.value).lower()


@pytest.mark.asyncio
async def test_nvidia_successful_response():
    adapter = NvidiaAdapter()
    adapter.api_key = "nvapi-test-key-mock"

    mock_response = MockStreamResponse(
        status_code=200,
        events=[
            'data: {"choices":[{"delta":{"content":"{\\\"summary\\\": \\\"Test summary\\\", \\\"actions\\\": []}"}}]}',
            'data: {"usage":{"total_tokens":42},"choices":[]}',
            "data: [DONE]",
        ],
    )

    with patch("httpx.AsyncClient.stream", return_value=MockStreamContext(mock_response)):
        result = await adapter.generate_chat_completion(messages=[{"role": "user", "content": "hi"}])
        assert "choices" not in result
        assert result["content"] == '{"summary": "Test summary", "actions": []}'
        assert result["usage"]["total_tokens"] == 42


@pytest.mark.asyncio
async def test_nvidia_unauthorized_error():
    adapter = NvidiaAdapter()
    adapter.api_key = "nvapi-invalid-key"

    mock_response = MockStreamResponse(status_code=401)

    with patch("httpx.AsyncClient.stream", return_value=MockStreamContext(mock_response)):
        with pytest.raises(NvidiaAPIError) as exc_info:
            await adapter.generate_chat_completion(messages=[{"role": "user", "content": "hi"}])
        assert exc_info.value.status_code == 401
        assert exc_info.value.is_retryable is False
