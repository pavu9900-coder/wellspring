"""
Open-Meteo Environmental Context Adapter.
Provides optional weather and environmental context for wellness planning.
Never uses environmental data for diagnosis or unsupported claims.
"""

import logging
from typing import Dict, Any, Optional
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

# Weather code descriptions (WMO interpretation)
WMO_CODES = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    51: "Light drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    71: "Slight snow fall",
    80: "Rain showers",
    95: "Thunderstorm",
}


class OpenMeteoAdapter:
    BASE_URL = "https://api.open-meteo.com/v1/forecast"

    def __init__(self, timeout: float = 6.0):
        self.timeout = timeout

    async def get_current_weather(
        self, latitude: float = 28.6139, longitude: float = 77.2090  # Default New Delhi
    ) -> Optional[Dict[str, Any]]:
        """
        Fetch current weather metrics for optional environmental wellness tips.
        Safe fallback if service is unreachable.
        """
        if not settings.open_meteo_enabled:
            return None

        params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": "temperature_2m,relative_humidity_2m,weather_code,is_day",
            "hourly": "uv_index",
            "forecast_days": 1,
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.get(self.BASE_URL, params=params)
                if res.status_code != 200:
                    return None
                data = res.json()
                current = data.get("current", {})
                temp = current.get("temperature_2m")
                humidity = current.get("relative_humidity_2m")
                code = current.get("weather_code", 0)
                condition = WMO_CODES.get(code, "Clear")

                # Tips based strictly on routine physical comfort
                wellness_tip = "Pleasant conditions for light outdoor physical activity."
                if temp and temp > 34:
                    wellness_tip = "High ambient heat: ensure adequate hydration and schedule brisk walks in early morning or evening."
                elif temp and temp < 10:
                    wellness_tip = "Chilly conditions: consider warm indoor stretches and adequate layering."
                elif humidity and humidity > 80:
                    wellness_tip = "High humidity: stay well-hydrated and opt for breathable natural fabrics."

                return {
                    "temperature_celsius": temp,
                    "humidity_percent": humidity,
                    "condition": condition,
                    "wellness_tip": wellness_tip,
                    "source": "Open-Meteo Environmental Service",
                }
        except Exception as e:
            logger.debug(f"Open-Meteo weather fetch skipped/failed: {e}")
            return None


open_meteo_adapter = OpenMeteoAdapter()
