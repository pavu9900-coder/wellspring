"""
Configuration management for WellSpring AI backend.
Reads server-side environment variables with sensible defaults.
Never exposes secret credentials to clients.
"""

import os
from dataclasses import dataclass
from typing import Optional
from dotenv import load_dotenv

# Load .env if present
load_dotenv()


@dataclass
class Settings:
    app_env: str = os.getenv("APP_ENV", "development")
    backend_host: str = os.getenv("BACKEND_HOST", "127.0.0.1")
    backend_port: int = int(os.getenv("BACKEND_PORT", "8000"))
    frontend_origin: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")

    # NVIDIA Hosted LLM API
    nvidia_api_key: Optional[str] = os.getenv("NVIDIA_API_KEY") or None
    nvidia_base_url: str = os.getenv(
        "NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1"
    )
    nvidia_model: str = os.getenv(
        "NVIDIA_MODEL", "nvidia/nemotron-3.5-lightning-30b-a3b"
    )
    nvidia_timeout_seconds: int = int(os.getenv("NVIDIA_TIMEOUT_SECONDS", "60"))

    # Supabase PostgreSQL
    supabase_url: Optional[str] = os.getenv("SUPABASE_URL") or None
    supabase_publishable_key: Optional[str] = (
        os.getenv("SUPABASE_PUBLISHABLE_KEY") or None
    )
    supabase_service_role_key: Optional[str] = (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY") or None
    )

    # Health Knowledge & Grounding
    medlineplus_enabled: bool = (
        os.getenv("MEDLINEPLUS_ENABLED", "true").lower() == "true"
    )
    medlineplus_tool_name: str = os.getenv(
        "MEDLINEPLUS_TOOL_NAME", "wellspringhealth"
    )
    medlineplus_contact_email: Optional[str] = (
        os.getenv("MEDLINEPLUS_CONTACT_EMAIL") or None
    )

    # Optional Environmental Context
    open_meteo_enabled: bool = (
        os.getenv("OPEN_METEO_ENABLED", "true").lower() == "true"
    )


settings = Settings()
